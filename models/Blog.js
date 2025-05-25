const mongoose = require('mongoose');

// User model will be referenced (assuming you have a User model with _id field)
const blogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      ref: 'User', // The name of the referenced model
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true,
    },
    thumbnail: {
      type: String, // This will store the path to the uploaded image
      required: false,
    },
    description: {
      type: String,
      default: null,
    },
    images:{
        type:String,
        default: null
    }
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

// Create a Blog model based on the schema
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
