const Student       = require('../models/Student');
const FraudReport   = require('../models/FraudReport');
const Attendance    = require('../models/Attendance');
const ExamPerformance = require('../models/ExamPerformance');
const TestSession   = require('../models/TestSession');
const TestFraudLog  = require('../models/TestFraudLog');
const Assignment    = require('../models/Assignment');

/**
 * @desc    Get consolidated dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (admin / faculty)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalStudents,
      totalFraudReports,
      activeInvestigations,
      recentFraudReports,
      totalTestsCompleted,
      flaggedSessions,
      terminatedSessions,
      testScoreAgg,
      malpracticeLogCount,
      fraudByType,
      recentFlaggedSessions,
      totalAssignments,
      plagiarismCasesCount,
    ] = await Promise.all([
      Student.countDocuments(),
      FraudReport.countDocuments(),
      FraudReport.countDocuments({ status: { $in: ['Pending', 'Under Review'] } }),
      FraudReport.countDocuments({ detectionTimestamp: { $gte: sevenDaysAgo } }),
      TestSession.countDocuments({ status: { $in: ['submitted', 'flagged'] } }),
      TestSession.countDocuments({ status: 'flagged' }),
      TestSession.countDocuments({ terminated: true }),
      TestSession.aggregate([
        { $match: { status: { $in: ['submitted', 'flagged'] } } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$percentageScore' },
            passCount: { $sum: { $cond: [{ $gte: ['$percentageScore', 50] }, 1, 0] } },
            failCount: { $sum: { $cond: [{ $lt: ['$percentageScore', 50] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]),
      // Malpractice logs = fraud events that carry points (i.e. real violations)
      TestFraudLog.countDocuments({ pointsAdded: { $gt: 0 } }),
      // Fraud type breakdown from FraudReport
      FraudReport.aggregate([
        { $group: { _id: '$fraudType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Last 8 flagged test sessions for activity table
      TestSession.find({ status: 'flagged' })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('userId', 'name email studentId')
        .select('userName userEmail fraudScore fraudCount percentageScore submittedAt status terminated'),
      // Assignment totals
      Assignment.countDocuments(),
      Assignment.countDocuments({ plagiarismStatus: { $in: ['suspected', 'fraud'] } }),
    ]);

    const perf = testScoreAgg[0] || { avgScore: 0, passCount: 0, failCount: 0, total: 0 };
    const passRate = perf.total > 0 ? Math.round((perf.passCount / perf.total) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTestsCompleted,
        totalFraudAlerts: totalFraudReports,
        malpracticeLogs: malpracticeLogCount,
        flaggedSessions,
        terminatedSessions,
        activeInvestigations,
        recentFraudReports,
        testPerformance: {
          avgScore: Math.round((perf.avgScore || 0) * 10) / 10,
          passCount: perf.passCount,
          failCount: perf.failCount,
          flaggedCount: flaggedSessions,
          passRate,
        },
        fraudByType,
        recentFlaggedSessions,
        totalAssignments,
        plagiarismCasesCount,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * @desc    Get monthly trend data for charts
 * @route   GET /api/dashboard/trends
 * @access  Private (admin / faculty)
 */
