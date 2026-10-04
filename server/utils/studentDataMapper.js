/**
 * Normalizes and safely parses student CSV rows into MongoDB Student documents.
 */

const parseNumber = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'na' || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a') {
    return null;
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

const parseYear = (val) => {
  const num = parseNumber(val);
  return num !== null ? Math.floor(num) : null;
};

const parseDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'na' || str.toLowerCase() === 'null') return null;
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const parseBooleanFlag = (val) => {
  if (val === undefined || val === null) return false;
  const str = String(val).trim().toLowerCase();
  if (str === 'yes' || str === 'y' || str === 'true' || str === 'done') return true;
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) return true;
  return false;
};

const cleanString = (val) => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str.toLowerCase() === 'na' || str.toLowerCase() === 'null') return '';
  return str;
};

const formatBatch = (val) => {
  const cleaned = cleanString(val);
  if (!cleaned) return '';
  // Convert 2027.0 to 2027
  return cleaned.replace(/\.0$/, '');
};

/**
 * Maps a single CSV row object to a Student document structure.
 * Returns null if the row is invalid (e.g. missing Roll No).
 */
const mapCsvRowToStudent = (row, rowIndex) => {
  const rawRollNo = row['Roll No'] || row['rollNo'] || row['roll_no'] || row['RollNo'];
  const rollNo = cleanString(rawRollNo);

  if (!rollNo) {
    return {
      error: `Row ${rowIndex}: Missing required 'Roll No'`,
    };
  }

  const rawFullName = row['Full Name'] || row['fullName'] || row['Name'] || row['name'];
  const fullName = cleanString(rawFullName) || 'Unknown Student';

  // Semesters 1 to 5 mapping
  const semesters = [
    {
      sem: 1,
      sgpa: parseNumber(row['1st SEM (SGPA)']),
      hasBacklog: parseBooleanFlag(row['1st SEM backlog(if yes)']),
    },
    {
      sem: 2,
      sgpa: parseNumber(row['2nd SEM (SGPA)']),
      hasBacklog: parseBooleanFlag(row['2nd SEM backlog(if yes)']),
    },
    {
      sem: 3,
      sgpa: parseNumber(row['3rd SEM (SGPA)']),
      hasBacklog: parseBooleanFlag(row['3rd SEM backlog(if yes)']),
    },
    {
      sem: 4,
      sgpa: parseNumber(row['4th SEM (SGPA)']),
      hasBacklog: parseBooleanFlag(row['4th SEM backlog(if yes)']),
    },
    {
      sem: 5,
      sgpa: parseNumber(row['5th SEM (SGPA)']),
      hasBacklog: parseBooleanFlag(row['5th SEM backlog(if yes)']),
    },
  ];

  const totalLiveBacklogs = parseNumber(row['Total Live Backlog']) || 0;
  const totalClosedBacklogs = parseNumber(row['Total Close Backlog Total']) || 0;

  const studentData = {
    rollNo,
    fullName,
    officialEmail: cleanString(row['Official Email'] || row['officialEmail']).toLowerCase(),
    batch: formatBatch(row['Batch'] || row['batch']),
    campus: cleanString(row['Campus'] || row['campus']),
    course: cleanString(row['Course'] || row['course']),
    branch: cleanString(row['Branch'] || row['branch']),
    division: cleanString(row['Division'] || row['division']),
    dob: parseDate(row['DOB'] || row['dob']),
    officialPhone: cleanString(row['Official Phone'] || row['officialPhone']),
    whatsappNo: cleanString(row['Whatsapp No'] || row['whatsappNo']),
    alternatePhone: cleanString(row['Alternate Phone'] || row['alternatePhone']),
    personalEmail: cleanString(row['Personal Email'] || row['personalEmail']).toLowerCase(),
    nationality: cleanString(row['Nationality'] || row['nationality']) || 'Indian',

    tenth: {
      marks: parseNumber(row['10th - Aggregate Marks']),
      board: cleanString(row['10th - Board']),
      passingYear: parseYear(row['10th - Passing Yr']),
    },
    twelfth: {
      marks: parseNumber(row['12th - Aggregate Marks']),
      board: cleanString(row['12th - Board']),
      passingYear: parseYear(row['12th - Passing Yr']),
    },
    diploma: {
      degreeName: cleanString(row['Diploma Degree Name']),
      marks: parseNumber(row['Diploma - Aggregate Marks']),
      instituteName: cleanString(row['Diploma Institute Name']),
      passingYear: parseYear(row['Diploma - Passing Yr']),
    },

    academics: {
      currentCgpa: parseNumber(row['B.Tech Current CGPA']),
      liveBacklogsList: cleanString(row['Live Backlogs']),
      closedBacklogsList: cleanString(row['Closed Backlogs']),
      totalLiveBacklogs,
      totalClosedBacklogs,
      semesters,
      currentPassingYear: parseYear(row['Current Course Passing Yr']),
    },

    placementPolicySubmitted: parseBooleanFlag(row['Placement Policy Submitted']),
    remarks: cleanString(row['Remarks']),
    recordDate: parseDate(row['Date']),
  };

  return { studentData };
};

module.exports = {
  mapCsvRowToStudent,
  parseNumber,
  parseYear,
  parseDate,
  parseBooleanFlag,
};
