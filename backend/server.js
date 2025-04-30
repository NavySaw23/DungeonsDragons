const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

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
app.use('/api/teams', teamRoutes);

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