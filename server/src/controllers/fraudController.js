const FraudReport = require('../models/FraudReport');
const Student = require('../models/Student');
const { Parser } = require('json2csv');

/**
 * Create a new fraud report
 * POST /api/fraud-reports
 */
exports.createFraudReport = async (req, res) => {
  try {
    const { studentId, fraudType, plagiarismScore, matchedSources, attendanceIrregularities, identityAnomalies, riskScore, systemRemarks, detectionMethod, evidenceFiles } = req.body;

    // Validate student exists
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    // Create fraud report
    const fraudReport = new FraudReport({
      studentId,
      student: student._id,
      fraudType,
      plagiarismScore: plagiarismScore || null,
      matchedSources: matchedSources || [],
      attendanceIrregularities: attendanceIrregularities || {
        suspiciousPatterns: [],
        inconsistentRecords: 0,
        proxyAttendanceIndicators: 0,
      },
      identityAnomalies: identityAnomalies || {
        biometricMismatch: false,
        ipAddressAnomalies: [],
        deviceAnomalies: [],
        multipleSimultaneousLogins: 0,
      },
      riskScore,
      detectionMethod: detectionMethod || 'Automated',
      systemRemarks,
      evidenceFiles: evidenceFiles || [],
    });

    await fraudReport.save();

    // Populate student details
    await fraudReport.populate('student', 'studentId name email department year');

    res.status(201).json({
      success: true,
      message: 'Fraud report created successfully',
      data: fraudReport,
    });
  } catch (error) {
    console.error('Error creating fraud report:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fraud report',
      error: error.message,
    });
  }
};

/**
 * Get all fraud reports with filtering and pagination
 * GET /api/fraud-reports
 */
exports.getAllFraudReports = async (req, res) => {
  try {
    const {
      fraudType,
      studentId,
      status,
      riskLevel,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'detectionTimestamp',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object
    const filter = {};

    if (fraudType) {
      filter.fraudType = fraudType;
    }

    if (studentId) {
      filter.studentId = studentId;
    }

    if (status) {
      filter.status = status;
    }

    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.detectionTimestamp = {};
      if (startDate) {
        filter.detectionTimestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.detectionTimestamp.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const fraudReports = await FraudReport.find(filter)
      .populate('student', 'studentId name email department year gpa')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalReports = await FraudReport.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: fraudReports,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReports / limitNum),
        totalReports,
        reportsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < totalReports,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching fraud reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud reports',
      error: error.message,
    });
  }
};

/**
 * Get a single fraud report by ID
 * GET /api/fraud-reports/:id
 */
exports.getFraudReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const fraudReport = await FraudReport.findById(id)
      .populate('student', 'studentId name email department year gpa attendance');

    if (!fraudReport) {
      return res.status(404).json({
        success: false,
        message: 'Fraud report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: fraudReport,
    });
  } catch (error) {
    console.error('Error fetching fraud report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud report',
      error: error.message,
    });
  }
};

/**
 * Update a fraud report
 * PUT /api/fraud-reports/:id
 */
exports.updateFraudReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the fraud report
    const fraudReport = await FraudReport.findById(id);

    if (!fraudReport) {
      return res.status(404).json({
        success: false,
        message: 'Fraud report not found',
      });
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key !== 'studentId' && key !== 'student') {
        fraudReport[key] = updateData[key];
      }
    });

    // If status is being updated to reviewed states, add review metadata
    if (updateData.status && ['Confirmed', 'Dismissed', 'Resolved'].includes(updateData.status)) {
      if (!fraudReport.reviewedAt) {
        fraudReport.reviewedAt = new Date();
      }
      if (updateData.reviewedBy) {
        fraudReport.reviewedBy = updateData.reviewedBy;
      }
    }

    await fraudReport.save();
    await fraudReport.populate('student', 'studentId name email department year');

    res.status(200).json({
      success: true,
      message: 'Fraud report updated successfully',
      data: fraudReport,
    });
  } catch (error) {
    console.error('Error updating fraud report:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fraud report',
      error: error.message,
    });
  }
};

/**
 * Delete a fraud report
 * DELETE /api/fraud-reports/:id
 */
exports.deleteFraudReport = async (req, res) => {
  try {
    const { id } = req.params;

    const fraudReport = await FraudReport.findByIdAndDelete(id);

    if (!fraudReport) {
      return res.status(404).json({
        success: false,
        message: 'Fraud report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fraud report deleted successfully',
      data: fraudReport,
    });
  } catch (error) {
    console.error('Error deleting fraud report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting fraud report',
      error: error.message,
    });
  }
};

/**
 * Get fraud reports statistics
 * GET /api/fraud-reports/statistics/summary
 */
exports.getFraudStatistics = async (req, res) => {
  try {
    const { startDate, endDate, fraudType, status } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.detectionTimestamp = {};
      if (startDate) {
        filter.detectionTimestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.detectionTimestamp.$lte = new Date(endDate);
      }
    }
    if (fraudType) {
      filter.fraudType = fraudType;
    }
    if (status) {
      filter.status = status;
    }

    const statistics = await FraudReport.getStatistics(filter);
    const fraudTypeDistribution = await FraudReport.getFraudTypeDistribution(filter);

    res.status(200).json({
      success: true,
      data: {
        summary: statistics,
        fraudTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching fraud statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud statistics',
      error: error.message,
    });
  }
};

/**
 * Get fraud reports by student
 * GET /api/fraud-reports/student/:studentId
 */
