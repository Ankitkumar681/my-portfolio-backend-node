const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
    userId: {
          type: mongoose.Schema.Types.ObjectId, // Reference to the User model
          ref: 'User', // The name of the referenced model
          required: true,
        },
  degreeName: { type: String, required: true },
  collegeName: { type: String, required: true },
  fromYear: { type: String, required: true },
  toYear: { type: String, required: true },
  description: { type: String, required: true },
});
const Education = mongoose.model("Education", educationSchema);

module.exports = Education;
