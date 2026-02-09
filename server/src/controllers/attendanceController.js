const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Get all attendance records with filtering and pagination
 * @route   GET /api/attendance
 * @access  Private
 */
exports.getAttendanceRecords = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      semester,
      year,
      status,
      month,
      page = 1,
      limit = 10,
      sortBy = '-createdAt',
    } = req.query;

    // Build query
    const query = {};
    if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (month) query.month = { $regex: month, $options: 'i' };

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const attendance = await Attendance.find(query)
      .populate('student', 'name email department')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        pageSize: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message,
    });
  }
};

/**
 * @desc    Get attendance by student ID
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
exports.getAttendanceByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year, subject } = req.query;

    const query = { studentId };
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const attendance = await Attendance.find(query)
      .populate('student', 'name email department year')
      .sort('-year -createdAt');

    if (!attendance || attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for this student',
      });
    }

    // Calculate overall statistics
    const totalRecords = attendance.length;
    const avgAttendance =
      attendance.reduce((sum, record) => sum + record.attendancePercentage, 0) / totalRecords;

    res.json({
      success: true,
      data: attendance,
      statistics: {
        totalRecords,
        avgAttendance: Math.round(avgAttendance * 100) / 100,
        criticalCount: attendance.filter((a) => a.status === 'critical').length,
        warningCount: attendance.filter((a) => a.status === 'warning').length,
        regularCount: attendance.filter((a) => a.status === 'regular').length,
      },
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new attendance record
 * @route   POST /api/attendance
 * @access  Private
 */
exports.createAttendance = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      totalClasses,
      attendedClasses,
      month,
      year,
      semester,
      remarks,
    } = req.body;

    // Validate required fields
    if (!studentId || !subject || totalClasses === undefined || attendedClasses === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if student exists
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check for duplicate record
    const existingRecord = await Attendance.findOne({
      studentId,
      subject,
      month,
      year,
      semester,
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this student, subject, and period',
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      studentId,
      student: student._id,
      subject,
      totalClasses,
      attendedClasses,
      month,
      year,
      semester,
      remarks,
    });

    const populatedAttendance = await Attendance.findById(attendance._id).populate(
      'student',
      'name email department'
    );

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: populatedAttendance,
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance record',
      error: error.message,
    });
  }
};

/**
 * @desc    Update attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalClasses, attendedClasses, remarks } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    // Update fields
    if (totalClasses !== undefined) attendance.totalClasses = totalClasses;
    if (attendedClasses !== undefined) attendance.attendedClasses = attendedClasses;
    if (remarks !== undefined) attendance.remarks = remarks;

    await attendance.save();

    const updatedAttendance = await Attendance.findById(id).populate(
      'student',
      'name email department'
    );

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    await attendance.deleteOne();

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message,
    });
  }
};

/**
 * @desc    Get attendance statistics
 * @route   GET /api/attendance/stats/overview
 * @access  Private
 */
exports.getAttendanceStats = async (req, res) => {
  try {
    const stats = await Attendance.getAttendanceStats();

    if (!stats) {
      return res.json({
        success: true,
        data: {
          avgAttendance: 0,
          totalRecords: 0,
          regularCount: 0,
          warningCount: 0,
          criticalCount: 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        avgAttendance: Math.round(stats.avgAttendance * 100) / 100,
        totalRecords: stats.totalRecords,
        regularCount: stats.regularCount,
        warningCount: stats.warningCount,
        criticalCount: stats.criticalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get low attendance students
 * @route   GET /api/attendance/stats/low-attendance
 * @access  Private
 */
exports.getLowAttendanceStudents = async (req, res) => {
  try {
    const { threshold = 75 } = req.query;
    const students = await Attendance.getLowAttendanceStudents(parseFloat(threshold));

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching low attendance students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low attendance students',
      error: error.message,
    });
  }
};

/**
 * @desc    Get subjects list
 * @route   GET /api/attendance/filters/subjects
 * @access  Private
 */
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Attendance.distinct('subject');

    res.json({
      success: true,
      data: subjects.sort(),
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message,
    });
  }
};
