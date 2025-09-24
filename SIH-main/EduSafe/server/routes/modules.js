const express = require('express');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const { authenticateToken, requireTeacherOrAdmin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/modules
// @desc    Fetch all available modules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {
      isPublished: true,
      isActive: true
    };

    // Add difficulty filter
    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    // Add category filter
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Add search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const modules = await Module.find(filter)
      .populate('instructor', 'username email')
      .select('-lessons') // Exclude lessons for list view
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Module.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        modules,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalModules: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching modules'
    });
  }
});

// @route   POST /api/modules
// @desc    Create a new module (Admin or Teacher). For disaster modules set category to "Disaster".
// @access  Protected (admin/teacher)
router.post('/', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      duration,
      estimatedHours,
      category = 'Disaster',
      tags = [],
      thumbnail,
      introVideoUrl,
      isPublished = true,
      isActive = true,
      notes
    } = req.body;

    if (!title || !description || !difficulty || !duration || !estimatedHours) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const moduleDoc = await Module.create({
      title,
      description,
      difficulty,
      duration,
      estimatedHours,
      category,
      tags,
      thumbnail,
      introVideoUrl,
      instructor: req.user._id,
      isPublished,
      isActive,
      lessons: [],
      notes
    });

    return res.status(201).json({ success: true, data: { module: moduleDoc } });
  } catch (error) {
    console.error('Error creating module:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    return res.status(500).json({ success: false, message: 'Server error while creating module' });
  }
});

// @route   PUT /api/modules/:id
// @desc    Update an existing module (Admin or Teacher who owns it)
// @access  Protected (admin/teacher)
router.put('/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid module ID format' });
    }

    const moduleDoc = await Module.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    // If not admin, ensure instructor matches current user
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && String(moduleDoc.instructor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this module' });
    }

    const allowed = ['title','description','difficulty','duration','estimatedHours','category','tags','thumbnail','introVideoUrl','isPublished','isActive','notes'];
    allowed.forEach(key => {
      if (key in req.body) moduleDoc[key] = req.body[key];
    });

    await moduleDoc.save();
    return res.json({ success: true, data: { module: moduleDoc } });
  } catch (error) {
    console.error('Error updating module:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    return res.status(500).json({ success: false, message: 'Server error while updating module' });
  }
});

// @route   GET /api/modules/:id
// @desc    Fetch a single module's details by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID format'
      });
    }

    const module = await Module.findOne({
      _id: id,
      isPublished: true,
      isActive: true
    })
    .populate('instructor', 'username email')
    .populate('prerequisites', 'title description difficulty');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Add virtual fields to response
    const moduleData = {
      ...module.toObject(),
      lessonCount: module.lessonCount,
      totalEstimatedTime: module.totalEstimatedTime
    };

    res.json({
      success: true,
      data: {
        module: moduleData
      }
    });

  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching module'
    });
  }
});

// @route   GET /api/modules/:id/quiz
// @desc    Fetch the quiz associated with a module
// @access  Public
router.get('/:id/quiz', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID format'
      });
    }

    // First check if module exists
    const module = await Module.findOne({
      _id: id,
      isPublished: true,
      isActive: true
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Find quiz associated with the module
    const quiz = await Quiz.findOne({
      module: id,
      isPublished: true,
      isActive: true
    })
    .populate('instructor', 'username email')
    .select('-questions.options.isCorrect'); // Hide correct answers for security

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this module'
      });
    }

    // Add virtual fields to response
    const quizData = {
      ...quiz.toObject(),
      questionCount: quiz.questionCount,
      totalPoints: quiz.totalPoints,
      averageQuestionTime: quiz.averageQuestionTime
    };

    res.json({
      success: true,
      data: {
        quiz: quizData
      }
    });

  } catch (error) {
    console.error('Error fetching module quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching module quiz'
    });
  }
});

// @route   GET /api/modules/:id/quiz/admin
// @desc    Fetch full quiz including correct answers (admin use)
// @access  Public (consider protecting later)
router.get('/:id/quiz/admin', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID format'
      });
    }

    // Ensure module exists
    const moduleExists = await Module.exists({ _id: id });
    if (!moduleExists) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const quiz = await Quiz.findOne({ module: id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'No quiz found for this module' });
    }

    res.json({ success: true, data: { quiz } });
  } catch (error) {
    console.error('Error fetching admin quiz:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching admin quiz' });
  }
});

// @route   GET /api/modules/:id/lessons
// @desc    Fetch lessons for a specific module
// @access  Public
router.get('/:id/lessons', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID format'
      });
    }

    const module = await Module.findOne({
      _id: id,
      isPublished: true,
      isActive: true
    })
    .select('lessons title');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Sort lessons by order
    const sortedLessons = module.lessons.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        moduleTitle: module.title,
        lessons: sortedLessons
      }
    });

  } catch (error) {
    console.error('Error fetching module lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching module lessons'
    });
  }
});

