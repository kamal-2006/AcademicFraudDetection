const mongoose = require('mongoose');

const assignedAssignmentSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdByName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    assignmentMode: {
      type: String,
      enum: ['students', 'group'],
      required: true,
    },
    assignedStudentIds: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one student must be assigned.',
      },
      index: true,
    },
    groupFilter: {
      department: { type: String, trim: true, default: '' },
      year: { type: Number, min: 1, max: 5, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

assignedAssignmentSchema.index({ assignedStudentIds: 1, isActive: 1, dueDate: 1 });

module.exports = mongoose.model('AssignedAssignment', assignedAssignmentSchema);
