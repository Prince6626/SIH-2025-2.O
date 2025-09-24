const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users/leaderboard - Get top users by points
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Find users, sort by points in descending order, limit to requested number
    const leaderboard = await User.find({})
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

module.exports = router;