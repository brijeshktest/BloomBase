/**
 * Database Migration Script - Initial Setup
 * 
 * This script performs the initial database setup including:
 * - Admin user seeding
 * 
 * Run with: node backend/migrations/001-initial-setup.js
 * 
 * This file should be committed to git (not in .gitignore)
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MIGRATION_NAME = '001-initial-setup';
const MIGRATION_VERSION = '1.0.0';

/**
 * Seed admin user
 */
const seedAdmin = async () => {
  try {
    // Admin email must be a valid email (login endpoint validates isEmail()).
    const desiredEmail = 'admin@selllocalonline.com';
    const plainPassword = 'Bloxham1!';

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
        password: plainPassword,
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
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    console.log(`\n🚀 Starting migration: ${MIGRATION_NAME} (v${MIGRATION_VERSION})`);
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/selllocalonline';
    console.log(`📦 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Run migrations
    console.log('📝 Running migrations...\n');
    
    // 1. Seed admin user
    console.log('1️⃣  Seeding admin user...');
    await seedAdmin();
    console.log('   ✓ Admin seeding completed\n');

    console.log('=' .repeat(60));
    console.log(`✅ Migration ${MIGRATION_NAME} completed successfully!\n`);

    // Disconnect
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    
    // Try to disconnect even on error
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, seedAdmin };
