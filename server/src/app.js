const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const studentRoutes = require('./routes/studentRoutes');

app.get("/", (req, res) => {
  res.send("IAFDS Backend API running on port 5000");
});

// API Routes
app.use('/api/students', studentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message,
  });
});

module.exports = app;
