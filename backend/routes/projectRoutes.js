const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
// Assuming User model might be needed for future validation/checks, though not strictly for these routes yet
const { protect, authorize } = require('../middleware/authMiddleware'); // Import middleware
// const User = require('../models/User');

const router = express.Router();

// Add any actual project-specific routes here if needed in the future

module.exports = router;