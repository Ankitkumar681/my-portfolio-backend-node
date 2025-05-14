// routes/user/login.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const sendOtp = require('../../utils/sendOtp');
const crypto = require('crypto');  // For generating OTP

// Router
const router = express.Router();
  
// Generate random OTP function
const generateOtp = () => {
  return crypto.randomInt(100000, 999999);  // 6-digit OTP
};

// Step 1: Login Route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      // Find user by email
      const user = await User.findOne({ email : email });

      if (!user) {
        return res.status(400).json({ msg: 'User not found!' });
      }

      // Verify password
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials!' });
      }
      // Generate OTP
      const otp = generateOtp();
      // Save OTP in the user session or database (for validation in the next step)
      user.otp = otp;  // You can also store this in a session or cache like Redis
      await user.save();
      // Send OTP to user's email
      await sendOtp(email, otp);
      // Respond with message: ask for OTP verification
      res.status(200).json({
        message: 'OTP sent to your email. Please verify to complete login.',
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Step 2: OTP Verification Route
router.post('/verifyOtp', async (req, res) => {
  const { otp } = req.body;
  const email = req.query.email;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found!' });
    }

    // Check if OTP matches
    if (parseInt(otp) !== user.otp) {
      return res.status(400).json({ msg: 'Invalid OTP!' });
    }

    // OTP is valid, create JWT token for user
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Send JWT token in response
    res.status(200).json({
      message: 'Login successful!',
      token: token,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