exports.getFraudReportsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student exists
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    const fraudReports = await FraudReport.find({ studentId })
      .populate('student', 'studentId name email department year')
      .sort({ detectionTimestamp: -1 });

    res.status(200).json({
      success: true,
      data: fraudReports,
      count: fraudReports.length,
    });
  } catch (error) {
    console.error('Error fetching student fraud reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student fraud reports',
      error: error.message,
    });
  }
};

/**
 * Export fraud reports to CSV
 * GET /api/fraud-reports/export/csv
 */
exports.exportFraudReportsCSV = async (req, res) => {
  try {
    const { fraudType, studentId, status, riskLevel, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (fraudType) filter.fraudType = fraudType;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    if (startDate || endDate) {
      filter.detectionTimestamp = {};
      if (startDate) filter.detectionTimestamp.$gte = new Date(startDate);
      if (endDate) filter.detectionTimestamp.$lte = new Date(endDate);
    }

    // Fetch reports
    const fraudReports = await FraudReport.find(filter)
      .populate('student', 'studentId name email department year gpa')
      .sort({ detectionTimestamp: -1 })
      .lean();

    if (fraudReports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fraud reports found for the specified filters',
      });
    }

    // Transform data for CSV
    const csvData = fraudReports.map((report) => ({
      'Report ID': report._id,
      'Student ID': report.studentId,
      'Student Name': report.student?.name || 'N/A',
      'Email': report.student?.email || 'N/A',
      'Department': report.student?.department || 'N/A',
      'Year': report.student?.year || 'N/A',
      'Fraud Type': report.fraudType,
      'Plagiarism Score': report.plagiarismScore || 'N/A',
      'Risk Score': report.riskScore,
      'Risk Level': report.riskLevel,
      'Status': report.status,
      'Detection Timestamp': new Date(report.detectionTimestamp).toISOString(),
      'Detection Method': report.detectionMethod,
      'Action Taken': report.actionTaken,
      'System Remarks': report.systemRemarks || 'N/A',
      'Reviewed By': report.reviewedBy || 'N/A',
      'Reviewed At': report.reviewedAt ? new Date(report.reviewedAt).toISOString() : 'N/A',
    }));

    // Generate CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=fraud-reports-${Date.now()}.csv`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting fraud reports to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting fraud reports to CSV',
      error: error.message,
    });
  }
};

/**
 * Export fraud reports to JSON
 * GET /api/fraud-reports/export/json
 */
exports.exportFraudReportsJSON = async (req, res) => {
  try {
    const { fraudType, studentId, status, riskLevel, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (fraudType) filter.fraudType = fraudType;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    if (startDate || endDate) {
      filter.detectionTimestamp = {};
      if (startDate) filter.detectionTimestamp.$gte = new Date(startDate);
      if (endDate) filter.detectionTimestamp.$lte = new Date(endDate);
    }

    // Fetch reports
    const fraudReports = await FraudReport.find(filter)
      .populate('student', 'studentId name email department year gpa attendance')
      .sort({ detectionTimestamp: -1 })
      .lean();

    if (fraudReports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fraud reports found for the specified filters',
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=fraud-reports-${Date.now()}.json`
    );

    res.status(200).json({
      success: true,
      exportDate: new Date().toISOString(),
      totalReports: fraudReports.length,
      filters: filter,
      data: fraudReports,
    });
  } catch (error) {
    console.error('Error exporting fraud reports to JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting fraud reports to JSON',
      error: error.message,
    });
  }
};

/**
 * Bulk create fraud reports (for testing/migration purposes)
 * POST /api/fraud-reports/bulk
 */
exports.bulkCreateFraudReports = async (req, res) => {
  try {
    const { reports } = req.body;

    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of fraud reports',
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const reportData of reports) {
      try {
        const { studentId, fraudType, riskScore, ...otherFields } = reportData;

        // Validate student exists
        const student = await Student.findOne({ studentId });
        if (!student) {
          results.failed.push({
            studentId,
            reason: 'Student not found',
          });
          continue;
        }

        const fraudReport = new FraudReport({
          studentId,
          student: student._id,
          fraudType,
          riskScore,
          ...otherFields,
        });

        await fraudReport.save();
        results.successful.push(fraudReport._id);
      } catch (error) {
        results.failed.push({
          studentId: reportData.studentId,
          reason: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bulk fraud report creation completed',
      data: results,
    });
  } catch (error) {
    console.error('Error bulk creating fraud reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating fraud reports',
      error: error.message,
    });
  }
};

/**
 * Get high-risk fraud reports
 * GET /api/fraud-reports/high-risk
 */
exports.getHighRiskReports = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const highRiskReports = await FraudReport.find({
      riskLevel: { $in: ['High', 'Critical'] },
      status: { $nin: ['Dismissed', 'Resolved'] },
    })
      .populate('student', 'studentId name email department year')
      .sort({ riskScore: -1, detectionTimestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: highRiskReports,
      count: highRiskReports.length,
    });
  } catch (error) {
    console.error('Error fetching high-risk reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching high-risk reports',
      error: error.message,
    });
  }
};

/**
 * Get recent fraud reports
 * GET /api/fraud-reports/recent
 */
exports.getRecentReports = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const recentReports = await FraudReport.find({
      detectionTimestamp: { $gte: startDate },
    })
      .populate('student', 'studentId name email department year')
      .sort({ detectionTimestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentReports,
      count: recentReports.length,
    });
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent reports',
      error: error.message,
    });
  }
};