// @route   POST /api/modules/:id/complete
// @desc    Mark module as completed by current user and award points
// @access  Protected (student, teacher, admin)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid module ID format' });
    }

    const moduleDoc = await Module.findOne({ _id: id, isActive: true });
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    // Award points based on lesson count (e.g., 2 points per lesson)
    const lessonCount = moduleDoc.lessons?.length || 0;
    const baseAward = Math.max(5, Math.min(50, lessonCount * 2));

    try {
      const user = req.user;
      user.points = (user.points || 0) + baseAward;
      await user.save();
      return res.json({ success: true, data: { pointsAwarded: baseAward, userTotalPoints: user.points } });
    } catch (e) {
      console.error('Failed to award module completion points:', e);
      return res.status(500).json({ success: false, message: 'Failed to award points' });
    }
  } catch (error) {
    console.error('Error completing module:', error);
    return res.status(500).json({ success: false, message: 'Server error while completing module' });
  }
});

// @route   POST /api/modules/:id/quiz/questions
// @desc    Add a quiz question to a module's quiz (creates quiz if missing)
// @access  Public (consider protecting later)
router.post('/:id/quiz/questions', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      questionText,
      options,
      explanation = '',
      points = 1,
      type = 'single-choice',
      timeLimit = 60,
      difficulty = 'medium'
    } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid module ID format' });
    }

    // Basic validation
    if (!questionText || !Array.isArray(options)) {
      return res.status(400).json({ success: false, message: 'questionText and options are required' });
    }
    if (options.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 options are required' });
    }
    const correctCount = options.filter(o => !!o.isCorrect).length;
    if (correctCount === 0) {
      return res.status(400).json({ success: false, message: 'At least one option must be correct' });
    }
    if (type === 'single-choice' && correctCount > 1) {
      return res.status(400).json({ success: false, message: 'Single-choice question can only have one correct answer' });
    }

    // Ensure module exists and active/published
    const moduleDoc = await Module.findOne({ _id: id, isActive: true });
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    // Find or create quiz for module
    let quiz = await Quiz.findOne({ module: id });
    if (!quiz) {
      quiz = new Quiz({
        title: `${moduleDoc.title} Quiz`,
        description: `Auto-generated quiz for ${moduleDoc.title}`,
        module: moduleDoc._id,
        instructor: moduleDoc.instructor,
        isPublished: true,
        isActive: true,
        timeLimit: 30,
        passingScore: 70,
        maxAttempts: 3,
        showCorrectAnswers: true,
        showExplanations: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        tags: moduleDoc.tags || [],
        category: moduleDoc.category || ''
      });
    }

    // Determine order
    const order = (quiz.questions?.length || 0) + 1;
    const normalizedOptions = options.map(opt => ({ text: opt.text, isCorrect: !!opt.isCorrect }));
    quiz.questions.push({
      questionText,
      options: normalizedOptions,
      explanation,
      points: Number(points) || 1,
      type,
      order,
      timeLimit: Number(timeLimit) || 60,
      difficulty
    });

    await quiz.save();

    // Hide correct flags in options from response by default
    const responseQuiz = await Quiz.findById(quiz._id)
      .select('-questions.options.isCorrect')
      .lean();

    return res.status(201).json({ success: true, message: 'Question added', data: { quiz: responseQuiz } });
  } catch (error) {
    console.error('Error adding quiz question:', error);
    return res.status(500).json({ success: false, message: 'Server error while adding quiz question' });
  }
});

// @route   POST /api/modules/:id/quiz/submit
// @desc    Submit quiz answers and compute score. Awards points if passed.
// @access  Protected (student, teacher, admin)
router.post('/:id/quiz/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID format'
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }

    const quiz = await Quiz.findOne({
      module: id,
      isPublished: true,
      isActive: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this module'
      });
    }

    // Build a map for quick lookup
    const questionIdToQuestion = new Map();
    quiz.questions.forEach(q => questionIdToQuestion.set(String(q._id), q));

    let correctCount = 0;
    let totalQuestions = quiz.questions.length;
    let scorePoints = 0;
    const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 1), 0);

    const detailed = answers.map(ans => {
      const question = questionIdToQuestion.get(String(ans.questionId));
      if (!question) {
        return {
          questionId: ans.questionId,
          correct: false,
          pointsAwarded: 0,
          pointsPossible: question ? (question.points || 1) : 1
        };
      }
      const selected = question.options.id(ans.optionId);
      const isCorrect = !!(selected && selected.isCorrect);
      if (isCorrect) {
        correctCount += 1;
        scorePoints += question.points || 1;
      }
      return {
        questionId: String(question._id),
        correct: isCorrect,
        pointsAwarded: isCorrect ? (question.points || 1) : 0,
        pointsPossible: question.points || 1
      };
    });

    const percentage = totalPoints > 0 ? Math.round((scorePoints / totalPoints) * 100) : 0;

    // Award points if passing
    let pointsAwarded = 0;
    let userTotalPoints = undefined;
    const passed = percentage >= (quiz.passingScore || 0);
    if (passed) {
      const award = scorePoints; // award total earned points on correct answers
      pointsAwarded = award;
      try {
        const user = req.user;
        user.points = (user.points || 0) + award;
        await user.save();
        userTotalPoints = user.points;
      } catch (e) {
        console.error('Failed to award points:', e);
      }
    }

    return res.json({
      success: true,
      data: {
        correctCount,
        totalQuestions,
        scorePoints,
        totalPoints,
        percentage,
        passed,
        pointsAwarded,
        userTotalPoints,
        detailed
      }
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting quiz'
    });
  }
});

module.exports = router;
