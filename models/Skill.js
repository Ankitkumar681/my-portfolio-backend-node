const mongoose = require('mongoose');

// User model will be referenced (assuming you have a User model with _id field)
const skillSchema = new mongoose.Schema(
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
    percentage: {
      type: Number, // This will store the path to the uploaded image
      required: false,
    },
    color: {
      type: String,
      maxlength: 5000,
      default: null,
    },
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

// Create a Profile model based on the schema
const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
