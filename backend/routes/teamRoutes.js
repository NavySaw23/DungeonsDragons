const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Import authorize
const Team = require('../models/Team');
const User = require('../models/User');

// @route   GET /api/team/me
// @desc    Get the team details of the current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // Populate members and mentor details
    const team = await Team.findOne({ members: req.user._id })
      .populate('members', 'username email role') // Populate member details
      .populate('mentorId', 'username'); // Populate mentor's username if mentorId exists
    if (!team) {
      console.log('User is not part of any team'); // Debug log
      return res.status(404).json({ msg: 'You are not part of any team' });
    }
    console.log('Fetched team:', team); // Debug log
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/team/create
// @desc    Create a new team and set the current user as the team lead
// @access  Private
router.post('/create', protect, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    console.log('Team name is missing'); // Debug log
    return res.status(400).json({ msg: 'Team name is required' });
  }

  try {
    // Check if the user is already part of a team
    const existingTeam = await Team.findOne({ members: req.user._id });
    if (existingTeam) {
      console.log('User is already part of a team:', existingTeam); // Debug log
      return res.status(400).json({ msg: 'You are already part of a team' });
    }

    // Create a new team
    const team = new Team({
      name,
      teamLeadId: req.user._id,
      members: [req.user._id],
    });

    await team.save();
    console.log('Team created:', team); // Debug log

    // Update the user's teamId field
    const user = await User.findById(req.user._id);
    user.teamId = team._id;
    await user.save();
    console.log('Updated user with teamId:', user); // Debug log

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/team/join
// @desc    Join an existing team
// @access  Private
router.post('/join', protect, async (req, res) => {
  const { teamID } = req.body;

  if (!teamID) {
    console.log('Team ID is missing'); // Debug log
    return res.status(400).json({ msg: 'Team ID is required' });
  }

  try {
    // Find the team by ID
    const team = await Team.findById(teamID);
    if (!team) {
      console.log('Team not found with ID:', teamID); // Debug log
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if the user is already part of a team
    const existingTeam = await Team.findOne({ members: req.user._id });
    if (existingTeam) {
      console.log('User is already part of a team:', existingTeam); // Debug log
      return res.status(400).json({ msg: 'You are already part of a team' });
    }

    // Add the user to the team
    team.members.push(req.user._id);
    await team.save();
    console.log('User added to team:', team); // Debug log

    // Update the user's teamId field
    const user = await User.findById(req.user._id);
    user.teamId = team._id;
    await user.save();
    console.log('Updated user with teamId:', user); // Debug log

    res.status(200).json({ msg: 'Successfully joined the team', team });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route   DELETE /api/team/leave
// @desc    Leave the current team
// @access  Private
router.delete('/leave', protect, async (req, res) => {
    try {
      // Find the team that the user is a member of
      const team = await Team.findOne({ members: req.user._id });
  
      if (!team) {
        console.log('User is not part of any team'); // Debug log
        return res.status(404).json({ msg: 'You are not part of any team' });
      }
  
      // If the user is the team lead, disallow leaving
      if (team.teamLeadId.toString() === req.user._id.toString()) {
        console.log('Team lead cannot leave the team'); // Debug log
        return res.status(400).json({ msg: 'Team lead cannot leave the team' });
      }
  
      // Debug log: Team members before removal
      console.log('Team members before removal:', team.members);
  
      // Remove the user from the team
      team.members = team.members.filter((member) => !member.equals(req.user._id));
  
      // Debug log: Team members after removal
      console.log('Team members after removal:', team.members);
  
      // Save the updated team
      await team.save();
      console.log('Updated team after removing user:', team); // Debug log
  
      // Update the user's teamId field to null
      const user = await User.findById(req.user._id);
      user.teamId = null;
      await user.save();
      console.log('Updated user with null teamId:', user); // Debug log
  
      res.json({ msg: 'You have left the team' });
    } catch (error) {
      console.error('Error leaving team:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });

// @route   PATCH /api/team/change-lead
// @desc    Change the team lead
// @access  Private (Only accessible by the current team lead or a mentor)
router.patch('/change-lead', protect, async (req, res) => {
    const { newLeadId } = req.body;
  
    if (!newLeadId) {
      console.log('New team lead ID is missing'); // Debug log
      return res.status(400).json({ msg: 'New team lead ID is required' });
    }
  
    try {
      const team = await Team.findOne({ teamLeadId: req.user._id });
  
      if (!team) {
        console.log('User is not authorized to change the team lead'); // Debug log
        return res.status(403).json({ msg: 'You are not authorized to change the team lead' });
      }
  
      // Convert newLeadId to ObjectId
      const mongoose = require('mongoose');
      const newLeadObjectId = new mongoose.Types.ObjectId(newLeadId);
  
      // Check if the new lead is a member of the team
      if (!team.members.some((member) => member.equals(newLeadObjectId))) {
        console.log('The new lead is not a member of the team'); // Debug log
        return res.status(400).json({ msg: 'The new lead must be a member of the team' });
      }
  
      // Update the team lead
      team.teamLeadId = newLeadObjectId;
      await team.save();
      console.log('Team lead changed successfully:', team); // Debug log
  
      res.status(200).json({ msg: 'Team lead changed successfully', team });
    } catch (error) {
      console.error('Error changing team lead:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });

// @route   PATCH /api/teams/add-mentor
// @desc    Add or update the mentor for a specific team
// @access  Private (Admin or Mentor)
// Note: Removed :teamId from the route path
router.patch('/add-mentor', protect, authorize('admin', 'mentor'), async (req, res) => {
  const { teamId } = req.body; // Only teamId is strictly required from body now
  let mentorIdToAdd;

  if (!teamId) {
    return res.status(400).json({ msg: 'Team ID is required in the request body' });
  }

  // Determine the mentorId based on the user's role
  if (req.user.role === 'admin') {
    const { mentorId } = req.body; // Admin must provide the mentorId
    if (!mentorId) {
      console.log('Admin must provide Mentor ID'); // Debug log
      return res.status(400).json({ msg: 'Mentor ID is required in the body for admin users' });
    }
    mentorIdToAdd = mentorId;
  } else if (req.user.role === 'mentor') {
    mentorIdToAdd = req.user._id; // Mentor uses their own ID
    console.log(`Mentor ${req.user.username} assigning themselves`); // Debug log
  } else {
    // This case should technically not be reached due to authorize middleware
    return res.status(403).json({ msg: 'Forbidden' });
  }

  try {
    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      console.log(`Team not found with ID: ${teamId}`); // Debug log
      return res.status(404).json({ msg: 'Team not found' });
    }

    // If admin is adding, perform an extra check that the provided ID is actually a mentor
    // The model's pre-save hook will also validate this, but checking early gives better feedback
    if (req.user.role === 'admin') {
        const mentorUser = await User.findById(mentorIdToAdd);
        if (!mentorUser) {
            console.log(`Mentor user not found with ID: ${mentorIdToAdd}`); // Debug log
            return res.status(404).json({ msg: 'Mentor user not found' });
        }
        if (mentorUser.role !== 'mentor') {
            console.log(`User ${mentorUser.username} is not a mentor`); // Debug log
            return res.status(400).json({ msg: 'The specified user ID does not belong to a mentor' });
        }
    }

    // Update the team's mentorId
    team.mentorId = mentorIdToAdd;
    await team.save(); // The pre-save hook in Team model will also validate the role
    console.log(`Mentor ${mentorIdToAdd} added/updated for team ${teamId}`); // Debug log

    res.status(200).json({ msg: 'Mentor added/updated successfully', team });
  } catch (error) {
    console.error('Error adding/updating mentor:', error);
    // Handle potential CastError if IDs are invalid format
    if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'Invalid ID format provided' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PATCH /api/teams/add-coordinator
// @desc    Add or update the coordinator for a specific team
// @access  Private (Admin or Coordinator)
// Note: Removed :teamId from the route path
router.patch('/add-coordinator', protect, authorize('admin', 'coordinator'), async (req, res) => {
  const { teamId } = req.body; // Only teamId is strictly required from body now
  let coordinatorIdToAdd;

  if (!teamId) {
    return res.status(400).json({ msg: 'Team ID is required in the request body' });
  }

  // Determine the coordinatorId based on the user's role
  if (req.user.role === 'admin') {
    const { coordinatorId } = req.body; // Admin must provide the coordinatorId
    if (!coordinatorId) {
      console.log('Admin must provide Coordinator ID'); // Debug log
      return res.status(400).json({ msg: 'Coordinator ID is required in the body for admin users' });
    }
    coordinatorIdToAdd = coordinatorId;
  } else if (req.user.role === 'coordinator') {
    coordinatorIdToAdd = req.user._id; // Coordinator uses their own ID
    console.log(`Coordinator ${req.user.username} assigning themselves`); // Debug log
  } else {
    // This case should technically not be reached due to authorize middleware
    return res.status(403).json({ msg: 'Forbidden' });
  }

  try {
    const team = await Team.findById(teamId);
    if (!team) {
        console.log(`Team not found with ID: ${teamId}`); // Debug log
        return res.status(404).json({ msg: 'Team not found' });
    }

    // The pre-save hook in the Team model handles validation of the coordinator's role
    team.coordinatorId = coordinatorIdToAdd;
    await team.save();

    res.status(200).json({ msg: 'Coordinator added/updated successfully', team });
  } catch (error) {
    console.error('Error adding/updating coordinator:', error);
    if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'Invalid ID format provided' });
    }
    // Handle potential validation errors from the model's pre-save hook
    if (error.message.includes('coordinatorId can only be set')) {
        return res.status(400).json({ msg: error.message });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;