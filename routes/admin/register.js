// routes/user/register.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User'); // Assuming the same User model is used

// Router
const router = express.Router();

// User Register Route
router.post(
  '/register',
  [
    body('adminName').notEmpty().withMessage('Name is required'),
    body('adminEmail').isEmail().withMessage('Valid email is required'),
    body('adminPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    // Validation checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminName, adminEmail, adminPassword } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email : adminEmail });
      if (user) {
        return res.status(400).json({ msg: 'User already exists!' });
      }

      // Hash the password
      

      // Create a new user
      user = new User({
        name: adminName,
        email: adminEmail,  
        password: adminPassword,
      }); 

      // Save user to the database
      await user.save();

      // Generate JWT token

      res.status(201).json({
        message: 'User registered successfully! Please Login.',
        
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
