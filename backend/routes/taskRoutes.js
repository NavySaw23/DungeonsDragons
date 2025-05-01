const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User'); // Needed for assignee validation potentially
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Debug Route ---
/**
 * @route   GET /api/tasks/debug-ping
 * @desc    Simple route to check if taskRoutes is mounted correctly
 * @access  Public
 */
router.get('/debug-ping', (req, res) => {
    res.status(200).json({ success: true, msg: 'Task routes are mounted and reachable!' });
});
// --- Task CRUD Operations ---

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private (Mentor role likely required, adjust as needed)
 */
router.post('/', protect, authorize('mentor'), async (req, res) => {
    console.log('POST /api/tasks hit');
    console.log('Request Body:', req.body); // Log the received body
    const { name, description, projectId, assignees, difficulty, deadline, submissionLink, completionStatus } = req.body;

    // Basic validation
    if (!name || !projectId) {
        console.log('Validation failed: Missing name or projectId');
        return res.status(400).json({ success: false, msg: 'Task name and projectId are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        console.log('Validation failed: Invalid Project ID format');
        return res.status(400).json({ success: false, msg: 'Invalid Project ID format.' });
    }

    try {
        // 1. Check if the project exists
        console.log(`Checking existence for project ID: ${projectId}`);
        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) {
            console.log(`Project not found: ${projectId}`);
            return res.status(404).json({ success: false, msg: 'Project not found.' });
        }

        // 2. Create the new task
        const newTask = new Task({
            name,
            description,
            projectId,
            assignees: assignees || [],
            difficulty,
            deadline,
            submissionLink,
            completionStatus
        });

        console.log('Task instance created, attempting save...');
        // 3. Save the task
        const savedTask = await newTask.save();
        console.log(`Task saved successfully with ID: ${savedTask._id}`);

        // 4. Add the task reference to the project's tasks array
        // This is crucial for the project population to work correctly later.
        console.log(`Attempting to add task ${savedTask._id} to project ${projectId}`);
        await Project.findByIdAndUpdate(projectId, { $push: { tasks: savedTask._id } });
        console.log(`Project ${projectId} updated successfully.`);

        // 5. Populate necessary fields directly before returning
        console.log(`Attempting to populate task ${savedTask._id} for response...`);
        const populatedTask = await Task.findById(savedTask._id).populate({
            path: 'assignees', select: 'username _id' // Example: Populate assignees if needed in response
        });
        console.log('Task populated. Sending response...');
        res.status(201).json({ success: true, data: populatedTask });

    } catch (error) {
        console.error("Error creating task:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, msg: error.message });
        }
        res.status(500).json({ success: false, msg: 'Server error while creating task.' });
    }
});

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Fetch details of a specific task
 * @access  Private (Requires authentication)
 */
router.get('/:taskId', protect, async (req, res) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, msg: 'Invalid Task ID format.' });
    }
    try {
        // findById triggers the 'pre find' middleware in Task.js for population
        const task = await Task.findById(taskId).populate({
            path: 'assignees', select: 'username _id' // Populate assignees for GET response
        });
        if (!task) {
            return res.status(404).json({ success: false, msg: 'Task not found.' });
        }
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ success: false, msg: 'Server error while fetching task.' });
    }
});

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update an existing task
 * @access  Private (Mentor role likely required)
 */
router.put('/:taskId', protect, authorize('mentor'), async (req, res) => {
    const { taskId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, msg: 'Invalid Task ID format.' });
    }
    delete updateData.projectId; // Prevent changing the project association

    try {
        const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true, runValidators: true })
            .populate({ // Populate directly after update
                path: 'assignees', select: 'username _id'
            });

        if (!updatedTask) {
            return res.status(404).json({ success: false, msg: 'Task not found.' });
        }
        res.status(200).json({ success: true, data: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, msg: error.message });
        }
        res.status(500).json({ success: false, msg: 'Server error while updating task.' });
    }
});

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete a task
 * @access  Private (Mentor role required)
 */
router.delete('/:taskId', protect, authorize('mentor'), async (req, res) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, msg: 'Invalid Task ID format.' });
    }
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, msg: 'Task not found.' });
        }

        // Optional: Remove task reference from its project
        // It's generally good practice to keep references consistent.
        if (task.projectId) { // Check if projectId exists before trying to update
            console.log(`Attempting to remove task ${taskId} from project ${task.projectId}`);
            await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: taskId } });
            console.log(`Project ${task.projectId} updated.`);
        }

        await task.deleteOne(); // Use deleteOne on the document
        res.status(200).json({ success: true, msg: 'Task deleted successfully.' });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ success: false, msg: 'Server error while deleting task.' });
    }
});

// --- Task Assignment Routes ---

/**
 * @route   PATCH /api/tasks/:taskId/assign
 * @desc    Assign a user to a task
 * @access  Private (Mentor role required)
 */
router.patch('/:taskId/assign', protect, authorize('mentor'), async (req, res) => {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, msg: 'Invalid Task or User ID format.' });
    }

    try {
        // Add the user ID to the assignees array if not already present
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $addToSet: { assignees: userId } }, // $addToSet prevents duplicates
            { new: true, runValidators: true } // Options
        ).populate({ // Populate directly after update
            path: 'assignees', select: 'username _id' // Populate assignees
        });
        if (!updatedTask) {
            return res.status(404).json({ success: false, msg: 'Task not found.' });
        }
        res.status(200).json({ success: true, data: updatedTask });
    } catch (error) {
        console.error("Error assigning user to task:", error);
        res.status(500).json({ success: false, msg: 'Server error while assigning task.' });
    }
});

/**
 * @route   PATCH /api/tasks/:taskId/unassign
 * @desc    Unassign a user from a task
 * @access  Private (Mentor role required)
 */
router.patch('/:taskId/unassign', protect, authorize('mentor'), async (req, res) => {
    const { taskId } = req.params;
    const { userId } = req.body; // ID of the user to unassign

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, msg: 'Invalid Task or User ID format.' });
    }

    try {
        // Remove the user ID from the assignees array
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $pull: { assignees: userId } }, // $pull removes the specified item from the array
            { new: true, runValidators: true } // Options
        ).populate({ // Populate directly after update
            path: 'assignees', select: 'username _id' // Populate assignees
        });
        if (!updatedTask) {
            return res.status(404).json({ success: false, msg: 'Task not found.' });
        }
        res.status(200).json({ success: true, data: updatedTask });
    } catch (error) {
        console.error("Error unassigning user from task:", error);
        res.status(500).json({ success: false, msg: 'Server error while unassigning task.' });
    }
});

module.exports = router;