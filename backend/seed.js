const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selllocalonline');
    console.log('Connected to MongoDB');

    // Admin email must be a valid email (login endpoint validates isEmail()).
    const desiredEmail = 'admin@selllocalonline.com';

    // Find any existing admin (legacy or current)
    const existingAdmin =
      (await User.findOne({ email: desiredEmail })) ||
      (await User.findOne({ email: 'admin@selllocalonline' })) ||
      (await User.findOne({ role: 'admin' }));
    
    if (existingAdmin) {
      // Migrate legacy email (admin@selllocalonline) to valid email
      if (existingAdmin.email !== desiredEmail) {
        existingAdmin.email = desiredEmail;
      }

      // Ensure credentials match expected defaults
      // Force password update by setting it directly and marking as modified
      // This ensures the pre-save hook will hash it
      const bcrypt = require('bcryptjs');
      const plainPassword = 'Bloxham1!';
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = existingAdmin.password && existingAdmin.password.startsWith('$2');
      if (!isHashed || !(await bcrypt.compare(plainPassword, existingAdmin.password))) {
        // Password is not hashed or doesn't match, so update it
        existingAdmin.password = plainPassword;
        existingAdmin.markModified('password');
      }
      existingAdmin.name = existingAdmin.name || 'SellLocal Online Admin';
      existingAdmin.role = 'admin';
      existingAdmin.phone = existingAdmin.phone || '+917838055426';
      existingAdmin.isApproved = true;
      existingAdmin.isActive = true;
      existingAdmin.isSuspended = false;

      await existingAdmin.save();

      console.log('✅ Admin user updated successfully');
      console.log(`   Email: ${desiredEmail}`);
      console.log('   Password: Bloxham1!');
    } else {
      // Create admin user
      const admin = await User.create({
        email: desiredEmail,
        password: 'Bloxham1!',
        name: 'SellLocal Online Admin',
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

