const mongoose = require('mongoose');

// User model will be referenced (assuming you have a User model with _id field)
const technologySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: 'User', // The name of the referenced model
      required: true,
    },
    image: {
        type: String,
        required: true
    }
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

// Create a Profile model based on the schema
const Technology = mongoose.model('Technology', technologySchema);

module.exports = Technology;