exports.getDashboardTrends = async (req, res) => {
  try {
    const months = Math.min(12, parseInt(req.query.months) || 6);
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // Monthly fraud log events (violations with points)
    const fraudTrend = await TestFraudLog.aggregate([
      { $match: { createdAt: { $gte: since }, pointsAdded: { $gt: 0 } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Monthly completed tests
    const testsTrend = await TestSession.aggregate([
      { $match: { submittedAt: { $gte: since }, status: { $in: ['submitted', 'flagged'] } } },
      {
        $group: {
          _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } },
          total: { $sum: 1 },
          flagged: { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
          avgScore: { $avg: '$percentageScore' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Build a full month-label array so the chart always renders all months
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const makeKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

    const fraudMap = {};
    fraudTrend.forEach((r) => {
      fraudMap[makeKey(r._id.year, r._id.month)] = r.count;
    });

    const testsMap = {};
    testsTrend.forEach((r) => {
      testsMap[makeKey(r._id.year, r._id.month)] = {
        total: r.total,
        flagged: r.flagged,
        avgScore: Math.round((r.avgScore || 0) * 10) / 10,
      };
    });

    const combined = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = makeKey(d.getFullYear(), d.getMonth() + 1);
      const label = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
      combined.push({
        month: label,
        fraudEvents: fraudMap[key] || 0,
        testsTotal: testsMap[key]?.total || 0,
        testsFlagged: testsMap[key]?.flagged || 0,
        avgScore: testsMap[key]?.avgScore || 0,
      });
    }

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard trends' });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/recent-activities
 * @access  Private
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentFraudReports = await FraudReport.find()
      .populate('student', 'studentId name email department')
      .sort('-detectionTimestamp')
      .limit(parseInt(limit));

    const recentAttendance = await Attendance.find({ status: 'critical' })
      .populate('student', 'studentId name email department')
      .sort('-createdAt')
      .limit(parseInt(limit));

    const recentFailingExams = await ExamPerformance.find({ status: 'Fail' })
      .populate('student', 'studentId name email department')
      .sort('-examDate')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { recentFraudReports, recentAttendance, recentFailingExams },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent activities' });
  }
};

/**
 * @desc    Get top high-risk students
 * @route   GET /api/dashboard/high-risk-students
 * @access  Private
 */
exports.getHighRiskStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const highRiskStudents = await Student.find({
      riskLevel: { $in: ['Critical', 'High'] },
    })
      .sort({ riskLevel: -1, gpa: 1, attendance: 1 })
      .limit(parseInt(limit));

    const studentsWithFraudCounts = await Promise.all(
      highRiskStudents.map(async (student) => {
        const fraudCount = await FraudReport.countDocuments({ studentId: student.studentId });
        return { ...student.toObject(), fraudReportCount: fraudCount };
      })
    );

    res.json({ success: true, data: studentsWithFraudCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch high-risk students' });
  }
};


/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total students
    const totalStudents = await Student.countDocuments();

    // Get fraud alerts (all fraud reports)
    const fraudAlerts = await FraudReport.countDocuments();

    // Get high risk cases (Critical and High risk level)
    const highRiskCases = await FraudReport.countDocuments({
      riskLevel: { $in: ['Critical', 'High'] },
    });

    // Get active investigations (Pending and Under Review status)
    const activeInvestigations = await FraudReport.countDocuments({
      status: { $in: ['Pending', 'Under Review'] },
    });

    // Get fraud type distribution
    const fraudTypeDistribution = await FraudReport.aggregate([
      {
        $group: {
          _id: '$fraudType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get risk level distribution
    const riskLevelDistribution = await FraudReport.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get student risk distribution
    const studentRiskDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get recent fraud reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFraudReports = await FraudReport.countDocuments({
      detectionTimestamp: { $gte: sevenDaysAgo },
    });

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] },
          },
        },
      },
    ]);

    // Get exam statistics
    const examStats = await ExamPerformance.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          failCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] },
          },
        },
      },
    ]);

    // Format fraud type distribution
    const fraudTypes = {};
    fraudTypeDistribution.forEach((item) => {
      fraudTypes[item._id] = item.count;
    });

    // Format risk level distribution
    const riskLevels = {};
    riskLevelDistribution.forEach((item) => {
      riskLevels[item._id] = item.count;
    });

    // Format student risk distribution
    const studentRiskLevels = {};
    studentRiskDistribution.forEach((item) => {
      studentRiskLevels[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        fraudAlerts,
        highRiskCases,
        activeInvestigations,
        recentFraudReports,
        avgAttendance:
          attendanceStats.length > 0
            ? Math.round(attendanceStats[0].avgAttendance * 100) / 100
            : 0,
        criticalAttendanceCount:
          attendanceStats.length > 0 ? attendanceStats[0].criticalCount : 0,
        avgExamPercentage:
          examStats.length > 0 ? Math.round(examStats[0].avgPercentage * 100) / 100 : 0,
        failedExamsCount: examStats.length > 0 ? examStats[0].failCount : 0,
        fraudTypeDistribution: fraudTypes,
        riskLevelDistribution: riskLevels,
        studentRiskDistribution: studentRiskLevels,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get dashboard trends (monthly data)
 * @route   GET /api/dashboard/trends
 * @access  Private
 */
exports.getDashboardTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    // Get fraud reports trend
    const fraudTrend = await FraudReport.aggregate([
      {
        $match: {
          detectionTimestamp: { $gte: monthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$detectionTimestamp' },
            month: { $month: '$detectionTimestamp' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Get attendance trend
    const attendanceTrend = await Attendance.aggregate([
      {
        $match: {
          createdAt: { $gte: monthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          avgAttendance: { $avg: '$attendancePercentage' },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Get exam performance trend
    const examTrend = await ExamPerformance.aggregate([
      {
        $match: {
          examDate: { $gte: monthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$examDate' },
            month: { $month: '$examDate' },
          },
          avgPercentage: { $avg: '$percentage' },
          failCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        fraudTrend,
        attendanceTrend,
        examTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard trends',
      error: error.message,
    });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/recent-activities
 * @access  Private
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent fraud reports
    const recentFraudReports = await FraudReport.find()
      .populate('student', 'studentId name email department')
      .sort('-detectionTimestamp')
      .limit(parseInt(limit));

    // Get recent attendance records
    const recentAttendance = await Attendance.find({ status: 'critical' })
      .populate('student', 'studentId name email department')
      .sort('-createdAt')
      .limit(parseInt(limit));

    // Get recent failing exams
    const recentFailingExams = await ExamPerformance.find({ status: 'Fail' })
      .populate('student', 'studentId name email department')
      .sort('-examDate')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        recentFraudReports,
        recentAttendance,
        recentFailingExams,
      },
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message,
    });
  }
};

/**
 * @desc    Get top high-risk students
 * @route   GET /api/dashboard/high-risk-students
 * @access  Private
 */
exports.getHighRiskStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const highRiskStudents = await Student.find({
      riskLevel: { $in: ['Critical', 'High'] },
    })
      .sort({ riskLevel: -1, gpa: 1, attendance: 1 })
      .limit(parseInt(limit));

    // Get fraud report counts for each student
    const studentsWithFraudCounts = await Promise.all(
      highRiskStudents.map(async (student) => {
        const fraudCount = await FraudReport.countDocuments({
          studentId: student.studentId,
        });
        return {
          ...student.toObject(),
          fraudReportCount: fraudCount,
        };
      })
    );

    res.json({
      success: true,
      data: studentsWithFraudCounts,
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
