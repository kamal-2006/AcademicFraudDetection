require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');

// Simple MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iafds')
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const quickPopulateStudents = async () => {
  try {
    // Clear existing students
    await Student.deleteMany({});
    console.log('Cleared existing students');

    // Create 10 quick students
    const students = [];
    const departments = ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry'];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];

    for (let i = 1; i <= 10; i++) {
      students.push({
        studentId: `STU${String(i).padStart(3, '0')}`,
        name: `${firstNames[i - 1]} ${lastNames[i - 1]}`,
        email: `${firstNames[i - 1].toLowerCase()}.${lastNames[i - 1].toLowerCase()}@university.edu`,
        department: departments[i % departments.length],
        year: (i % 4) + 1,
        gpa: 2.0 + (Math.random() * 2),
        attendance: 50 + Math.floor(Math.random() * 50),
        enrollmentDate: new Date(2022, 0, 1),
      });
    }

    const result = await Student.insertMany(students);
    console.log(`✓ Created ${result.length} students successfully`);
    
    // Show the students
    result.forEach(s => {
      console.log(`  - ${s.studentId}: ${s.name} (${s.department})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

quickPopulateStudents();
