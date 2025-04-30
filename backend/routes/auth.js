const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// --- Standard Registration ---
// @route   POST api/auth/register
// @desc    Register a new user with username/email/password
// @access  Public
router.post('/register', async (req, res) => {
  console.log('Register request body:', req.body); // Debug log
  const { username, email, password } = req.body;

  try {
    // Enhanced Input Validation
    if (!username) {
      return res.status(400).json({ msg: 'Username is required' });
    }
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ msg: 'Username must be at least 3 characters long' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      if (user.email === email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      if (user.username === username) {
        return res.status(400).json({ msg: 'Username already taken' });
      }
    }

    // Create new user instance
    user = new User({
      username,
      email,
      password,
      role: 'student' // Default role
    });

    // Save user to database
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      msg: 'User registered successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// --- Login Route ---
// --- Login Route ---
router.post('/login', async (req, res) => {
  console.log('Login request body:', req.body);
  
  try {
    const { email, password } = req.body;

    // Enhanced input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: 'Please provide both email and password' 
      });
    }

    // Check for user existence
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error during login' 
    });
  }
});

// --- Logout Route ---
router.post('/logout', (req, res) => {
  try {
    res.status(200).json({ msg: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ msg: 'Server error during logout' });
  }
});

// --- Get Current User ---
// @route   GET api/auth/me
// @desc    Get current user data based on token
// @access  Private
router.get('/me', protect, async (req, res) => { // Add protect middleware here
  try {
    const user = await User.findById(req.user.id).select('-password'); // Now req.user should be populated
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;