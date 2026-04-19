const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  fraudType: {
    type: String,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  relatedModel: {
    type: String,
    enum: ['FraudReport', 'TestFraudLog'],
  },
  // Which roles should see this notification
  targetRoles: [{
    type: String,
    enum: ['admin', 'faculty', 'student'],
  }],
  // Array of user IDs who have read this notification
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
