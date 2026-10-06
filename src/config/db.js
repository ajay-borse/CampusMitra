const mongoose = require('mongoose');

let isConnected = false;

// Handle connection lifecycle events to avoid unhandled errors
mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error(`⚠️ MongoDB connection event error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('connected', () => {
  isConnected = true;
});

/**
 * Connect to MongoDB using Mongoose.
 * Supports local MongoDB and MongoDB Atlas via MONGODB_URI.
 * Enforces database presence - does NOT silently pretend data was saved.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusmitra';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('====================================================');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log('====================================================');
    return conn;
  } catch (error) {
    isConnected = false;
    console.error('====================================================');
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 To resolve this:');
    console.error('   1. Ensure MongoDB service is running locally, OR');
    console.error('   2. Set MONGODB_URI in .env to a MongoDB Atlas cluster string.');
    console.error('====================================================');
    return null;
  }
};

const getDBStatus = () => isConnected;

module.exports = {
  connectDB,
  getDBStatus,
};
