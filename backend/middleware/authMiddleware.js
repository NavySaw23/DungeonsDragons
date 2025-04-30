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

  // Check for token in Authorization header (format: "Bearer <token>")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>" string
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user associated with the token's ID
      // Select '-password' to exclude the password hash from the result
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
          // Handle case where user associated with token no longer exists
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      // User is authenticated, proceed to the next middleware or route handler
      next();

    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ msg: 'Not authorized, invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ msg: 'Not authorized, token expired' });
      }
      // Generic server error for other issues
      return res.status(500).json({ msg: 'Server error during token verification' });
    }
  }

  // If no token is found in the header
  if (!token) {
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
    if (!req.user || !req.user.role) {
        // Should not happen if 'protect' ran correctly, but good safety check
        return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `Forbidden: User role '${req.user.role}' is not authorized to access this route` });
    }
    // User has the required role, proceed
    next();
  };
};


module.exports = { protect, authorize };
