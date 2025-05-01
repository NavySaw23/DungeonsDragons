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
    validate: {
      validator: function(v) {
        return v.length <= 4;
      },
      message: 'A task can have a maximum of 4 assignees.'
    }
  }],
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
    trim: true
  },
  completionStatus: {
    type: String,
    enum: ['completed', 'incomplete'],
    default: 'incomplete'
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

// Middleware to populate assignees and projectId when querying
taskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignees',
    select: 'userId fullName username email role'
  }).populate({
    path: 'projectId',
    select: 'name description' // Include relevant project fields
  });
  next();
});

module.exports = mongoose.model('Task', taskSchema);