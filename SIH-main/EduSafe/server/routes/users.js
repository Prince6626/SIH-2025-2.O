const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireStudent } = require('../middleware/auth');

// GET /api/users/leaderboard - Get top users by points
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Find students only, sort by points in descending order, limit to requested number
    const leaderboard = await User.find({ role: 'student' })
      .select('username points role')
      .sort({ points: -1 })
      .limit(limit);
    
    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));
    
    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      data: rankedLeaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/me - Update current user profile (students only for these fields)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const allowed = ['username', 'age', 'bloodGroup', 'parentMobile', 'dateOfBirth', 'profilePhoto'];
    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    // Normalize
    if (typeof update.username === 'string') update.username = update.username.trim();
    if (typeof update.bloodGroup === 'string') update.bloodGroup = update.bloodGroup.trim().toUpperCase();
    if (typeof update.parentMobile === 'string') update.parentMobile = update.parentMobile.trim();

    // Coerce dateOfBirth to Date if provided
    if (update.dateOfBirth) {
      const d = new Date(update.dateOfBirth);
      if (!isNaN(d.getTime())) update.dateOfBirth = d;
    }

    // Enforce required fields for students (profilePhoto optional)
    if (req.user.role === 'student') {
      const errors = [];
      const bloodAllowed = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
      const phoneRegex = /^\+?[0-9]{7,15}$/;

      const has = (k) => update[k] !== undefined && update[k] !== null && String(update[k]).trim() !== '';

      if (!has('username')) errors.push('Username is required');
      if (!has('age') || isNaN(Number(update.age)) || Number(update.age) < 1 || Number(update.age) > 120) errors.push('Valid age is required');
      if (!has('bloodGroup') || !bloodAllowed.includes(update.bloodGroup)) errors.push('Valid blood group is required');
      if (!has('parentMobile') || !phoneRegex.test(update.parentMobile)) errors.push('Valid parent mobile is required');
      if (!has('dateOfBirth') || isNaN(new Date(update.dateOfBirth).getTime())) errors.push('Valid date of birth is required');

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation error', errors });
      }

      // Ensure proper types for storage
      update.age = Number(update.age);
      update.dateOfBirth = new Date(update.dateOfBirth);
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;