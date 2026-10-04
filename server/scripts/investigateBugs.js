const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/student_campus');
  console.log('Connected to DB');

  const rawCol = mongoose.connection.collection('data');
  const studentCol = mongoose.connection.collection('students');

  // Check student 2303031080006 in both
  const rawStudent = await rawCol.findOne({ 'Roll No': 2303031080006 });
  const rawStudentStr = await rawCol.findOne({ 'Roll No': '2303031080006' });
  const normStudent = await studentCol.findOne({ rollNo: '2303031080006' });

  console.log('=== Student 2303031080006 in raw ===');
  console.log('Raw:', rawStudent || rawStudentStr);
  console.log('=== Student 2303031080006 in students ===');
  console.log('Norm:', {
    rollNo: normStudent?.rollNo,
    fullName: normStudent?.fullName,
    dob: normStudent?.dob,
    recordDate: normStudent?.recordDate,
    placementPolicySubmitted: normStudent?.placementPolicySubmitted,
    rawPlacement: normStudent?.raw?.['Placement Policy Submitted or Not'],
    rawDate: normStudent?.raw?.['Date']
  });

  // Check invalid recordDates across all students
  const allStudents = await studentCol.find({}, { projection: { rollNo: 1, recordDate: 1, 'raw.Date': 1, dob: 1, 'raw.DOB': 1 } }).toArray();
  const invalidRecordDates = [];
  const invalidDobs = [];

  for (const s of allStudents) {
    if (s.recordDate) {
      const year = new Date(s.recordDate).getUTCFullYear();
      if (year < 2000 || year > 2027) {
        invalidRecordDates.push({ rollNo: s.rollNo, recordDate: s.recordDate, rawDate: s.raw?.['Date'], year });
      }
    }
    if (s.dob) {
      const year = new Date(s.dob).getUTCFullYear();
      if (year < 1980 || year > 2015) {
        invalidDobs.push({ rollNo: s.rollNo, dob: s.dob, rawDob: s.raw?.['DOB'], year });
      }
    }
  }

  console.log('\n=== Invalid Record Dates (count: ' + invalidRecordDates.length + ') ===');
  console.log(invalidRecordDates.slice(0, 10));

  console.log('\n=== Invalid DOBs (count: ' + invalidDobs.length + ') ===');
  console.log(invalidDobs.slice(0, 10));

  // Check placement policy values across all students
  const policySummary = await studentCol.aggregate([
    { $group: { _id: '$placementPolicySubmitted', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\n=== Placement Policy Distribution ===', policySummary);

  // Check raw placement policy distinct values
  const rawPolicySummary = await rawCol.aggregate([
    { $group: { _id: '$Placement Policy Submitted or Not', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\n=== Raw Placement Policy Distribution ===', rawPolicySummary);

  await mongoose.disconnect();
}

run().catch(console.error);
