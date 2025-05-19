const mongoose = require('mongoose');
const { stringify } = require('postcss');

// User model will be referenced (assuming you have a User model with _id field)
const serviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: 'User', // The name of the referenced model
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 5000,
      required: true,
    },
    iconClass: {
      type: String,
      default: 'fa-pencil',
    },
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

// Create a Profile model based on the schema
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
