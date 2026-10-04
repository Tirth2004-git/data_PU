const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const envPath = path.join(__dirname, '../.env');

const promptPin = () => {
  return new Promise((resolve) => {
    // If passed via command line argument (e.g. for non-interactive test run)
    const argPin = process.argv.slice(2).find((arg) => /^\d{8}$/.test(arg));
    if (argPin) {
      return resolve(argPin);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter 8-digit Site PIN: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const updateEnvFile = (keyValues) => {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  for (const [key, value] of Object.entries(keyValues)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent = envContent.trimEnd() + `\n${key}=${value}\n`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
};

const run = async () => {
  try {
    console.log('==============================================');
    console.log('  CAMPUS COMPASS — SECURE SITE PIN SETUP');
    console.log('==============================================');

    const pin = await promptPin();

    if (!pin || !/^\d{8}$/.test(pin)) {
      console.error('❌ Error: PIN must be exactly 8 numeric digits.');
      process.exit(1);
    }

    console.log('🔐 Hashing 8-digit PIN with bcrypt (cost: 12)...');
    const saltRounds = 12;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Read current .env to check if SITE_ACCESS_TOKEN_SECRET exists
    let existingEnv = '';
    if (fs.existsSync(envPath)) {
      existingEnv = fs.readFileSync(envPath, 'utf8');
    }

    const updates = {
      SITE_PIN_HASH: pinHash,
    };

    if (!/^SITE_ACCESS_TOKEN_SECRET=.+$/m.test(existingEnv)) {
      const generatedSecret = crypto.randomBytes(32).toString('hex');
      updates.SITE_ACCESS_TOKEN_SECRET = generatedSecret;
    }

    if (!/^ALERT_EMAIL_TO=/m.test(existingEnv)) {
      updates.ALERT_EMAIL_TO = 'ozatirth52@gmail.com';
    }

    if (!/^ALERT_EMAIL_FROM=/m.test(existingEnv)) {
      updates.ALERT_EMAIL_FROM = '';
    }

    if (!/^GMAIL_APP_PASSWORD=/m.test(existingEnv)) {
      updates.GMAIL_APP_PASSWORD = '';
    }

    updateEnvFile(updates);

    console.log('✅ SITE_PIN_HASH generated and saved into .env.');
    console.log('🛡️ Site Access Token Secret initialized.');
    console.log('🔒 Plain PIN discarded from memory. No plain credentials logged or persisted.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set site PIN:', error.message);
    process.exit(1);
  }
};

run();
