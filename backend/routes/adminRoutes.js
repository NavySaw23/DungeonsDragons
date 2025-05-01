const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Team = require('../models/Team');
const User = require('../models/User'); // Needed for nested population
const Project = require('../models/Project'); // Needed for nested population
const Task = require('../models/Task'); // Needed for nested population

// @route   GET api/admin/my-teams
// @desc    Get teams mentored or coordinated by the current user
// @access  Private (Mentor, Coordinator)
router.get(
  '/my-teams',
  protect, // Ensure user is logged in
  authorize('mentor', 'coordinator'), // Ensure user is a mentor or coordinator
  async (req, res) => {
    try {
      const userId = req.user.id; // Get the logged-in user's ID from the protect middleware

      // Define the detailed population structure needed by the frontend
      const teamPopulation = [
        // Populate members and lead explicitly here for clarity and control
        // (even if a pre-find hook exists, explicit population is often clearer)
        { path: 'members', select: 'username _id health' },
        { path: 'teamLeadId', select: 'username _id health' },
        {
          path: 'projectId', // Populate the project reference in the Team
          select: 'name description _id tasks', // Select fields from the Project
          populate: { // <--- Start Nested Population
            // Nested populate: Populate tasks within the Project
            path: 'tasks',
            select: 'name _id completionStatus assignees deadline difficulty', // Select fields from Task
            populate: {
              // Nested populate: Populate assignees within each Task
              path: 'assignees',
              select: 'username _id' // Select fields from User (assignee)
            }
          } // <--- End Nested Population
        }
      ];

      // Find teams where the current user is the mentor
      const mentoredTeamsPromise = Team.find({ mentorId: userId })
        .select('-__v') // Example: Exclude version key if not needed
        .populate(teamPopulation) // Apply the detailed population
        .lean(); // Add .lean() for performance

      // Find teams where the current user is the coordinator
      console.log(`[Admin MyTeams] Finding teams for user: ${userId}`); // Debug Log
      const coordinatedTeamsPromise = Team.find({ coordinatorId: userId })
        .populate(teamPopulation) // Apply the detailed population
        .lean(); // Add .lean() for performance

      // Execute queries in parallel
      const [mentoredTeams, coordinatedTeams] = await Promise.all([
        mentoredTeamsPromise,
        coordinatedTeamsPromise
      ]);

      console.log(`[Admin MyTeams] Found ${mentoredTeams.length} mentored teams and ${coordinatedTeams.length} coordinated teams.`); // Debug Log

      res.json({
        // Consider adding counts or simplifying structure if frontend struggles
        success: true,
        mentoredTeams,
        coordinatedTeams,
      });
    } catch (error) {
      console.error('Error fetching user teams:', error);
      res.status(500).json({ success: false, msg: 'Server error' });
      // Consider more specific error messages based on error type if possible
    }
  }
);

module.exports = router;