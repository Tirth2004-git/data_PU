const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus');
  const db = mongoose.connection.db;
  const rawCol = db.collection('data');
  const rawDocs = await rawCol.find({}).toArray();

  const rollsMap = {};
  for (const doc of rawDocs) {
    const rawRoll = doc['Roll No'];
    const rollNo = rawRoll !== null && rawRoll !== undefined ? String(rawRoll).trim() : '';
    if (!rollsMap[rollNo]) rollsMap[rollNo] = [];
    rollsMap[rollNo].push(doc);
  }

  const dupEntries = Object.entries(rollsMap).filter(([k, v]) => v.length > 1);
  console.log(`Found ${dupEntries.length} duplicate roll numbers in raw data:`);
  dupEntries.forEach(([roll, docs], idx) => {
    console.log(`\nDuplicate #${idx + 1} - Roll No: "${roll}" (Count: ${docs.length}):`);
    docs.forEach((d, i) => {
      console.log(`  Row ${i + 1}: _id: ${d._id}, S no: ${d['S no']}, Name: "${d['Full Name']}", Branch: "${d['Branch']}", CGPA: ${d['B.Tech Current CGPA'] || d.B?.['Tech Current CGPA']}`);
    });
  });

  await mongoose.disconnect();
}

check().catch(console.error);
