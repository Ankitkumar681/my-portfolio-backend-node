const mongoose = require('mongoose');

// User model will be referenced (assuming you have a User model with _id field)
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: 'User', // The name of the referenced model
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePic: {
      type: String, // This will store the path to the uploaded image
      required: false,
    },
    profilePic2: {
      type: String, // This will store the path to the uploaded image
      required: false,
    },
    pdf: {
      type: String, // Path to the uploaded PDF
      required: false,
    },
    video: {
      type: String, // Path to the uploaded video
      required: false,
    },
    aboutText: {
      type: String,
      maxlength: 5000,
      default: null,
    },
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

// Create a Profile model based on the schema
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
