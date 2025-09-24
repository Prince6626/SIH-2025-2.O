const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const { authenticateToken } = require('../middleware/auth');

// GET /api/stories - Get all stories
router.get('/', async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('author', 'username');
    
    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// GET /api/stories/:id - Get a single story
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'username');
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// POST /api/stories - Create a new story
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, image } = req.body;
    
    const story = await Story.create({
      title,
      content,
      author: req.user.id,
      authorName: req.user.username,
      tags: tags || [],
      image: image || ''
    });
    
    res.status(201).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error creating story:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// PUT /api/stories/:id - Update a story
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    // Check if user is the author of the story
    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this story'
      });
    }
    
    story = await Story.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error updating story:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// DELETE /api/stories/:id - Delete a story
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    // Check if user is the author of the story
    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this story'
      });
    }
    
    await story.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// POST /api/stories/:id/like - Like a story
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    // Check if user has already liked this story
    const userId = req.user.id;
    if (story.likedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'You have already liked this story'
      });
    }
    
    // Add user to likedBy array and increment likes
    story.likedBy.push(userId);
    story.likes += 1;
    await story.save();
    
    res.status(200).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// DELETE /api/stories/:id/like - Unlike a story
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    const userId = req.user.id;
    if (!story.likedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'You have not liked this story'
      });
    }
    
    // Remove user from likedBy array and decrement likes
    story.likedBy = story.likedBy.filter(id => id.toString() !== userId);
    story.likes = Math.max(0, story.likes - 1);
    await story.save();
    
    res.status(200).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error unliking story:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// GET /api/stories/:id/like-status - Check if user has liked a story
router.get('/:id/like-status', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }
    
    const userId = req.user.id;
    const hasLiked = story.likedBy.includes(userId);
    
    res.status(200).json({
      success: true,
      data: {
        hasLiked,
        likes: story.likes
      }
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;