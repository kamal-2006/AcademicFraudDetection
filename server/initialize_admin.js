const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iafds';

/**
 * Initialize Admin User
 */
async function initializeAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('\n💡 Use this email to login as admin.');
      await mongoose.connection.close();
      return;
    }

    // Create default admin user
    const adminData = {
      name: 'System Administrator',
      email: 'admin@iafds.edu',
      password: 'admin123', // Change this in production!
      role: 'admin',
    };

    const admin = await User.create(adminData);

    console.log('✨ Admin user created successfully!\n');
    console.log('=' .repeat(50));
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Role:', admin.role);
    console.log('🆔 ID:', admin._id);
    console.log('=' .repeat(50));
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error initializing admin:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeAdmin();
