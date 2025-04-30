const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date
  },
  textDescription: {
    type: String
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to populate mentorId, coordinatorId, teamId, and tasks when querying
projectSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'mentorId',
    select: 'userId fullName username email role'
  }).populate({
    path: 'coordinatorId',
    select: 'userId fullName username email role'
  }).populate({
    path: 'teamId',
    select: 'teamId name'
  }).populate({
    path: 'tasks',
    select: 'taskId title status' // Adjust fields as needed
  });
  next();
});

module.exports = mongoose.model('Project', projectSchema);