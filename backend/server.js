const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// --- Load Models (Register Schemas with Mongoose) ---
require('./models/User');
require('./models/Team');
require('./models/Project');
require('./models/Task');

// Initialize Express app
const app = express();

// --- Middleware ---
// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// --- Mount Routers ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const teamRoutes = require('./routes/teamRoutes');
app.use('/api/team', teamRoutes); // Changed base path to singular '/api/team' to match route comments

// const projectRoutes = require('./routes/projectRoutes'); // Keep if project-specific routes exist, mount appropriately (e.g., /api/projects)
// app.use('/api', projectRoutes); // REMOVED - Conflicted with task routes

const adminRoutes = require('./routes/adminRoutes'); // Adjust path if needed
app.use('/api/admin', adminRoutes); 

const taskRoutes = require('./routes/taskRoutes'); // Add this line
app.use('/api/tasks', taskRoutes); // Mount task routes under /api/tasks

// --- Basic Test Route ---
app.get('/', (req, res) => {
  res.send('Deadlines & Dragons API Running!');
});

// Define the port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});