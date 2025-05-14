// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// Define a Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // must be provided
    },
    email: {
      type: String,
      required: true,
      unique: true, // no duplicate emails
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    degree: {
      type: String,
      default: null,
    },
    birthday: {
      type: String,
      default: null,
    },
    experience: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      maxlength: 5000,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
); // auto adds createdAt and updatedAt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if password is new or modified

  try {
    const salt = await bcrypt.genSalt(10); // generate salt
    this.password = await bcrypt.hash(this.password, salt); // hash password
    next();
  } catch (error) {
    next(error);
  }
});
// Create a Model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;
