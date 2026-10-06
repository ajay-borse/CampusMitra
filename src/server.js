const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, getDBStatus } = require('./config/db');
const { initSocket } = require('./sockets/chatSocket');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const interestRoutes = require('./routes/interestRoutes');

// Initialize Express Application & HTTP Server
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Real-time Socket.IO Server
initSocket(httpServer);

// ==========================================
// Middleware Configuration
// ==========================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow dev tools / local testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Serve uploaded profile photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// Base / Health Check Route
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CampusMitra REST API',
    tagline: 'Find Your People. Find Your Vibe.',
    disclaimer: 'CampusMitra is an independent student project and is not an official university service.',
    status: 'Running',
    database: getDBStatus() ? 'Connected' : 'Unavailable',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      discover: '/api/discover',
      connections: '/api/connections',
      conversations: '/api/conversations',
      notifications: '/api/notifications',
      moderation: '/api/moderation',
      admin: '/api/admin',
      students: '/api/students',
    },
  });
});

// ==========================================
// Mount REST API Routes
// ==========================================
const requireDB = require('./middleware/dbCheck');

app.use('/api/auth', requireDB, authRoutes);
app.use('/api/profiles', requireDB, profileRoutes);
app.use('/api/discover', requireDB, discoverRoutes);
app.use('/api/connections', requireDB, connectionRoutes);
app.use('/api/conversations', requireDB, chatRoutes);
app.use('/api/notifications', requireDB, notificationRoutes);
app.use('/api/moderation', requireDB, moderationRoutes);
app.use('/api/admin', requireDB, adminRoutes);
app.use('/api/verifications', requireDB, verificationRoutes);
app.use('/api/interests', requireDB, interestRoutes);
app.use('/api/students', studentRoutes); // Preserved student registry (supports in-memory fallback)

// ==========================================
// 404 Route Not Found Middleware
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// Centralized Error Handling Middleware
// ==========================================
app.use(errorHandler);

// ==========================================
// Server Initialization & Error Handling
// ==========================================
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('====================================================');
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error('💡 To free port ' + PORT + ' on Windows PowerShell, run:');
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error('====================================================');
    process.exit(1);
  } else {
    console.error(`❌ Server error: ${error.message}`);
    process.exit(1);
  }
});

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🎓 CampusMitra API server running at http://localhost:${PORT}`);
    console.log(`📡 Socket.IO Real-time service active`);
    console.log(`💾 Database: ${getDBStatus() ? 'Connected (MongoDB)' : 'Waiting for connection (Fallback Active)'}`);
    console.log('====================================================');
  });
};

startServer();

module.exports = { app, httpServer };
