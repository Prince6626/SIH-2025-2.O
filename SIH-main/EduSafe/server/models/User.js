const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'teacher', 'admin'],
      message: 'Role must be either student, teacher, or admin'
    },
    default: 'student'
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  age: {
    type: Number,
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age seems invalid'],
    default: undefined
  },
  bloodGroup: {
    type: String,
    trim: true,
    uppercase: true,
    enum: {
      values: [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
        // allow empty via undefined
      ],
      message: 'Invalid blood group'
    },
    default: undefined
  },
  parentMobile: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, 'Enter a valid mobile number'],
    default: undefined
  },
  dateOfBirth: {
    type: Date,
    default: undefined
  },
  profilePhoto: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Profile photo must be a valid URL'
    },
    default: undefined
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user data without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email or username
userSchema.statics.findByCredentials = async function(emailOrUsername, password) {
  const user = await this.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ]
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
