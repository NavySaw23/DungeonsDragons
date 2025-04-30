// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is here

/**
 * @desc Middleware to protect routes requiring authentication.
 * Verifies JWT token from Authorization header.
 * Attaches user object (excluding password) to req.user if valid.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];
      console.log('Extracted Token:', token); // Debug log

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded); // Debug log

      // Use `decoded.id` instead of `decoded.user.id`
      req.user = await User.findById(decoded.id).select('-password');
      console.log('Authenticated User:', req.user); // Debug log

      if (!req.user) {
        console.error('User not found for token'); // Debug log
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message); // Debug log
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Not authorized, invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Not authorized, token expired' });
      }
      return res.status(500).json({ msg: 'Server error during token verification' });
    }
  }

  if (!token) {
    console.error('No token provided in Authorization header'); // Debug log
    res.status(401).json({ msg: 'Not authorized, no token provided' });
  }
};


/**
 * @desc Middleware generator for role-based authorization.
 * Checks if the authenticated user's role is included in the allowed roles.
 * Must be used *after* the 'protect' middleware.
 * @param {...string} roles - Allowed roles for the route.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Assumes 'protect' middleware has already run and attached req.user
    console.log('User Role:', req.user?.role); // Debug log
    if (!req.user || !req.user.role) {
      // Should not happen if 'protect' ran correctly, but good safety check
      console.error('User role not found or user not authenticated'); // Debug log
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      console.error(`Forbidden: User role '${req.user.role}' is not authorized`); // Debug log
      return res.status(403).json({ msg: `Forbidden: User role '${req.user.role}' is not authorized to access this route` });
    }
    // User has the required role, proceed
    next();
  };
};

module.exports = { protect, authorize };