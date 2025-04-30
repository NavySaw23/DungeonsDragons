// routes/projectRoutes.js (Example)
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
// Example in projectRoutes.js
const { protect, authorize } = require('../middleware/authMiddleware');

// Only mentors or admins can create projects
router.post('/', protect, authorize('mentor', 'admin'), /* createProject controller */);

// Any authenticated user can view projects
router.get('/', protect, /* getProjects controller */);

// Only admins can delete projects
router.delete('/:id', protect, authorize('admin'), /* deleteProject controller */);


router.route('/')
  .post(protect, /* createProject controller */) // Only authenticated users can create
  .get(protect, /* getProjects controller */);    // Only authenticated users can view

router.route('/:id')
  .get(protect, /* getProjectById controller */)
  .put(protect, /* updateProject controller */)
  .delete(protect, /* deleteProject controller */);

module.exports = router;
