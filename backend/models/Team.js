const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Team name cannot be more than 50 characters']
  },
  type: {
    type: String,
    enum: ['guild', 'party'],
    required: [true, 'Please specify team type']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team must have a leader']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to populate members and teamLead when querying
teamSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'members',
    select: 'username email role'
  }).populate({
    path: 'teamLeadId',
    select: 'username email role'
  });
  next();
});

module.exports = mongoose.model('Team', teamSchema);