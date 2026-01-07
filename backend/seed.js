const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloombase');
    console.log('Connected to MongoDB');

    // Admin email must be a valid email (login endpoint validates isEmail()).
    const desiredEmail = 'admin@bloombase.com';

    // Find any existing admin (legacy or current)
    const existingAdmin =
      (await User.findOne({ email: desiredEmail })) ||
      (await User.findOne({ email: 'admin@bloombase' })) ||
      (await User.findOne({ role: 'admin' }));
    
    if (existingAdmin) {
      // Migrate legacy email (admin@bloombase) to valid email
      if (existingAdmin.email !== desiredEmail) {
        existingAdmin.email = desiredEmail;
      }

      // Ensure credentials match expected defaults
      existingAdmin.password = 'Bloxham1!';
      existingAdmin.name = existingAdmin.name || 'BloomBase Admin';
      existingAdmin.role = 'admin';
      existingAdmin.phone = existingAdmin.phone || '+917838055426';
      existingAdmin.isApproved = true;
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log('✅ Admin user updated successfully');
      console.log(`   Email: ${desiredEmail}`);
      console.log('   Password: Bloxham1!');
    } else {
      // Create admin user
      const admin = await User.create({
        email: desiredEmail,
        password: 'Bloxham1!',
        name: 'BloomBase Admin',
        role: 'admin',
        phone: '+917838055426',
        isApproved: true,
        isActive: true
      });

      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${desiredEmail}`);
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

