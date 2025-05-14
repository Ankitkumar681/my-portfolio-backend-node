const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.DB_CONNECTION_URI;
  
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      console.log('✅ MongoDB connected successfully!');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1); // Exit the app if databa se connection fails
    }
  };
  
  module.exports = connectDB;
