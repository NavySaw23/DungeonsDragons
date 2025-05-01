const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'mentor', 'coordinator'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true,
    immutable: true
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  playerClass: {
    type: String,
    enum: ['Adventurer', 'Warrior', 'Mage', 'Thief', 'Healer', 'Captain', 'Guild Master'],
    default: 'Adventurer' // Default player class
  },
  health: {
    type: Number,
    default: 100,
    min: [0, 'Health cannot be less than 0'],
    max: [100, 'Health cannot exceed 100']
    // Note: min/max validators primarily work on .save() or .validate(). Updates need careful handling.
  }
});


// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Enforce playerClass based on role
  if (this.role === 'mentor' && this.playerClass !== 'Captain') {
    this.playerClass = 'Captain';
  } else if (this.role === 'coordinator' && this.playerClass !== 'Guild Master') {
    this.playerClass = 'Guild Master';
  }
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);