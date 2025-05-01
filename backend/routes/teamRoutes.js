const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Import authorize
const mongoose = require('mongoose'); // Moved require to top
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project'); // Import Project model

// @route   GET /api/team/me
// @desc    Get the team details of the current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id })
      .populate('members', 'username email role') // Keep existing populates
      .populate('projectId', 'name description'); // Populate project details

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
// @access  Private (Only accessible by the current team lead, admin, or mentor)
router.patch('/change-lead', protect, authorize('admin', 'mentor', 'student'), async (req, res) => { // Added student temporarily, refined below
    const { newLeadId } = req.body;
  
    if (!newLeadId) {
      console.log('New team lead ID is missing'); // Debug log
      return res.status(400).json({ msg: 'New team lead ID is required' });
    }
  
    try {
      // Find the team where the new lead is a member. We need the team context first.
      // A better approach might be to get the user's current team first if they are the lead.
      // Let's assume the request includes the teamId for clarity, or fetch it based on the current user.
      // Option 1: Assume teamId is in the request body (requires frontend change)
      // const { teamId } = req.body;
      // const team = await Team.findById(teamId);

      // Option 2: Find the team the current user leads (original logic, but needs refinement for admin/mentor)
      const team = await Team.findOne({ members: req.user._id }); // Find team user is in

      if (!team) {
        return res.status(404).json({ msg: 'Team not found or you are not on a team.' });
      }

  
      // Check if the new lead is a member of the team
      if (!team.members.some((member) => member.equals(newLeadObjectId))) {
        console.log('The new lead is not a member of the team'); // Debug log
        return res.status(400).json({ msg: 'The new lead must be a member of the team' });
      }
  
      // Authorization Check: Allow if user is current lead OR admin OR mentor
      const isCurrentLead = team.teamLeadId.equals(req.user._id);
      const isAdminOrMentor = ['admin', 'mentor'].includes(req.user.role);

      if (!isCurrentLead && !isAdminOrMentor) {
          console.log(`User ${req.user._id} (${req.user.role}) is not authorized to change lead for team ${team._id}`); // Debug log
          return res.status(403).json({ msg: 'You are not authorized to change the team lead' });
      }

      // Convert newLeadId to ObjectId
      const newLeadObjectId = new mongoose.Types.ObjectId(newLeadId);

      // Update the team lead
      team.teamLeadId = newLeadObjectId;
      await team.save();
      console.log('Team lead changed successfully:', team); // Debug log
  
      res.status(200).json({ msg: 'Team lead changed successfully', team });
    } catch (error) {
      console.error('Error changing team lead:', error); // Add CastError check here too
      if (error.name === 'CastError') {
          return res.status(400).json({ msg: 'Invalid ID format provided for newLeadId' });
      }
      res.status(500).json({ msg: 'Server error' });
    }
  });

// @route   PATCH /api/team/add-mentor
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

// @route   PATCH /api/team/add-coordinator
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
    const { coordinatorId } = req.body; // Admin must provgive he coordinatorId
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

