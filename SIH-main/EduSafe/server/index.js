const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let lastMongoError = null;
let isConnected = false;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from configured client URL or any origin in development
    const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
    if (!origin || origin === allowed) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for report images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Enhanced MongoDB connection with better error handling
const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI || 'mongodb+srv://testuser:Test%401234@cluster0.ts66lut.mongodb.net/edusafe';
  const fallbackLocalURI = 'mongodb://127.0.0.1:27017/edusafe';

  // MongoDB connection options (updated for latest MongoDB driver)
  const connectionOptions = {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
    retryWrites: true,
  };

  const attemptConnect = async (uri, label) => {
    try {
      console.log(`Attempting MongoDB connection (${label})...`);
      
      // Validate URI format
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid MongoDB URI format');
      }

      // Normalize SRV URI to include recommended params if missing
      let normalizedURI = uri;
      if (uri.startsWith('mongodb+srv://') && !uri.includes('?')) {
        normalizedURI = `${uri}?retryWrites=true&w=majority`;
      }

      const conn = await mongoose.connect(normalizedURI, connectionOptions);
      console.log(`✅ MongoDB Connected (${label}): ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
      
      lastMongoError = null;
      isConnected = true;
      return true;
    } catch (err) {
      const errorMessage = err?.message || String(err);
      console.error(`❌ MongoDB connection failed (${label}):`, errorMessage);
      lastMongoError = errorMessage;
      isConnected = false;
      return false;
    }
  };

  // Connection event handlers
  mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB connection error:', err);
    lastMongoError = err.message;
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
    isConnected = false;
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔄 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });

  // Attempt connections
  let connected = false;
  
  if (primaryURI) {
    connected = await attemptConnect(primaryURI, 'primary');
  }
  
  if (!connected && process.env.NODE_ENV === 'development') {
    console.log('⚠️  Primary connection failed, attempting local connection...');
    connected = await attemptConnect(fallbackLocalURI, 'local');
  }
  
  if (!connected) {
    console.log('⚠️  All initial connection attempts failed. Starting retry mechanism...');
    // Retry in background without blocking server startup
    let retries = 0;
    const maxRetries = 20;
    const retryInterval = 5000; // 5 seconds
    
    const interval = setInterval(async () => {
      retries += 1;
      console.log(`🔄 Retrying MongoDB connection (attempt ${retries}/${maxRetries})...`);
      
      let success = false;
      if (primaryURI) {
        success = await attemptConnect(primaryURI, 'primary retry');
      }
      if (!success) {
        success = await attemptConnect(fallbackLocalURI, 'local retry');
      }
      
      if (success) {
        clearInterval(interval);
        console.log('✅ MongoDB connection established after retry');
      }
      
      if (retries >= maxRetries) {
        clearInterval(interval);
        console.error('❌ Max MongoDB connection retries reached. Server will continue without database.');
      }
    }, retryInterval);
  }
};

// Database middleware to check connection
const checkDBConnection = (req, res, next) => {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database connection unavailable',
      status: 'error',
      error: lastMongoError || 'MongoDB not connected'
    });
  }
  next();
};

// Connect to database (non-fatal on failure)
connectDB().catch(err => {
  console.error('Failed to initialize database connection:', err);
});

// Import routes with error handling
let authRoutes, moduleRoutes, reportRoutes, userRoutes, storyRoutes;

try {
  authRoutes = require('./routes/auth');
  moduleRoutes = require('./routes/modules');
  reportRoutes = require('./routes/reports');
  userRoutes = require('./routes/users');
  storyRoutes = require('./routes/stories');
} catch (err) {
  console.error('Error loading route modules:', err.message);
  // Create fallback routes
  const fallbackRouter = express.Router();
  fallbackRouter.all('*', (req, res) => {
    res.status(503).json({
      message: 'Service temporarily unavailable - route modules failed to load',
      status: 'error'
    });
  });
  
  authRoutes = moduleRoutes = reportRoutes = userRoutes = storyRoutes = fallbackRouter;
}

// Routes (apply DB check middleware to routes that need database)
app.use('/api/auth', checkDBConnection, authRoutes);
app.use('/api/modules', checkDBConnection, moduleRoutes);
app.use('/api/reports', checkDBConnection, reportRoutes);
app.use('/api/users', checkDBConnection, userRoutes);
app.use('/api/stories', checkDBConnection, storyRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EduSafe Server is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'Connected' : 'Disconnected'
  });
});

// Enhanced health check route
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
    99: 'Uninitialized'
  };

  res.json({
    status: 'OK',
    database: {
      status: dbStatusMap[dbStatus] || 'Unknown',
      readyState: dbStatus,
      connected: isConnected,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    lastMongoError: isConnected ? null : lastMongoError,
    timestamp: new Date().toISOString()
  });
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({
        message: 'Database not connected',
        status: 'error',
        lastError: lastMongoError
      });
    }

    // Try to perform a simple database operation
    const result = await mongoose.connection.db.admin().ping();
    res.json({
      message: 'Database connection test successful',
      status: 'success',
      ping: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      message: 'Database connection test failed',
      status: 'error',
      error: err.message
    });
  }
});

// 404 handler - Fixed to work with newer Express versions
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    status: 'error',
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Handle specific MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({
      message: 'Database error occurred',
      status: 'error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Database service unavailable'
    });
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      status: 'error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Handle cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid data format',
      status: 'error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Invalid request data'
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    message: 'Internal server error',
    status: 'error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔧 Database test available at http://localhost:${PORT}/test-db`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;