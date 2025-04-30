const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true,
    immutable: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
    maxlength: [50, 'Team name cannot be more than 50 characters']
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
  maxSize: {
    type: Number,
    min: 1,
    max: 4,
    default: 4
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teammateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    select: 'userId username email role' // Removed fullName to match original
  }).populate({
    path: 'teamLeadId',
    select: 'userId username email role' // Removed fullName to match original
  }).populate({
    path: 'mentorId',
    select: 'userId username email role' // Removed fullName to match original
  }).populate({
    path: 'teammateId',
    select: 'userId username email role' // Removed fullName to match original
  }).populate({
    path: 'coordinatorId',
    select: 'userId username email role' // Removed fullName to match original
  });
  next();
});

// Middleware to ensure mentorId is set only for users with 'mentor' role
teamSchema.pre('save', async function(next) {
  if (this.mentorId) {
    const mentorUser = await mongoose.model('User').findById(this.mentorId);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return next(new Error('mentorId can only be set to a user with the "mentor" role.'));
    }
  }
  next();
});

// Middleware to ensure teammateId is set only for users with 'student' role
teamSchema.pre('save', async function(next) {
  if (this.teammateId) {
    const studentUser = await mongoose.model('User').findById(this.teammateId);
    if (!studentUser || studentUser.role !== 'student') {
      return next(new Error('teammateId can only be set to a user with the "student" role.'));
    }
  }
  next();
});

// Middleware to ensure coordinatorId is set only for users with 'coordinator' role
teamSchema.pre('save', async function(next) {
  if (this.coordinatorId) {
    const coordinatorUser = await mongoose.model('User').findById(this.coordinatorId);
    if (!coordinatorUser || coordinatorUser.role !== 'coordinator') {
      return next(new Error('coordinatorId can only be set to a user with the "coordinator" role.'));
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);