const Student = require('../models/Student');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Parse CSV buffer into an array of objects
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Normalize field name to find value in CSV record
 */
const findFieldValue = (record, fieldName) => {
  // Define all possible variations for each field
  const fieldMappings = {
    studentId: ['studentId', 'student_id', 'Student ID', 'StudentID', 'STUDENT_ID', 'student id', 'ID', 'id'],
    name: ['name', 'Name', 'NAME', 'student_name', 'Student Name', 'StudentName', 'STUDENT_NAME'],
    email: ['email', 'Email', 'EMAIL', 'student_email', 'Student Email', 'E-mail', 'e-mail'],
    department: ['department', 'Department', 'DEPARTMENT', 'dept', 'Dept', 'DEPT'],
    year: ['year', 'Year', 'YEAR', 'academic_year', 'Academic Year', 'Year Level', 'year level'],
    gpa: ['gpa', 'GPA', 'Gpa', 'grade', 'Grade', 'GRADE'],
    attendance: ['attendance', 'Attendance', 'ATTENDANCE', 'Attendance %', 'attendance %', 'Attendance Percentage'],
  };

  const variations = fieldMappings[fieldName] || [fieldName];
  
  for (const variation of variations) {
    if (record[variation] !== undefined && record[variation] !== null && record[variation] !== '') {
      return String(record[variation]).trim();
    }
  }
  
  return null;
};

/**
 * Validate and normalize CSV data
 */
const validateStudentData = (data) => {
  const errors = [];
  const validRecords = [];
  const requiredFields = ['studentId', 'name', 'email', 'department', 'year', 'gpa', 'attendance'];

  // Log CSV headers for debugging
  if (data.length > 0) {
    console.log('=========== CSV VALIDATION DEBUG ===========');
    console.log('Total rows in CSV:', data.length);
    console.log('CSV Headers detected:', Object.keys(data[0]));
    console.log('First row data:', JSON.stringify(data[0], null, 2));
    console.log('===========================================');
  }

  data.forEach((record, index) => {
    const rowNumber = index + 2; // +2 because row 1 is header
    const recordErrors = [];
    const fieldValues = {};

    // Extract all required fields using flexible matching
    requiredFields.forEach((field) => {
      const value = findFieldValue(record, field);
      if (!value) {
        recordErrors.push(`Missing required field: ${field}`);
        console.log(`Row ${rowNumber}: Missing field '${field}'. Available keys:`, Object.keys(record));
      } else {
        fieldValues[field] = value;
      }
    });

    if (recordErrors.length > 0) {
      errors.push({
        row: rowNumber,
        errors: recordErrors,
      });
      return;
    }

    // Normalize and parse field values
    const normalizedRecord = {
      studentId: fieldValues.studentId,
      name: fieldValues.name,
      email: fieldValues.email.toLowerCase(),
      department: fieldValues.department,
      year: parseInt(fieldValues.year),
      gpa: parseFloat(fieldValues.gpa),
      attendance: parseFloat(fieldValues.attendance),
      riskLevel: findFieldValue(record, 'riskLevel') || 'Low',
    };

    // Validate data types and ranges
    if (isNaN(normalizedRecord.year) || normalizedRecord.year < 1 || normalizedRecord.year > 10) {
      recordErrors.push(`Year must be a number between 1 and 10 (got: ${fieldValues.year})`);
    }

    if (isNaN(normalizedRecord.gpa) || normalizedRecord.gpa < 0 || normalizedRecord.gpa > 5) {
      recordErrors.push(`GPA must be a number between 0 and 5 (got: ${fieldValues.gpa})`);
    }

    if (
      isNaN(normalizedRecord.attendance) ||
      normalizedRecord.attendance < 0 ||
      normalizedRecord.attendance > 100
    ) {
      recordErrors.push('Attendance must be a number between 0 and 100');
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(normalizedRecord.email)) {
      recordErrors.push('Invalid email format');
    }

    // Validate risk level
    const validRiskLevels = ['Low', 'Medium', 'High', 'Critical'];
    if (!validRiskLevels.includes(normalizedRecord.riskLevel)) {
      // Auto-calculate if invalid
      const student = new Student(normalizedRecord);
      normalizedRecord.riskLevel = student.calculateRiskLevel();
    }

    if (recordErrors.length > 0) {
      errors.push({
        row: rowNumber,
        studentId: normalizedRecord.studentId || 'Unknown',
        errors: recordErrors,
      });
      console.log(`Row ${rowNumber} FAILED validation:`, recordErrors);
    } else {
      validRecords.push(normalizedRecord);
      console.log(`Row ${rowNumber} PASSED validation`);
    }
  });

  console.log(`\n=== VALIDATION SUMMARY ===`);
  console.log(`Valid records: ${validRecords.length}`);
  console.log(`Invalid records: ${errors.length}`);
  console.log(`=========================\n`);

  return { validRecords, errors };
};

/**
 * Debug endpoint to test CSV parsing without saving
 * POST /api/students/debug-csv
 */
