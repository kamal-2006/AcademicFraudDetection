const FraudReport = require('../models/FraudReport');
const Student = require('../models/Student');

/**
 * @desc    Get all plagiarism cases
 * @route   GET /api/plagiarism
 * @access  Private
 */
exports.getAllPlagiarismCases = async (req, res) => {
  try {
    const {
      studentId,
      status,
      minScore,
      maxScore,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'detectionTimestamp',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object - only get Plagiarism fraud type
    const filter = { fraudType: 'Plagiarism' };

    if (studentId) {
      filter.studentId = studentId;
    }

    if (status) {
      filter.status = status;
    }

    // Score filtering
    if (minScore || maxScore) {
      filter.plagiarismScore = {};
      if (minScore) {
        filter.plagiarismScore.$gte = parseFloat(minScore);
      }
      if (maxScore) {
        filter.plagiarismScore.$lte = parseFloat(maxScore);
      }
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
    const plagiarismCases = await FraudReport.find(filter)
      .populate('student', 'studentId name email department year gpa')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalCases = await FraudReport.countDocuments(filter);

    // Format response to match frontend expectations
    const formattedCases = plagiarismCases.map((report) => ({
      id: report._id,
      studentId: report.studentId,
      name: report.student?.name || 'Unknown',
      assignmentName: report.systemRemarks || 'Assignment',
      submittedDate: report.detectionTimestamp,
      similarity: report.plagiarismScore || 0,
      matchedWith: report.matchedSources?.map((s) => s.source).join(', ') || 'Unknown',
      status: report.riskLevel === 'Critical' ? 'critical' : 
              report.riskLevel === 'High' ? 'high' : 
              report.riskLevel === 'Medium' ? 'medium' : 'low',
      riskLevel: report.riskLevel,
      detectionMethod: report.detectionMethod,
      matchedSources: report.matchedSources,
      evidenceFiles: report.evidenceFiles,
      _id: report._id,
    }));

    res.status(200).json({
      success: true,
      data: formattedCases,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCases / limitNum),
        totalCases,
        casesPerPage: limitNum,
        hasNextPage: pageNum * limitNum < totalCases,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching plagiarism cases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plagiarism cases',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single plagiarism case by ID
 * @route   GET /api/plagiarism/:id
 * @access  Private
 */
exports.getPlagiarismCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const plagiarismCase = await FraudReport.findOne({
      _id: id,
      fraudType: 'Plagiarism',
    }).populate('student', 'studentId name email department year gpa attendance');

    if (!plagiarismCase) {
      return res.status(404).json({
        success: false,
        message: 'Plagiarism case not found',
      });
    }

    // Format response
    const formattedCase = {
      id: plagiarismCase._id,
      studentId: plagiarismCase.studentId,
      name: plagiarismCase.student?.name || 'Unknown',
      assignmentName: plagiarismCase.systemRemarks || 'Assignment',
      submittedDate: plagiarismCase.detectionTimestamp,
      similarity: plagiarismCase.plagiarismScore || 0,
      matchedWith: plagiarismCase.matchedSources?.map((s) => s.source).join(', ') || 'Unknown',
      status: plagiarismCase.riskLevel === 'Critical' ? 'critical' : 
              plagiarismCase.riskLevel === 'High' ? 'high' : 
              plagiarismCase.riskLevel === 'Medium' ? 'medium' : 'low',
      riskLevel: plagiarismCase.riskLevel,
      detectionMethod: plagiarismCase.detectionMethod,
      matchedSources: plagiarismCase.matchedSources,
      evidenceFiles: plagiarismCase.evidenceFiles,
      student: plagiarismCase.student,
      _id: plagiarismCase._id,
    };

    res.status(200).json({
      success: true,
      data: formattedCase,
    });
  } catch (error) {
    console.error('Error fetching plagiarism case:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plagiarism case',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new plagiarism case
 * @route   POST /api/plagiarism
 * @access  Private
 */
exports.createPlagiarismCase = async (req, res) => {
  try {
    const {
      studentId,
      plagiarismScore,
      matchedSources,
      assignmentName,
      detectionMethod,
      evidenceFiles,
    } = req.body;

    // Validate student exists
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    // Calculate risk score based on plagiarism score
    let riskScore = plagiarismScore;
    if (plagiarismScore >= 80) {
      riskScore = 95;
    } else if (plagiarismScore >= 60) {
      riskScore = 75;
    } else if (plagiarismScore >= 40) {
      riskScore = 50;
    }

    // Create fraud report for plagiarism
    const fraudReport = new FraudReport({
      studentId,
      student: student._id,
      fraudType: 'Plagiarism',
      plagiarismScore,
      matchedSources: matchedSources || [],
      riskScore,
      detectionMethod: detectionMethod || 'Automated',
      systemRemarks: assignmentName || 'Plagiarism detected',
      evidenceFiles: evidenceFiles || [],
    });

    await fraudReport.save();

    // Populate student details
    await fraudReport.populate('student', 'studentId name email department year');

    res.status(201).json({
      success: true,
      message: 'Plagiarism case created successfully',
      data: fraudReport,
    });
  } catch (error) {
    console.error('Error creating plagiarism case:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating plagiarism case',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a plagiarism case
 * @route   PUT /api/plagiarism/:id
 * @access  Private
 */
exports.updatePlagiarismCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the plagiarism case
    const plagiarismCase = await FraudReport.findOne({
      _id: id,
      fraudType: 'Plagiarism',
    });

    if (!plagiarismCase) {
      return res.status(404).json({
        success: false,
        message: 'Plagiarism case not found',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'plagiarismScore',
      'matchedSources',
      'status',
      'systemRemarks',
      'evidenceFiles',
      'detectionMethod',
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        plagiarismCase[field] = updateData[field];
      }
    });

    await plagiarismCase.save();

    await plagiarismCase.populate('student', 'studentId name email department year');

    res.status(200).json({
      success: true,
      message: 'Plagiarism case updated successfully',
      data: plagiarismCase,
    });
  } catch (error) {
    console.error('Error updating plagiarism case:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plagiarism case',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a plagiarism case
 * @route   DELETE /api/plagiarism/:id
 * @access  Private
 */
exports.deletePlagiarismCase = async (req, res) => {
  try {
    const { id } = req.params;

    const plagiarismCase = await FraudReport.findOne({
      _id: id,
      fraudType: 'Plagiarism',
    });

    if (!plagiarismCase) {
      return res.status(404).json({
        success: false,
        message: 'Plagiarism case not found',
      });
    }

    await plagiarismCase.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Plagiarism case deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plagiarism case:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plagiarism case',
      error: error.message,
    });
  }
};

/**
 * @desc    Get plagiarism statistics
 * @route   GET /api/plagiarism/stats/overview
 * @access  Private
 */
exports.getPlagiarismStats = async (req, res) => {
  try {
    const stats = await FraudReport.aggregate([
      {
        $match: { fraudType: 'Plagiarism' },
      },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          avgPlagiarismScore: { $avg: '$plagiarismScore' },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Critical'] }, 1, 0] },
          },
          highCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'High'] }, 1, 0] },
          },
          mediumCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Medium'] }, 1, 0] },
          },
          lowCount: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Low'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalCases: 0,
      avgPlagiarismScore: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        avgPlagiarismScore: Math.round((result.avgPlagiarismScore || 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching plagiarism statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plagiarism statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get high-score plagiarism cases
 * @route   GET /api/plagiarism/stats/high-score
 * @access  Private
 */
exports.getHighScoreCases = async (req, res) => {
  try {
    const { threshold = 70, limit = 10 } = req.query;

    const highScoreCases = await FraudReport.find({
      fraudType: 'Plagiarism',
      plagiarismScore: { $gte: parseFloat(threshold) },
    })
      .populate('student', 'studentId name email department year')
      .sort('-plagiarismScore')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: highScoreCases,
      count: highScoreCases.length,
    });
  } catch (error) {
    console.error('Error fetching high-score plagiarism cases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching high-score plagiarism cases',
      error: error.message,
    });
  }
};
