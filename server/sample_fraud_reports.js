require('dotenv').config();
const mongoose = require('mongoose');
const FraudReport = require('./src/models/FraudReport');
const Student = require('./src/models/Student');

// Database connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iafds')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Sample fraud data generator
const generateFraudReports = async () => {
  try {
    // Get all students
    const students = await Student.find().limit(20);
    
    if (students.length === 0) {
      console.log('No students found. Please populate students first.');
      process.exit(1);
    }

    console.log(`Found ${students.length} students. Generating fraud reports...`);

    const fraudReports = [];

    // Helper function to get random item from array
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // Helper function to get random number in range
    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Helper function to get random date in past days
    const getRandomDate = (daysBack) => {
      const date = new Date();
      date.setDate(date.getDate() - getRandomNumber(1, daysBack));
      return date;
    };

    const fraudTypes = [
      'Plagiarism',
      'Attendance Manipulation',
      'Identity Fraud',
      'Exam Cheating',
      'Grade Tampering',
      'Multiple Fraud Types',
    ];

    const detectionMethods = ['Automated', 'Manual Review', 'AI Analysis', 'Hybrid'];
    
    const sources = [
      'Wikipedia',
      'ResearchGate',
      'IEEE Papers',
      'Stack Overflow',
      'GitHub Repository',
      'Medium Article',
      'Course Hero',
      'Chegg',
    ];

    // Generate 30-40 fraud reports
    const reportCount = getRandomNumber(30, 40);

    for (let i = 0; i < reportCount; i++) {
      const student = getRandomItem(students);
      const fraudType = getRandomItem(fraudTypes);
      const riskScore = getRandomNumber(20, 100);
      const detectionDate = getRandomDate(90); // Last 90 days

      const report = {
        studentId: student.studentId,
        student: student._id,
        fraudType,
        riskScore,
        detectionTimestamp: detectionDate,
        detectionMethod: getRandomItem(detectionMethods),
        systemRemarks: `Fraud detected through ${getRandomItem(detectionMethods).toLowerCase()} on ${detectionDate.toLocaleDateString()}`,
      };

      // Calculate risk level manually to avoid validation issues
      if (riskScore >= 80) {
        report.riskLevel = 'Critical';
      } else if (riskScore >= 60) {
        report.riskLevel = 'High';
      } else if (riskScore >= 30) {
        report.riskLevel = 'Medium';
      } else {
        report.riskLevel = 'Low';
      }

      // Add fraud-type specific data
      if (fraudType === 'Plagiarism' || fraudType === 'Multiple Fraud Types') {
        report.plagiarismScore = getRandomNumber(50, 99);
        const sourceCount = getRandomNumber(1, 4);
        report.matchedSources = [];
        
        for (let j = 0; j < sourceCount; j++) {
          report.matchedSources.push({
            source: getRandomItem(sources),
            similarity: getRandomNumber(40, 95),
            url: `https://example.com/source-${j + 1}`,
          });
        }
      }

      if (fraudType === 'Attendance Manipulation' || fraudType === 'Multiple Fraud Types') {
        report.attendanceIrregularities = {
          suspiciousPatterns: [
            {
              date: getRandomDate(30),
              pattern: 'Proxy Attendance',
              description: 'Multiple IP addresses detected for single attendance record',
            },
            {
              date: getRandomDate(45),
              pattern: 'Timing Anomaly',
              description: 'Attendance marked outside campus hours',
            },
          ],
          inconsistentRecords: getRandomNumber(2, 10),
          proxyAttendanceIndicators: getRandomNumber(1, 5),
        };
      }

      if (fraudType === 'Identity Fraud' || fraudType === 'Multiple Fraud Types') {
        report.identityAnomalies = {
          biometricMismatch: Math.random() > 0.5,
          ipAddressAnomalies: [
            {
              date: getRandomDate(20),
              ipAddress: `192.168.${getRandomNumber(1, 255)}.${getRandomNumber(1, 255)}`,
              location: getRandomItem(['New York', 'London', 'Tokyo', 'Unknown']),
              description: 'Login from unusual geographic location',
            },
          ],
          deviceAnomalies: [
            {
              date: getRandomDate(15),
              deviceId: `device-${Math.random().toString(36).substr(2, 9)}`,
              description: 'Unrecognized device detected',
            },
          ],
          multipleSimultaneousLogins: getRandomNumber(0, 3),
        };
      }

      // Add status based on how old the report is
      const daysOld = Math.ceil((new Date() - detectionDate) / (1000 * 60 * 60 * 24));
      
      if (daysOld > 60) {
        report.status = getRandomItem(['Confirmed', 'Dismissed', 'Resolved']);
        report.reviewedBy = getRandomItem(['Dr. Smith', 'Prof. Johnson', 'Dean Williams', 'Dr. Brown']);
        report.reviewedAt = new Date(detectionDate.getTime() + getRandomNumber(1, 10) * 24 * 60 * 60 * 1000);
        report.reviewNotes = 'Case reviewed and closed after thorough investigation';
        
        if (report.status === 'Confirmed') {
          report.actionTaken = getRandomItem(['Warning Issued', 'Grade Penalty', 'Suspension']);
          report.actionDate = report.reviewedAt;
          report.notificationSent = true;
          report.notificationDate = report.actionDate;
        }
      } else if (daysOld > 30) {
        report.status = getRandomItem(['Under Investigation', 'Confirmed']);
        report.reviewedBy = getRandomItem(['Dr. Smith', 'Prof. Johnson']);
        report.reviewedAt = new Date(detectionDate.getTime() + getRandomNumber(1, 5) * 24 * 60 * 60 * 1000);
      } else {
        report.status = getRandomItem(['Pending Review', 'Under Investigation']);
      }

      // Add evidence files for some reports
      if (Math.random() > 0.6) {
        report.evidenceFiles = [
          {
            fileName: `evidence_${i + 1}.pdf`,
            fileType: 'application/pdf',
            fileUrl: `/uploads/evidence/evidence_${i + 1}.pdf`,
            uploadedAt: detectionDate,
          },
        ];
      }

      fraudReports.push(report);
    }

    // Clear existing fraud reports
    await FraudReport.deleteMany({});
    console.log('Cleared existing fraud reports');

    // Insert new fraud reports
    const result = await FraudReport.insertMany(fraudReports);
    console.log(`✓ Successfully created ${result.length} fraud reports`);

    // Display statistics
    const stats = await FraudReport.getStatistics();
    console.log('\n=== Fraud Report Statistics ===');
    console.log(`Total Reports: ${stats.totalReports}`);
    console.log(`Average Risk Score: ${stats.averageRiskScore?.toFixed(2)}`);
    console.log(`Critical Cases: ${stats.criticalCases}`);
    console.log(`High Risk Cases: ${stats.highRiskCases}`);
    console.log(`Medium Risk Cases: ${stats.mediumRiskCases}`);
    console.log(`Low Risk Cases: ${stats.lowRiskCases}`);
    console.log(`Pending Review: ${stats.pendingReview}`);
    console.log(`Under Investigation: ${stats.underInvestigation}`);
    console.log(`Confirmed Cases: ${stats.confirmedCases}`);

    const fraudTypeDistribution = await FraudReport.getFraudTypeDistribution();
    console.log('\n=== Fraud Type Distribution ===');
    fraudTypeDistribution.forEach((type) => {
      console.log(`${type._id}: ${type.count} cases (Avg Risk: ${type.averageRiskScore.toFixed(2)})`);
    });

    console.log('\n✓ Sample fraud reports populated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating fraud reports:', error);
    process.exit(1);
  }
};

// Run the generator
generateFraudReports();