exports.debugCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file',
      });
    }

    console.log('📁 File received:', req.file.originalname);
    console.log('📊 File size:', req.file.size, 'bytes');
    console.log('📝 File mimetype:', req.file.mimetype);

    // Parse CSV
    const csvData = await parseCSV(req.file.buffer);
    
    console.log('✅ CSV parsed successfully');
    console.log('📋 Total rows:', csvData.length);
    
    if (csvData.length > 0) {
      console.log('🔑 Headers:', Object.keys(csvData[0]));
      console.log('📄 First row:', csvData[0]);
    }

    // Validate data
    const { validRecords, errors: validationErrors } = validateStudentData(csvData);

    return res.json({
      success: true,
      message: 'CSV debug information',
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      parsing: {
        totalRows: csvData.length,
        headers: csvData.length > 0 ? Object.keys(csvData[0]) : [],
        firstRow: csvData[0] || null,
      },
      validation: {
        validRecords: validRecords.length,
        invalidRecords: validationErrors.length,
        errors: validationErrors,
        sampleValidRecord: validRecords[0] || null,
      },
    });
  } catch (error) {
    console.error('❌ CSV Debug Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing CSV file',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Upload and process CSV file
 * POST /api/students/upload
 */
exports.uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file',
      });
    }

    // Parse CSV
    const csvData = await parseCSV(req.file.buffer);

    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty',
      });
    }

    // Validate data
    const { validRecords, errors: validationErrors } =
      validateStudentData(csvData);

    if (validRecords.length === 0) {
      console.error('❌ No valid records found. Validation errors:', JSON.stringify(validationErrors, null, 2));
      return res.status(400).json({
        success: false,
        message: 'No valid records found in CSV file. Please check the format and data.',
        totalRows: csvData.length,
        errors: validationErrors,
        hint: 'Check server console for detailed debugging information',
      });
    }

    // Check for duplicates in the database
    const studentIds = validRecords.map((r) => r.studentId);
    const emails = validRecords.map((r) => r.email);

    const existingStudents = await Student.find({
      $or: [{ studentId: { $in: studentIds } }, { email: { $in: emails } }],
    }).select('studentId email');

    const existingStudentIds = new Set(
      existingStudents.map((s) => s.studentId)
    );
    const existingEmails = new Set(existingStudents.map((s) => s.email));

    const duplicateErrors = [];
    const recordsToInsert = [];

    validRecords.forEach((record) => {
      if (existingStudentIds.has(record.studentId)) {
        duplicateErrors.push({
          studentId: record.studentId,
          error: 'Student ID already exists',
        });
      } else if (existingEmails.has(record.email)) {
        duplicateErrors.push({
          studentId: record.studentId,
          email: record.email,
          error: 'Email already exists',
        });
      } else {
        recordsToInsert.push(record);
      }
    });

    // Insert valid, non-duplicate records
    let insertedCount = 0;
    if (recordsToInsert.length > 0) {
      const insertedStudents = await Student.insertMany(recordsToInsert, {
        ordered: false,
      });
      insertedCount = insertedStudents.length;
    }

    // Prepare response
    const response = {
      success: true,
      message: `Successfully processed CSV file`,
      summary: {
        totalRecords: csvData.length,
        validRecords: validRecords.length,
        inserted: insertedCount,
        duplicates: duplicateErrors.length,
        validationErrors: validationErrors.length,
      },
    };

    if (validationErrors.length > 0) {
      response.validationErrors = validationErrors;
    }

    if (duplicateErrors.length > 0) {
      response.duplicateErrors = duplicateErrors;
    }

    res.status(insertedCount > 0 ? 201 : 200).json(response);
  } catch (error) {
    console.error('CSV Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file',
      error: error.message,
    });
  }
};

/**
 * Get all students with pagination, search, and filter
 * GET /api/students
 */
exports.getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      riskLevel = '',
      department = '',
      year = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    // Search by name, student ID, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by risk level
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by year
    if (year) {
      query.year = parseInt(year);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const students = await Student.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        pageSize: parseInt(limit),
        hasNextPage: skip + students.length < total,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message,
    });
  }
};

/**
 * Get single student by ID
 * GET /api/students/:id
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-__v');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message,
    });
  }
};

/**
 * Get student by student ID
 * GET /api/students/studentId/:studentId
 */
exports.getStudentByStudentId = async (req, res) => {
  try {
    const student = await Student.findOne({
      studentId: req.params.studentId,
    }).select('-__v');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message,
    });
  }
};

/**
 * Update student
 * PUT /api/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, department, year, gpa, attendance, riskLevel } =
      req.body;

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Update fields
    if (name) student.name = name;
    if (email) student.email = email;
    if (department) student.department = department;
    if (year) student.year = year;
    if (gpa !== undefined) student.gpa = gpa;
    if (attendance !== undefined) student.attendance = attendance;
    if (riskLevel) student.riskLevel = riskLevel;

    // Recalculate risk level if GPA or attendance changed
    if (gpa !== undefined || attendance !== undefined) {
      student.calculateRiskLevel();
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message,
    });
  }
};

/**
 * Delete student
 * DELETE /api/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message,
    });
  }
};

/**
 * Get risk level statistics
 * GET /api/students/stats/risk
 */
exports.getRiskStats = async (req, res) => {
  try {
    const stats = await Student.getRiskStats();

    const totalStudents = await Student.countDocuments();

    const formattedStats = stats.map((stat) => ({
      riskLevel: stat._id,
      count: stat.count,
      percentage: ((stat.count / totalStudents) * 100).toFixed(2),
      avgGpa: stat.avgGpa.toFixed(2),
      avgAttendance: stat.avgAttendance.toFixed(2),
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        riskDistribution: formattedStats,
      },
    });
  } catch (error) {
    console.error('Get Risk Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk statistics',
      error: error.message,
    });
  }
};

/**
 * Get departments list
 * GET /api/students/filters/departments
 */
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Student.distinct('department');

    res.status(200).json({
      success: true,
      data: departments.sort(),
    });
  } catch (error) {
    console.error('Get Departments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message,
    });
  }
};

/**
 * Delete all students (for testing/admin)
 * DELETE /api/students/all
 */
exports.deleteAllStudents = async (req, res) => {
  try {
    const result = await Student.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} students`,
    });
  } catch (error) {
    console.error('Delete All Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting students',
      error: error.message,
    });
  }
};
