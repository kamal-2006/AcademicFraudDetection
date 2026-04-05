const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const examRoutes = require('./routes/examRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const plagiarismRoutes   = require('./routes/plagiarismRoutes');
const testRoutes         = require('./routes/testRoutes');
const assignmentRoutes   = require('./routes/assignmentRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');

app.get("/", (req, res) => {
  res.send("IAFDS Backend API running on port 5000");
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fraud-reports', fraudRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plagiarism',   plagiarismRoutes);
app.use('/api/assignments',  assignmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/test',         testRoutes);

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
