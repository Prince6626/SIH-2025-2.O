const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Report title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    trim: true,
    maxlength: [2000, 'Report description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    required: [true, 'Report location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid URL'
    }
  },
  geo: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 }
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Investigating', 'Resolved'],
      message: 'Status must be Pending, Investigating, or Resolved'
    },
    default: 'Pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report must be associated with a user']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Priority must be Low, Medium, High, or Critical'
    },
    default: 'Medium'
  },
  category: {
    type: String,
    enum: {
      values: ['Safety', 'Bullying', 'Infrastructure', 'Academic', 'Behavioral', 'Other'],
      message: 'Category must be Safety, Bullying, Infrastructure, Academic, Behavioral, or Other'
    },
    required: [true, 'Report category is required']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  resolution: {
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution description cannot exceed 1000 characters']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better query performance
reportSchema.index({ status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ location: 'text', title: 'text', description: 'text' });

// Virtual for vote count
reportSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for comment count
reportSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for days since creation
reportSchema.virtual('daysSinceCreation').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to add a comment
reportSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    user: userId,
    comment: comment
  });
  return this.save();
};

// Method to upvote
reportSchema.methods.upvote = function(userId) {
  // Remove from downvotes if exists
  this.downvotes = this.downvotes.filter(id => !id.equals(userId));
  
  // Add to upvotes if not already there
  if (!this.upvotes.some(id => id.equals(userId))) {
    this.upvotes.push(userId);
  }
  
  return this.save();
};

// Method to downvote
reportSchema.methods.downvote = function(userId) {
  // Remove from upvotes if exists
  this.upvotes = this.upvotes.filter(id => !id.equals(userId));
  
  // Add to downvotes if not already there
  if (!this.downvotes.some(id => id.equals(userId))) {
    this.downvotes.push(userId);
  }
  
  return this.save();
};

// Method to resolve report
reportSchema.methods.resolve = function(resolvedBy, resolutionDescription) {
  this.status = 'Resolved';
  this.resolution = {
    description: resolutionDescription,
    resolvedBy: resolvedBy,
    resolvedAt: new Date()
  };
  return this.save();
};

// Static method to find reports by status
reportSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('reportedBy', 'username email');
};

// Static method to find reports by category
reportSchema.statics.findByCategory = function(category) {
  return this.find({ category }).populate('reportedBy', 'username email');
};

// Static method to find reports by priority
reportSchema.statics.findByPriority = function(priority) {
  return this.find({ priority }).populate('reportedBy', 'username email');
};

// Static method to find reports by user
reportSchema.statics.findByUser = function(userId) {
  return this.find({ reportedBy: userId }).populate('reportedBy', 'username email');
};

// Static method to find reports by assigned user
reportSchema.statics.findByAssignedUser = function(userId) {
  return this.find({ assignedTo: userId }).populate('reportedBy', 'username email');
};

// Static method to search reports
reportSchema.statics.searchReports = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm }
  }).populate('reportedBy', 'username email');
};

// Pre-save middleware to update timestamps
reportSchema.pre('save', function(next) {
  // If status is being changed to Resolved, set resolution date
  if (this.isModified('status') && this.status === 'Resolved' && !this.resolution.resolvedAt) {
    this.resolution.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
