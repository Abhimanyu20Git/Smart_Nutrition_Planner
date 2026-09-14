const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    // Connect with a 3 second timeout so the server doesn't hang forever if MongoDB is offline
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrition_planner', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
  } catch (error) {
    console.warn(`MongoDB Connection Failed: ${error.message}`);
    console.warn('Switching to local JSON database fallback (server/data/)...');
    isConnected = false;
  }
};

const isMongoActive = () => isConnected;

module.exports = { connectDB, isMongoActive };
