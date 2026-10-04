const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { processCsvStream } = require('../controllers/studentController');

const runImport = async () => {
  try {
    await connectDB();
    const csvPath = path.join(__dirname, '../../data.csv');
    console.log(`Starting bulk import from: ${csvPath}`);

    const startTime = Date.now();
    const summary = await processCsvStream(csvPath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n=======================================');
    console.log('   IMPORT COMPLETED SUCCESSFULLY');
    console.log('=======================================');
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`📊 Total rows parsed:  ${summary.totalRows}`);
    console.log(`✅ Upserted / Inserted: ${summary.imported}`);
    console.log(`🔄 Updated:            ${summary.updated}`);
    console.log(`⚠️ Skipped:            ${summary.skipped}`);
    if (summary.errors.length > 0) {
      console.log(`❌ First errors (total ${summary.errors.length}):`, summary.errors.slice(0, 5));
    }
    console.log('=======================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

runImport();
