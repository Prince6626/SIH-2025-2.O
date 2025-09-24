const mongoose = require('mongoose');

// Quiz question schema
const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v.length >= 2; // At least 2 options required
      },
      message: 'At least 2 options are required for a quiz question'
    }
  },
  correctAnswer: {
    type: Number, // Index of the correct option
    required: [true, 'Correct answer is required'],
    min: [0, 'Correct answer index must be valid']
  },
  explanation: {
    type: String,
    trim: true
  }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Lesson title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['text', 'video', 'image', 'interactive', 'quiz'],
      message: 'Lesson type must be text, video, image, interactive, or quiz'
    },
    default: 'text'
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate URL if type is video
        if (this.type === 'video') {
          return /^https?:\/\/.+/.test(v);
        }
        return true;
      },
      message: 'Valid video URL is required for video lessons'
    }
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate URL if type is image
        if (this.type === 'image') {
          return /^https?:\/\/.+/.test(v);
        }
        return true;
      },
      message: 'Valid image URL is required for image lessons'
    }
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Lesson order must be at least 1']
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 5,
    min: [1, 'Estimated time must be at least 1 minute']
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Module title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    trim: true,
    maxlength: [1000, 'Module description cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Difficulty must be beginner, intermediate, or advanced'
    },
    required: [true, 'Module difficulty is required']
  },
  duration: {
    type: String,
    required: [true, 'Module duration is required'],
    trim: true
  },
  estimatedHours: {
    type: Number,
    required: [true, 'Estimated hours is required'],
    min: [0.5, 'Estimated hours must be at least 0.5'],
    max: [100, 'Estimated hours cannot exceed 100']
  },
  lessons: [lessonSchema],
  category: {
    type: String,
    required: [true, 'Module category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Module instructor is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  thumbnail: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Thumbnail must be a valid URL'
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
moduleSchema.index({ title: 'text', description: 'text', category: 'text' });
moduleSchema.index({ difficulty: 1, category: 1 });
moduleSchema.index({ instructor: 1 });
moduleSchema.index({ isPublished: 1, isActive: 1 });

// Virtual for total lesson count
moduleSchema.virtual('lessonCount').get(function() {
  return this.lessons.length;
});

// Virtual for total estimated time
moduleSchema.virtual('totalEstimatedTime').get(function() {
  return this.lessons.reduce((total, lesson) => total + (lesson.estimatedTime || 0), 0);
});

// Method to add a lesson
moduleSchema.methods.addLesson = function(lessonData) {
  const lessonOrder = this.lessons.length + 1;
  const lesson = {
    ...lessonData,
    order: lessonOrder
  };
  this.lessons.push(lesson);
  return this.save();
};

// Method to update lesson order
moduleSchema.methods.updateLessonOrder = function(lessonId, newOrder) {
  const lesson = this.lessons.id(lessonId);
  if (lesson) {
    lesson.order = newOrder;
    return this.save();
  }
  throw new Error('Lesson not found');
};

// Method to get lessons by type
moduleSchema.methods.getLessonsByType = function(type) {
  return this.lessons.filter(lesson => lesson.type === type);
};

// Static method to find modules by difficulty
moduleSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, isPublished: true, isActive: true });
};

// Static method to find modules by category
moduleSchema.statics.findByCategory = function(category) {
  return this.find({ category, isPublished: true, isActive: true });
};

// Static method to search modules
moduleSchema.statics.searchModules = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isPublished: true,
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Module', moduleSchema);
