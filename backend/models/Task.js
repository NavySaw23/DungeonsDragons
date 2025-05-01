// task.model.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a task name'],
    trim: true,
    maxlength: [100, 'Task name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Removed validator from individual element
  }], // Validation moved outside the array definition
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  deadline: {
    type: Date
  },
  submissionLink: {
    type: String,
    trim: true,
    default: null,
  },
  completionStatus: {
    type: String,
    enum: ['completed', 'in-progress', 'not-started','cancelled', 'overdue', 'waiting-for-grading'], 
    default: 'not-started'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add validation for the assignees array length at the schema level
taskSchema.path('assignees').validate(function(value) {
  // 'value' here refers to the entire assignees array
  return value.length <= 4;
}, 'A task can have a maximum of 4 assignees.');



// Virtual field to determine the effective status, considering the deadline
taskSchema.virtual('effectiveStatus').get(function() {
  const now = new Date();
  // If already completed or cancelled, return that status
  if (this.completionStatus === 'completed' || this.completionStatus === 'cancelled') {
    return this.completionStatus;
  }
  // If not completed/cancelled, deadline exists, and deadline has passed
  if (this.deadline && this.deadline < now && (this.completionStatus === 'in-progress' || this.completionStatus === 'not-started')) {
    return 'overdue'; // Effectively overdue
  }
  // Otherwise, return the stored status
  return this.completionStatus;
});

// Middleware to populate assignees and projectId when querying
// taskSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'assignees',
//     select: 'userId fullName username email role'
//   }).populate({
//     path: 'projectId',
//     select: 'name description' // Include relevant project fields
//   });
//   next();
// });

module.exports = mongoose.model('Task', taskSchema);