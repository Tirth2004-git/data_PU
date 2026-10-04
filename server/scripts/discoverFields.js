const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus';

async function discover() {
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('data');

  const totalDocs = await collection.countDocuments();
  console.log(`Total documents in 'data' collection: ${totalDocs}`);

  const fieldStats = {};

  function recordField(keyPath, val) {
    if (!fieldStats[keyPath]) {
      fieldStats[keyPath] = {
        count: 0,
        nonNullCount: 0,
        types: new Set(),
        samples: [],
      };
    }
    fieldStats[keyPath].count++;

    if (val !== null && val !== undefined && val !== '') {
      fieldStats[keyPath].nonNullCount++;
      const type = Array.isArray(val) ? 'Array' : (val && val._bsontype ? val._bsontype : typeof val);
      fieldStats[keyPath].types.add(type);

      if (fieldStats[keyPath].samples.length < 3) {
        const sampleStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (!fieldStats[keyPath].samples.includes(sampleStr)) {
          fieldStats[keyPath].samples.push(sampleStr);
        }
      }
    }
  }

  function traverse(obj, prefix = '') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const key of Object.keys(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      recordField(fullPath, val);
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val._bsontype)) {
        traverse(val, fullPath);
      }
    }
  }

  const cursor = collection.find({});
  let processed = 0;
  let sampleDoc = null;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!sampleDoc) sampleDoc = doc;
    traverse(doc);
    processed++;
  }

  console.log('\n======================================================');
  console.log('COMPLETE DISCOVERED FIELD LIST & STATS');
  console.log('======================================================\n');

  const sortedFields = Object.keys(fieldStats).sort();
  for (let i = 0; i < sortedFields.length; i++) {
    const field = sortedFields[i];
    const stat = fieldStats[field];
    console.log(
      `[${String(i + 1).padStart(2, '0')}] ${field.padEnd(32)} | Present: ${stat.nonNullCount}/${totalDocs} (${((stat.nonNullCount / totalDocs) * 100).toFixed(1)}%) | Types: ${Array.from(stat.types).join(', ')} | Samples: ${stat.samples.slice(0, 2).join(' | ')}`
    );
  }

  console.log('\n--- SAMPLE RAW DOCUMENT (First document) ---');
  console.log(JSON.stringify(sampleDoc, null, 2));

  await mongoose.disconnect();
}

discover().catch((err) => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
