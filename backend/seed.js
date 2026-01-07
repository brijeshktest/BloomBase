const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloombase');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bloombase' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const admin = await User.create({
        email: 'admin@bloombase',
        password: 'Bloxham1!',
        name: 'BloomBase Admin',
        role: 'admin',
        phone: '+917838055426',
        isApproved: true,
        isActive: true
      });

      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@bloombase');
      console.log('   Password: Bloxham1!');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