// @route   POST /api/team/add-project
// @desc    Create and assign a new project to a specific team if none exists
// @access  Private (Any member of the team)
router.post('/add-project', protect, async (req, res) => { // Removed authorize middleware
  const { teamId, projectName, projectDescription } = req.body;
  console.log(`[POST /add-project] Request received from user: ${req.user._id}, Body:`, req.body); // Debug log

  if (!teamId || !projectName) {
    console.log('Team ID or Project Name missing'); // Debug log
    return res.status(400).json({ msg: 'Both Team ID and Project Name are required' });
  }

  try {
    // Find the team
    const team = await Team.findById(teamId);
    console.log(`[POST /add-project] Found team:`, team ? team._id : 'Not Found'); // Debug log

    if (!team) {
      console.log(`Team not found with ID: ${teamId}`); // Debug log
      return res.status(404).json({ msg: 'Team not found' });
    }

    console.log(`[POST /add-project] Checking membership for user ${req.user._id} in team ${teamId}`); // Debug log
    // Check if the requesting user is a member of the team
    if (!team.members.some(member => member.equals(req.user._id))) {
        console.log(`User ${req.user._id} is not a member of team ${teamId}`); // Debug log
        return res.status(403).json({ msg: 'Forbidden: You are not a member of this team.' });
    } else {
        console.log(`[POST /add-project] User ${req.user._id} is a member of team ${teamId}`); // Debug log
    }

    // Check if the team already has a project assigned
    if (team.projectId) {
      console.log(`Team ${teamId} already has project ${team.projectId} assigned`); // Debug log
      return res.status(400).json({ msg: `Team already has a project assigned (${team.projectId}). Remove it first to add a new one.` });
    }

    console.log(`[POST /add-project] Creating new project with name: ${projectName}`); // Debug log
    // Create a new project
    const newProject = new Project({
      name: projectName,
      description: projectDescription, // Add description if provided
      teamId: teamId, // Link project to the team
      // You might want to automatically assign the mentor/coordinator if available on the team
      mentorId: team.mentorId,
      coordinatorId: team.coordinatorId
    });

    // Save the new project
    await newProject.save();
    console.log(`[POST /add-project] New project saved with ID: ${newProject._id}`); // Debug log

    console.log(`[POST /add-project] Assigning project ${newProject._id} to team ${teamId}`); // Debug log
    // Assign the new project's ID to the team
    team.projectId = newProject._id;
    // project.teamId = teamId; // This line seems incorrect, project.teamId was already set during creation

    // Save the updated team document
    await team.save(); // Only need to save team now, project is already saved
    console.log(`[POST /add-project] Team ${teamId} updated with projectId ${newProject._id}`); // Debug log

    console.log(`[POST /add-project] Successfully assigned project. Sending response.`); // Debug log
    res.status(200).json({ msg: 'Project assigned successfully', team });

  } catch (error) {
    console.error('[POST /add-project] Error assigning project to team:', error); // Debug log
    if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'Invalid ID format provided' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/team/remove-project
// @desc    Remove a specific project assignment from a specific team
// @access  Private (Admin or Mentor)
router.delete('/remove-project', protect, authorize('admin', 'mentor'), async (req, res) => {
  const { teamId, projectId } = req.body;
  console.log(`[DELETE /remove-project] Request received from user: ${req.user._id} (${req.user.role}), Body:`, req.body); // Debug log

  if (!teamId) {
    return res.status(400).json({ msg: 'Team ID is required' });
  }
  if (!projectId) {
    return res.status(400).json({ msg: 'Project ID is required' });
  }

  try {
    const team = await Team.findById(teamId);
    console.log(`[PATCH /remove-project] Found team:`, team ? team._id : 'Not Found'); // Debug log

    if (!team) {
      console.log(`Team not found with ID: ${teamId}`); // Debug log
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Find the project to ensure it exists and potentially unlink it
    const project = await Project.findById(projectId);
    console.log(`[DELETE /remove-project] Found associated project:`, project ? project._id : 'Not Found'); // Debug log

    if (!project) {
        console.log(`Project not found with ID: ${projectId}`); // Debug log
        return res.status(404).json({ msg: 'Project not found' });
    }

    // Verify the project is actually assigned to this team before removing
    console.log(`[DELETE /remove-project] Verifying assignment. Team's projectId: ${team.projectId}, Provided projectId: ${projectId}`); // Debug log
    if (!team.projectId) {
        console.log(`Team ${teamId} does not have any project assigned.`); // Debug log
        return res.status(400).json({ msg: 'This team does not have any project assigned.' });
    }
    if (!team.projectId.equals(project._id)) {
        console.log(`Project ${projectId} is not assigned to team ${teamId}. Current assignment: ${team.projectId}`); // Debug log
        return res.status(400).json({ msg: 'The specified project is not assigned to the specified team.' });
    }

    console.log(`[DELETE /remove-project] Unlinking project ${projectId} from team ${teamId}`); // Debug log
    // Remove assignments
    team.projectId = null;
    project.teamId = null; // Unlink the project from the team

    await project.save(); // Save the project first
    await team.save();
    console.log(`[DELETE /remove-project] Project ${projectId} and Team ${teamId} updated (unlinked).`); // Debug log

    console.log(`[DELETE /remove-project] Successfully removed project assignment. Sending response.`); // Debug log
    res.status(200).json({ msg: 'Project removed successfully', team });

  } catch (error) {
    console.error('[PATCH /remove-project] Error removing project from team:', error); // Debug log
    if (error.name === 'CastError') {
        return res.status(400).json({ msg: 'Invalid Team ID format provided' });
    }
    res.status(500).json({ msg: 'Server error while removing project' });
  }
});

module.exports = router;