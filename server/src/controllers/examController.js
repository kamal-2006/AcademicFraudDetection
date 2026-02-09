const ExamPerformance = require('../models/ExamPerformance');
const Student = require('../models/Student');

/**
 * @desc    Get all exam performance records with filtering and pagination
 * @route   GET /api/exams
 * @access  Private
 */
exports.getExamRecords = async (req, res) => {
  try {
    const {
      studentId,
      subject,
      examType,
      semester,
      year,
      status,
      page = 1,
      limit = 10,
      sortBy = '-examDate',
    } = req.query;

    // Build query
    const query = {};
    if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (examType) query.examType = examType;
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const exams = await ExamPerformance.find(query)
      .populate('student', 'name email department')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ExamPerformance.countDocuments(query);

    res.json({
      success: true,
      data: exams,
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
    console.error('Error fetching exam records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam records',
      error: error.message,
    });
  }
};

/**
 * @desc    Get exam performance by student ID
 * @route   GET /api/exams/student/:studentId
 * @access  Private
 */
exports.getExamsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year, subject, examType } = req.query;

    const query = { studentId };
    if (semester) query.semester = semester;
    if (year) query.year = parseInt(year);
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (examType) query.examType = examType;

    const exams = await ExamPerformance.find(query)
      .populate('student', 'name email department year')
      .sort('-examDate');

    if (!exams || exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No exam records found for this student',
      });
    }

    // Calculate overall statistics
    const totalExams = exams.length;
    const avgPercentage = exams.reduce((sum, exam) => sum + exam.percentage, 0) / totalExams;
    const passCount = exams.filter((e) => e.status === 'Pass').length;
    const failCount = exams.filter((e) => e.status === 'Fail').length;

    // Grade distribution
    const gradeDistribution = {};
    exams.forEach((exam) => {
      gradeDistribution[exam.grade] = (gradeDistribution[exam.grade] || 0) + 1;
    });

    res.json({
      success: true,
      data: exams,
      statistics: {
        totalExams,
        avgPercentage: Math.round(avgPercentage * 100) / 100,
        passCount,
        failCount,
        passRate: Math.round((passCount / totalExams) * 100 * 100) / 100,
        gradeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching student exam performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student exam performance',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new exam performance record
 * @route   POST /api/exams
 * @access  Private
 */
exports.createExamRecord = async (req, res) => {
  try {
    const {
      studentId,
      examName,
      examType,
      subject,
      totalMarks,
      obtainedMarks,
      semester,
      year,
      examDate,
      remarks,
    } = req.body;

    // Validate required fields
    if (
      !studentId ||
      !examName ||
      !examType ||
      !subject ||
      totalMarks === undefined ||
      obtainedMarks === undefined
    ) {
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
    const existingRecord = await ExamPerformance.findOne({
      studentId,
      examName,
      subject,
      examType,
      semester,
      year,
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Exam record already exists for this student and exam',
      });
    }

    // Create exam record
    const exam = await ExamPerformance.create({
      studentId,
      student: student._id,
      examName,
      examType,
      subject,
      totalMarks,
      obtainedMarks,
      semester,
      year,
      examDate: examDate || new Date(),
      remarks,
    });

    const populatedExam = await ExamPerformance.findById(exam._id).populate(
      'student',
      'name email department'
    );

    res.status(201).json({
      success: true,
      message: 'Exam record created successfully',
      data: populatedExam,
    });
  } catch (error) {
    console.error('Error creating exam record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam record',
      error: error.message,
    });
  }
};

/**
 * @desc    Update exam performance record
 * @route   PUT /api/exams/:id
 * @access  Private
 */
exports.updateExamRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalMarks, obtainedMarks, examDate, remarks } = req.body;

    const exam = await ExamPerformance.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found',
      });
    }

    // Update fields
    if (totalMarks !== undefined) exam.totalMarks = totalMarks;
    if (obtainedMarks !== undefined) exam.obtainedMarks = obtainedMarks;
    if (examDate !== undefined) exam.examDate = examDate;
    if (remarks !== undefined) exam.remarks = remarks;

    await exam.save();

    const updatedExam = await ExamPerformance.findById(id).populate(
      'student',
      'name email department'
    );

    res.json({
      success: true,
      message: 'Exam record updated successfully',
      data: updatedExam,
    });
  } catch (error) {
    console.error('Error updating exam record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exam record',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete exam performance record
 * @route   DELETE /api/exams/:id
 * @access  Private
 */
exports.deleteExamRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await ExamPerformance.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found',
      });
    }

    await exam.deleteOne();

    res.json({
      success: true,
      message: 'Exam record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam record',
      error: error.message,
    });
  }
};

/**
 * @desc    Get exam statistics
 * @route   GET /api/exams/stats/overview
 * @access  Private
 */
exports.getExamStats = async (req, res) => {
  try {
    const stats = await ExamPerformance.getExamStats();

    if (!stats) {
      return res.json({
        success: true,
        data: {
          avgPercentage: 0,
          totalExams: 0,
          passCount: 0,
          failCount: 0,
          passRate: 0,
          gradeDistribution: {},
        },
      });
    }

    res.json({
      success: true,
      data: {
        avgPercentage: Math.round(stats.avgPercentage * 100) / 100,
        totalExams: stats.totalExams,
        passCount: stats.passCount,
        failCount: stats.failCount,
        passRate: stats.passRate,
        gradeDistribution: stats.gradeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching exam statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get failing students
 * @route   GET /api/exams/stats/failing
 * @access  Private
 */
exports.getFailingStudents = async (req, res) => {
  try {
    const students = await ExamPerformance.getFailingStudents();

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching failing students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failing students',
      error: error.message,
    });
  }
};

/**
 * @desc    Get high-risk students based on exam performance
 * @route   GET /api/exams/stats/high-risk
 * @access  Private
 */
exports.getHighRiskStudents = async (req, res) => {
  try {
    const students = await ExamPerformance.getHighRiskStudents();

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching high-risk students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch high-risk students',
      error: error.message,
    });
  }
};

/**
 * @desc    Get subjects list
 * @route   GET /api/exams/filters/subjects
 * @access  Private
 */
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await ExamPerformance.distinct('subject');

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

/**
 * @desc    Get exam types list
 * @route   GET /api/exams/filters/exam-types
 * @access  Private
 */
exports.getExamTypes = async (req, res) => {
  try {
    const examTypes = await ExamPerformance.distinct('examType');

    res.json({
      success: true,
      data: examTypes.sort(),
    });
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam types',
      error: error.message,
    });
  }
};
