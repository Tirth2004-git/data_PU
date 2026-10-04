const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const readline = require('readline');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { connectDB } = require('../config/db');

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      result.email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      result.password = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      result.name = args[i + 1];
      i++;
    }
  }
  return result;
};

const createAdmin = async () => {
  try {
    await connectDB();

    console.log('\n=======================================');
    console.log('   CAMPUS COMPASS — ADMIN INITIALIZATION');
    console.log('=======================================\n');

    const cliArgs = parseArgs();

    let email = cliArgs.email;
    let password = cliArgs.password;
    let name = cliArgs.name;

    if (!email) {
      email = await askQuestion('Enter Admin Email (e.g. admin@campuscompass.edu): ');
    }
    if (!email) {
      console.error('❌ Error: Email cannot be empty.');
      process.exit(1);
    }

    email = email.toLowerCase().trim();

    if (!password) {
      password = await askQuestion('Enter Admin Password (min 6 characters): ');
    }
    if (!password || password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long.');
      process.exit(1);
    }

    if (!name) {
      name = await askQuestion('Enter Admin Full Name [Campus Admin]: ');
    }
    if (!name) {
      name = 'Campus Admin';
    }

    // Check if admin already exists or if an old admin account needs updating in place
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const existingTargetAdmin = await Admin.findOne({ email });

    if (existingTargetAdmin) {
      console.log(`ℹ️ Admin account for '${email}' already exists. Updating credentials...`);
      existingTargetAdmin.passwordHash = passwordHash;
      existingTargetAdmin.name = name;
      await existingTargetAdmin.save();
      console.log(`✅ Admin account updated for: ${email}`);
    } else {
      const anyOldAdmin = await Admin.findOne({});
      if (anyOldAdmin) {
        console.log(`ℹ️ Updating existing admin '${anyOldAdmin.email}' in place to '${email}'...`);
        anyOldAdmin.email = email;
        anyOldAdmin.name = name;
        anyOldAdmin.passwordHash = passwordHash;
        await anyOldAdmin.save();
        console.log(`✅ Previous admin successfully updated in place to: ${email}`);
      } else {
        const newAdmin = new Admin({
          email,
          passwordHash,
          name,
        });
        await newAdmin.save();
        console.log(`✅ New Admin account successfully created for: ${email}`);
      }
    }

    // Ensure no stale leftover admin accounts remain
    const deletedCount = await Admin.deleteMany({ email: { $ne: email } });
    if (deletedCount.deletedCount > 0) {
      console.log(`🧹 Removed ${deletedCount.deletedCount} old admin account(s).`);
    }

    console.log('\nCredentials ready for login:');
    console.log(`   Email: ${email}`);
    console.log('   Role:  Institutional Super Admin\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    process.exit(1);
  }
};

createAdmin();
