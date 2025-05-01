// Assuming you have these models imported
const User = require('../models/User'); // Adjust path as needed
const Team = require('../models/Team'); // Adjust path as needed
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, UnauthorizedError } = require('../errors'); // Assuming you have custom error classes

/**
 * Middleware to fetch the user's team based on the authenticated user ID
 * and attach it to the request object (req.team).
 * Requires a preceding authentication middleware that sets req.user.id.
 */
const attachTeamToRequest = async (req, res, next) => {
  // 1. Extract User ID (assuming it's set by previous auth middleware)
  const userId = req.user?.id; // Use optional chaining for safety

  if (!userId) {
    // Should ideally be caught by auth middleware, but good to double-check
    throw new UnauthorizedError('Authentication required. User ID not found.');
  }

  try {
    // 2. Fetch User and Team
    const user = await User.findById(userId).select('team'); // Only select the 'team' field for efficiency

    if (!user) {
      // This case might indicate a data inconsistency if auth passed
      throw new NotFoundError(`User not found with ID: ${userId}`);
    }

    if (!user.team) {
      // Handle case where user is authenticated but not assigned to a team
      // You might adjust this logic based on your application rules
      throw new NotFoundError(`User ${userId} is not associated with any team.`);
    }

    const team = await Team.findById(user.team);

    if (!team) {
      // This case might indicate a data inconsistency (user points to a non-existent team)
      throw new NotFoundError(`Team not found with ID: ${user.team} (associated with user ${userId})`);
    }

    // 3. Attach Team Object to Request
    req.team = team; // Attach the full team object
    // Alternatively, if you only need the ID later: req.teamId = team._id;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Pass errors to your central error handler
    next(error);
  }
};

module.exports = {
  attachTeamToRequest,
  // ... other middleware exports
};
