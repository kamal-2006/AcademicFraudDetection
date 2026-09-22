const User = require('../models/User');

/**
 * Seed demo accounts for Student, Faculty, and Admin roles if they do not exist.
 */
const seedDemoAccounts = async () => {
  try {
    const demoUsers = [
      {
        email: 'student@demo.com',
        name: 'Demo Student',
        password: 'student123',
        role: 'student',
        studentId: 'STU-2026-001',
        department: 'Computer Science',
        consentGiven: true,
        gpa: 3.8,
      },
      {
        email: 'faculty@demo.com',
        name: 'Dr. Demo Faculty',
        password: 'faculty123',
        role: 'faculty',
        department: 'Computer Science',
      },
      {
        email: 'admin@demo.com',
        name: 'System Administrator',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
      },
    ];

    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({ email: demoUser.email });
      if (!existingUser) {
        await User.create(demoUser);
        console.log(`[Seed] Demo account created: ${demoUser.role.toUpperCase()} (${demoUser.email})`);
      }
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed demo accounts:', error.message);
  }
};

module.exports = seedDemoAccounts;
