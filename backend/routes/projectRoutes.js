const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
// Assuming User model might be needed for future validation/checks, though not strictly for these routes yet
const { protect, authorize } = require('../middleware/authMiddleware'); // Import middleware
// const User = require('../models/User');

const router = express.Router();

// --- Task Specific Routes ---

/**
 * @route   POST /api/task/create  (Effective path due to server.js mount)
 * @desc    Create a new task and add it to its project
 * @access  Private (Requires authentication)
 */
router.post('/task/create', protect, async (req, res) => { // Added protect middleware
    console.log('POST /api/task/create hit');
    const { name, description, projectId, assignees, difficulty, deadline, submissionLink, completionStatus } = req.body;

    // Basic validation
    if (!name || !projectId) {
        return res.status(400).json({ success: false, message: 'Task name and projectId are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }

    try {
        console.log('Request Body:', req.body);
        // 1. Check if the project exists
        console.log(`Checking existence of project with ID: ${projectId}`);
        // Use exists() or countDocuments() to avoid triggering Project's pre-find populate hook
        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) {
            console.log('Project not found:', projectId);
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        console.log('Project exists:', projectId);
        // 2. Create the new task
        const newTask = new Task({
            name,
            description,
            projectId,
            assignees: assignees || [], // Ensure assignees is an array
            difficulty,
            deadline,
            submissionLink,
            completionStatus
            // createdAt and updatedAt are handled automatically by timestamps: true
        });

        console.log('New task object created:', newTask);

        // 3. Save the task
        console.log('Attempting to save new task...');
        const savedTask = await newTask.save();
        console.log('Task saved successfully:', savedTask._id);

        // 4. Add the task reference to the project's tasks array
        // project.tasks.push(savedTask._id); // Removed this line
        console.log(`Attempting to add task ${savedTask._id} to project ${projectId}...`);
        // Use findByIdAndUpdate for atomic push operation
        await Project.findByIdAndUpdate(
            projectId,
            { $push: { tasks: savedTask._id } }
        );
        console.log('Project updated successfully.');

        // 5. Populate the saved task before sending response (optional, but good practice)
        // OPTION A (Fastest): Return the saved task without populating here.
        console.log(`Task ${savedTask._id} created. Returning basic task data.`);
        res.status(201).json({ success: true, data: savedTask }); // Return non-populated task
    } catch (error) {
        console.error("Error creating task:", error);
        // Handle potential validation errors from Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error while creating task.' });
    }
});

/**
 * @route   GET /api/task/:taskId/fetch (Effective path due to server.js mount)
 * @desc    Fetch details of a specific task
 * @access  Private (Requires authentication)
 */
router.get('/task/:taskId/fetch', protect, async (req, res) => { // Added protect middleware
    console.log(`GET /api/task/${req.params.taskId}/fetch hit`);
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.log('Invalid Task ID format received:', taskId);
        return res.status(400).json({ success: false, message: 'Invalid Task ID format.' });
    }

    try {
        console.log(`Attempting to find task with ID: ${taskId}`);
        // findById triggers the 'pre find' middleware in Task.js for population
        const task = await Task.findById(taskId);

        if (!task) {
            console.log('Task not found:', taskId);
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        console.log('Task found and populated:', task);
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching task.' });
    }
});

/**
 * @route   PUT /api/task/:taskId/edit (Effective path due to server.js mount)
 * @desc    Update an existing task
 * @access  Private (Requires authentication)
 */
router.put('/task/:taskId/edit', protect, async (req, res) => { // Added protect middleware
    console.log(`PUT /api/task/${req.params.taskId}/edit hit`);
    const { taskId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.log('Invalid Task ID format received:', taskId);
        return res.status(400).json({ success: false, message: 'Invalid Task ID format.' });
    }

    // Prevent updating projectId if needed, or add validation
    delete updateData.projectId; // Generally, tasks shouldn't switch projects easily
    console.log('Update data (projectId removed if present):', updateData);

    try {
        console.log(`Attempting to find and update task with ID: ${taskId}`);
        // Find and update the task. { new: true } returns the updated document.
        // runValidators: true ensures schema validations are run on update.
        const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true, runValidators: true });

        if (!updatedTask) {
            console.log('Task not found for update:', taskId);
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }
        console.log('Task updated (before population):', updatedTask);

        // Re-populate if necessary (findByIdAndUpdate doesn't trigger pre-find hooks directly on the result)
        console.log(`Populating updated task ${updatedTask._id} for response...`);
        const populatedTask = await Task.findById(updatedTask._id);

        res.status(200).json({ success: true, data: populatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error while updating task.' });
    }
});

/**
 * @route   DELETE /api/task/delete (Effective path due to server.js mount)
 * @desc    Delete a task document (Requires taskId in body)
 * @access  Private (Mentor role required)
 */
router.delete('/task/delete', protect, authorize('mentor'), async (req, res) => { // Route changed, protect/authorize kept
    console.log(`DELETE /api/task/delete hit`);
    // projectId is no longer strictly needed for the core logic, but validation remains.
    const { taskId, projectId } = req.body; // Get IDs from body

    // --- Validation ---
    // Keep projectId validation for consistency or potential future use,
    // but it's not used in the deletion logic anymore.
    if (!taskId || !projectId) {
        return res.status(400).json({ success: false, message: 'Both taskId and projectId are required in the request body.' });
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.log('Invalid Task ID format received in body:', taskId);
        return res.status(400).json({ success: false, message: 'Invalid Task ID format.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        console.log('Invalid Project ID format received in body:', projectId);
        return res.status(400).json({ success: false, message: 'Invalid Project ID format.' });
    }
    // --- End Validation ---

    try {
        // 1. Delete the task itself
        console.log(`Attempting to delete task with ID: ${taskId}`);
        const deletionResult = await Task.findByIdAndDelete(taskId);

        // Check deletion result (findByIdAndDelete returns the deleted doc or null)
        if (!deletionResult) {
             // This case might occur if the task was already deleted or never existed.
            console.log(`Task ${taskId} not found for deletion.`);
            return res.status(404).json({ success: false, message: 'Task not found.' });
        } else {
        console.log('Task deleted successfully.');
        }

        // 2. Send success response
        res.status(200).json({ success: true, message: 'Task deleted successfully.' });

    } catch (error) {
        console.error("Error deleting task:", error);
        // Handle potential CastError if taskId has invalid format despite initial check
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Task ID format encountered during operation.' });
        }
        res.status(500).json({ success: false, message: 'Server error while deleting task.' });
    }
});


module.exports = router;