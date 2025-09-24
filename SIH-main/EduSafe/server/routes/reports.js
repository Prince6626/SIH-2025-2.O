const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Report = require('../models/Report');
const { authenticateToken, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer storage for image uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `report-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private (requires authentication)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      category,
      priority = 'Medium',
      tags = [],
      isAnonymous = false,
      isPublic = false,
      geoLat,
      geoLng,
      geoAccuracy
    } = req.body;

    // Validation
    if (!title || !description || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, location, and category are required'
      });
    }

    // Validate category
    const validCategories = ['Safety', 'Bullying', 'Infrastructure', 'Academic', 'Behavioral', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      });
    }

    // Validate priority
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
    }

    // Build image URL if file uploaded
    let imageUrl = undefined;
    if (req.file) {
      const envBase = process.env.SERVER_BASE_URL || '';
      const base = envBase || `${req.protocol}://${req.get('host')}`;
      const maybeSlash = base && !base.endsWith('/') ? '/' : '';
      const relativePath = `uploads/${req.file.filename}`;
      imageUrl = `${base}${maybeSlash}${relativePath}`;
    }

    // Create new report
    const report = new Report({
      title,
      description,
      location,
      imageUrl,
      category,
      priority,
      tags,
      isAnonymous,
      isPublic,
      reportedBy: req.user._id,
      geo: {
        lat: geoLat ? Number(geoLat) : undefined,
        lng: geoLng ? Number(geoLng) : undefined,
        accuracy: geoAccuracy ? Number(geoAccuracy) : undefined
      }
    });

    await report.save();

    // Populate the reportedBy field for response
    await report.populate('reportedBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating report'
    });
  }
});

// @route   GET /api/reports
// @desc    Fetch all reports (for teachers/principals dashboard)
// @access  Private (requires teacher or admin role)
router.get('/', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Add status filter
    if (status && ['Pending', 'Investigating', 'Resolved'].includes(status)) {
      filter.status = status;
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add priority filter
    if (priority && ['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      filter.priority = priority;
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
    const reports = await Report.find(filter)
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('resolution.resolvedBy', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReports: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
});

// @route   GET /api/reports/my-reports
// @desc    Fetch reports created by the authenticated user
// @access  Private (requires authentication)
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category
    } = req.query;

    // Build filter object
    const filter = {
      reportedBy: req.user._id
    };

    // Add status filter
    if (status && ['Pending', 'Investigating', 'Resolved'].includes(status)) {
      filter.status = status;
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const reports = await Report.find(filter)
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('resolution.resolvedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReports: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user reports'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Fetch a single report by ID
// @access  Private (requires authentication)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format'
      });
    }

    const report = await Report.findById(id)
      .populate('reportedBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('resolution.resolvedBy', 'username email')
      .populate('comments.user', 'username email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can view this report
    // Users can view their own reports, teachers can view all reports
    if (req.user.role !== 'teacher' && req.user.role !== 'admin' && 
        !report.reportedBy._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own reports.'
      });
    }

    res.json({
      success: true,
      data: {
        report
      }
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
});

// @route   GET /api/reports/stats/summary
// @desc    Get report statistics for dashboard
// @access  Private (requires teacher or admin role)
router.get('/stats/summary', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'Pending' });
    const investigatingReports = await Report.countDocuments({ status: 'Investigating' });
    const resolvedReports = await Report.countDocuments({ status: 'Resolved' });

    // Get reports by category
    const categoryStats = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get reports by priority
    const priorityStats = await Report.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = await Report.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        investigatingReports,
        resolvedReports,
        recentReports,
        categoryStats,
        priorityStats
      }
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report statistics'
    });
  }
});

// @route   PATCH /api/reports/:id/resolve
// @desc    Mark a report as Resolved with optional resolution description
// @access  Private (requires teacher or admin role)
router.patch('/:id/resolve', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status === 'Resolved') {
      return res.status(200).json({
        success: true,
        message: 'Report already resolved',
        data: { report }
      });
    }

    await report.resolve(req.user._id, description || 'Resolved');
    await report.populate('reportedBy', 'username email');
    await report.populate('resolution.resolvedBy', 'username email');

    res.json({
      success: true,
      message: 'Report marked as resolved',
      data: { report }
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resolving report'
    });
  }
});

module.exports = router;
