const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
    userId: {
          type: mongoose.Schema.Types.ObjectId, // Reference to the User model
          ref: 'User', // The name of the referenced model
          required: true,
        },
  designation: { type: String, required: true },
  companyName: { type: String, required: true },
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
  description: { type: String, required: true },
});
const Experience = mongoose.model("Experience", experienceSchema);

module.exports = Experience;
