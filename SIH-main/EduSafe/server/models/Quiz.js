const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [500, 'Option text cannot exceed 500 characters']
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, {
  _id: true // Enable _id for options
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question text cannot exceed 1000 characters']
  },
  options: [optionSchema],
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1'],
    max: [10, 'Points cannot exceed 10']
  },
  type: {
    type: String,
    enum: {
      values: ['multiple-choice', 'single-choice', 'true-false'],
      message: 'Question type must be multiple-choice, single-choice, or true-false'
    },
    default: 'single-choice'
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Question order must be at least 1']
  },
  timeLimit: {
    type: Number, // in seconds
    default: 60,
    min: [10, 'Time limit must be at least 10 seconds'],
    max: [600, 'Time limit cannot exceed 10 minutes']
  },
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be easy, medium, or hard'
    },
    default: 'medium'
  }
}, {
  timestamps: true
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Quiz title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Quiz description cannot exceed 500 characters']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module reference is required']
  },
  questions: [questionSchema],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Quiz instructor is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timeLimit: {
    type: Number, // Total quiz time in minutes
    default: 30,
    min: [5, 'Quiz time limit must be at least 5 minutes'],
    max: [180, 'Quiz time limit cannot exceed 3 hours']
  },
  passingScore: {
    type: Number,
    default: 70, // Percentage
    min: [0, 'Passing score cannot be less than 0'],
    max: [100, 'Passing score cannot exceed 100']
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: [1, 'Max attempts must be at least 1'],
    max: [10, 'Max attempts cannot exceed 10']
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showExplanations: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
quizSchema.index({ module: 1 });
quizSchema.index({ instructor: 1 });
quizSchema.index({ isPublished: 1, isActive: 1 });
quizSchema.index({ category: 1 });

// Virtual for total questions count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for average question time
quizSchema.virtual('averageQuestionTime').get(function() {
  if (this.questions.length === 0) return 0;
  return this.questions.reduce((total, question) => total + question.timeLimit, 0) / this.questions.length;
});

// Pre-save middleware to validate questions
quizSchema.pre('save', function(next) {
  // Validate that each question has at least 2 options
  for (let question of this.questions) {
    if (question.options.length < 2) {
      return next(new Error('Each question must have at least 2 options'));
    }
    
    // Validate that there's at least one correct answer
    const correctOptions = question.options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('Each question must have at least one correct answer'));
    }
    
    // For single-choice questions, ensure only one correct answer
    if (question.type === 'single-choice' && correctOptions.length > 1) {
      return next(new Error('Single-choice questions can only have one correct answer'));
    }
  }
  
  // Validate that quiz has at least one question
  if (this.questions.length === 0) {
    return next(new Error('Quiz must have at least one question'));
  }
  
  next();
});

// Method to add a question
quizSchema.methods.addQuestion = function(questionData) {
  const questionOrder = this.questions.length + 1;
  const question = {
    ...questionData,
    order: questionOrder
  };
  this.questions.push(question);
  return this.save();
};

// Method to update question order
quizSchema.methods.updateQuestionOrder = function(questionId, newOrder) {
  const question = this.questions.id(questionId);
  if (question) {
    question.order = newOrder;
    return this.save();
  }
  throw new Error('Question not found');
};

// Method to get questions by difficulty
quizSchema.methods.getQuestionsByDifficulty = function(difficulty) {
  return this.questions.filter(question => question.difficulty === difficulty);
};

// Method to shuffle questions
quizSchema.methods.shuffleQuestions = function() {
  if (this.randomizeQuestions) {
    this.questions.sort(() => Math.random() - 0.5);
  }
  return this.questions;
};

// Method to shuffle options for all questions
quizSchema.methods.shuffleOptions = function() {
  if (this.randomizeOptions) {
    this.questions.forEach(question => {
      question.options.sort(() => Math.random() - 0.5);
    });
  }
  return this.questions;
};

// Static method to find quizzes by module
quizSchema.statics.findByModule = function(moduleId) {
  return this.find({ module: moduleId, isPublished: true, isActive: true });
};

// Static method to find quizzes by instructor
quizSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId });
};

// Static method to find quizzes by category
quizSchema.statics.findByCategory = function(category) {
  return this.find({ category, isPublished: true, isActive: true });
};

// Static method to find quizzes by difficulty
quizSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ 
    'questions.difficulty': difficulty, 
    isPublished: true, 
    isActive: true 
  });
};

module.exports = mongoose.model('Quiz', quizSchema);
