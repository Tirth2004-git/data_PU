const Student = require('../models/Student');
const { z } = require('zod');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

function computeAttention(student) {
  const live = student.academics?.totalLiveBacklogs ?? 0;
  const cgpa = student.academics?.cgpa ?? null;
  const semesters = student.academics?.semesters || [];

  // Check drop in latest semester vs previous
  const validSgpas = semesters.filter((s) => s.sgpa !== null && s.sgpa !== undefined);
  let latestDrop = 0;
  if (validSgpas.length >= 2) {
    const prev = validSgpas[validSgpas.length - 2].sgpa;
    const curr = validSgpas[validSgpas.length - 1].sgpa;
    latestDrop = prev - curr;
  }

  const reasons = [];

  // High: live backlogs >= 3 or CGPA < 5.0
  if (live >= 3) {
    reasons.push(`${live} live backlogs`);
  }
  if (cgpa !== null && cgpa < 5.0) {
    reasons.push(`CGPA is ${cgpa.toFixed(2)} (< 5.0)`);
  }

  if (reasons.length > 0) {
    return {
      level: 'High',
      badgeClass: 'danger',
      reasons,
    };
  }

  // Medium: live backlogs 1-2, or CGPA < 6.0, or latest SGPA dropped >= 1.0 vs previous
  if (live >= 1 && live <= 2) {
    reasons.push(`${live} live backlog${live > 1 ? 's' : ''}`);
  }
  if (cgpa !== null && cgpa < 6.0) {
    reasons.push(`CGPA is ${cgpa.toFixed(2)} (< 6.0)`);
  }
  if (latestDrop >= 1.0) {
    reasons.push(`Latest SGPA dropped by ${latestDrop.toFixed(2)} vs previous semester`);
  }

  if (reasons.length > 0) {
    return {
      level: 'Medium',
      badgeClass: 'warning',
      reasons,
    };
  }

  return {
    level: 'Low',
    badgeClass: 'good',
    reasons: ['Good academic standing'],
  };
}

/**
 * @desc    Global Search Autocomplete Suggestions (lightweight & fast)
 * @route   GET /api/students/suggest?q=
 * @access  Private (Admin only)
 */
const getSuggestions = async (req, res) => {
  try {
    const rawQ = (req.query.q || '').trim();
    if (!rawQ) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const q = rawQ.toLowerCase();
    const isDigits = /^\d+$/.test(q);

    // Minimum length check: 1 char for digits, 2 for names
    if (isDigits && q.length < 1) {
      return res.status(200).json({ success: true, suggestions: [] });
    }
    if (!isDigits && q.length < 2) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const projection = {
      _id: 0,
      rollNo: 1,
      fullName: 1,
      branch: 1,
      division: 1,
      batch: 1,
      'academics.cgpa': 1,
      'academics.totalLiveBacklogs': 1,
    };

    const results = [];
    const seenRollNos = new Set();

    function addMatches(docs) {
      for (const doc of docs) {
        if (!seenRollNos.has(doc.rollNo)) {
          seenRollNos.add(doc.rollNo);
          results.push({
            rollNo: doc.rollNo,
            fullName: doc.fullName,
            branch: doc.branch,
            division: doc.division,
            batch: doc.batch,
            cgpa: doc.academics?.cgpa ?? null,
            totalLiveBacklogs: doc.academics?.totalLiveBacklogs ?? 0,
          });
          if (results.length >= 8) return true;
        }
      }
      return false;
    }

    if (isDigits) {
      // Tier 1: rollNo exact match
      const t1 = await Student.find({ rollNo: q }, projection).lean();
      if (addMatches(t1)) return res.status(200).json({ success: true, suggestions: results });

      // Tier 2: rollNo starts with q
      const t2 = await Student.find({ rollNo: new RegExp('^' + q) }, projection)
        .sort({ fullName: 1 })
        .limit(8)
        .lean();
      if (addMatches(t2)) return res.status(200).json({ success: true, suggestions: results });

      // Tier 3: officialPhone or whatsappNo starts with q
      const t3 = await Student.find(
        {
          $or: [
            { officialPhone: new RegExp('^' + q) },
            { whatsappNo: new RegExp('^' + q) },
          ],
        },
        projection
      )
        .sort({ fullName: 1 })
        .limit(8)
        .lean();
      if (addMatches(t3)) return res.status(200).json({ success: true, suggestions: results });

      // Tier 4: (only if q.length >= 4 and fewer than 8 results) rollNo contains q
      if (q.length >= 4 && results.length < 8) {
        const t4 = await Student.find({ rollNo: new RegExp(q) }, projection)
          .sort({ fullName: 1 })
          .limit(8 - results.length)
          .lean();
        addMatches(t4);
      }
    } else {
      const escaped = escapeRegex(q);

      // Tier 1: nameLower starts with q
      const t1 = await Student.find({ nameLower: new RegExp('^' + escaped) }, projection)
        .sort({ fullName: 1 })
        .limit(8)
        .lean();
      if (addMatches(t1)) return res.status(200).json({ success: true, suggestions: results });

      // Tier 2: any word in nameTokens starts with q
      // For multi-word q, each word must prefix-match a token
      const words = q.split(/\s+/).filter(Boolean);
      let t2Query;
      if (words.length === 1) {
        t2Query = { nameTokens: new RegExp('^' + escapeRegex(words[0])) };
      } else {
        t2Query = {
          $and: words.map((w) => ({ nameTokens: new RegExp('^' + escapeRegex(w)) })),
        };
      }
      const t2 = await Student.find(t2Query, projection)
        .sort({ fullName: 1 })
        .limit(8 - results.length)
        .lean();
      if (addMatches(t2)) return res.status(200).json({ success: true, suggestions: results });

      // Tier 3: (only if fewer than 8 results) nameLower contains q
      if (results.length < 8) {
        const t3 = await Student.find({ nameLower: new RegExp(escaped) }, projection)
          .sort({ fullName: 1 })
          .limit(8 - results.length)
          .lean();
        addMatches(t3);
      }
    }

    return res.status(200).json({
      success: true,
      suggestions: results.slice(0, 8),
    });
  } catch (error) {
    console.error('Suggest Error:', error);
    return res.status(500).json({
      error: { code: 'SUGGEST_ERROR', message: 'Autocomplete suggestion error.' },
    });
  }
};

/**
 * Build Mongoose query filter from request parameters
 */
function buildStudentQuery(query) {
  const filter = {};

  if (query.search && query.search.trim()) {
    const rawSearch = query.search.trim();
    const cleanSearch = rawSearch.toLowerCase();
    const escaped = escapeRegex(cleanSearch);

    if (/^\d+$/.test(cleanSearch)) {
      filter.$or = [
        { rollNo: new RegExp('^' + cleanSearch) },
        { rollNo: cleanSearch },
        { officialPhone: new RegExp('^' + cleanSearch) },
        { whatsappNo: new RegExp('^' + cleanSearch) },
      ];
    } else {
      const words = cleanSearch.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        filter.$or = [
          { nameLower: new RegExp('^' + escaped) },
          { $and: words.map((w) => ({ nameTokens: new RegExp('^' + escapeRegex(w)) })) },
          { nameLower: new RegExp(escaped) },
        ];
      } else {
        filter.$or = [
          { nameLower: new RegExp('^' + escaped) },
          { nameTokens: new RegExp('^' + escaped) },
          { nameLower: new RegExp(escaped) },
        ];
      }
    }
  }

  if (query.branch && query.branch !== 'all') {
    filter.branch = query.branch;
  }
  if (query.division && query.division !== 'all') {
    filter.division = query.division;
  }
  if (query.campus && query.campus !== 'all') {
    filter.campus = query.campus;
  }
  if (query.course && query.course !== 'all') {
    filter.course = query.course;
  }
  if (query.batch && query.batch !== 'all') {
    const b = Number(query.batch);
    if (!isNaN(b)) filter.batch = b;
  }

  if (query.hasLiveBacklog === 'true') {
    filter['academics.totalLiveBacklogs'] = { $gt: 0 };
  } else if (query.hasLiveBacklog === 'false') {
    filter['academics.totalLiveBacklogs'] = 0;
  }

  if (query.policySubmitted === 'true') {
    filter.placementPolicySubmitted = true;
  } else if (query.policySubmitted === 'false') {
    filter.placementPolicySubmitted = false;
  } else if (query.policySubmitted === 'null') {
    filter.placementPolicySubmitted = null;
  }

  const cgpaMin = parseFloat(query.cgpaMin);
  const cgpaMax = parseFloat(query.cgpaMax);
  if (!isNaN(cgpaMin) || !isNaN(cgpaMax)) {
    filter['academics.cgpa'] = {};
    if (!isNaN(cgpaMin)) filter['academics.cgpa'].$gte = cgpaMin;
    if (!isNaN(cgpaMax)) filter['academics.cgpa'].$lte = cgpaMax;
  }

  return filter;
}

/**
 * @desc    Get paginated and filtered list of students
 * @route   GET /api/students
 * @access  Private (Admin only)
 */
const getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = buildStudentQuery(req.query);

    let sortObj = { rollNo: 1 };
    const sortParam = req.query.sort || req.query.sortBy;
    const orderParam = req.query.order || req.query.sortOrder || 'asc';

    if (sortParam) {
      let field = sortParam;
      let dir = orderParam === 'desc' ? -1 : 1;

      if (sortParam.includes(':')) {
        const parts = sortParam.split(':');
        field = parts[0];
        dir = parts[1] === 'desc' ? -1 : 1;
      }

      const sortMap = {
        rollNo: 'rollNo',
        fullName: 'fullName',
        nameLower: 'nameLower',
        cgpa: 'academics.cgpa',
        totalLiveBacklogs: 'academics.totalLiveBacklogs',
        totalClosedBacklogs: 'academics.totalClosedBacklogs',
        batch: 'batch',
        division: 'division',
        branch: 'branch',
        campus: 'campus',
        tenthMarks: 'tenth.marks',
        twelfthMarks: 'twelfth.marks',
        latestSgpa: 'academics.latestSgpa',
      };

      const mongoField = sortMap[field] || 'rollNo';
      sortObj = { [mongoField]: dir };
    }

    const [total, items] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter)
        .select('-raw')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Attach age and attention to each item
    const enrichedItems = items.map((doc) => ({
      ...doc,
      age: computeAge(doc.dob),
      attention: computeAttention(doc),
    }));

    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      items: enrichedItems,
      total,
      page,
      pages,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      error: { code: 'FETCH_STUDENTS_ERROR', message: 'Failed to retrieve students list.' },
    });
  }
};

/**
 * @desc    Get single student details by Roll Number (including raw, age, attention)
 * @route   GET /api/students/:rollNo
 * @access  Private (Admin only)
 */
const getStudentByRollNo = async (req, res) => {
  try {
    const { rollNo } = req.params;
    if (!rollNo) {
      return res.status(400).json({
        error: { code: 'MISSING_ROLL_NO', message: 'Roll number parameter is required.' },
      });
    }

    const cleanRoll = rollNo.trim();
    const student = await Student.findOne({ rollNo: cleanRoll }).lean();

    if (!student) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `No student found matching Roll Number '${rollNo}'.` },
      });
    }

    const age = computeAge(student.dob);
    const attention = computeAttention(student);

    // Find previous and next student roll numbers for navigation
    const [prevStudent, nextStudent] = await Promise.all([
      Student.findOne({ rollNo: { $lt: student.rollNo } })
        .sort({ rollNo: -1 })
        .select('rollNo fullName')
        .lean(),
      Student.findOne({ rollNo: { $gt: student.rollNo } })
        .sort({ rollNo: 1 })
        .select('rollNo fullName')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      student: {
        ...student,
        age,
        attention,
      },
      navigation: {
        prevRollNo: prevStudent?.rollNo || null,
        prevName: prevStudent?.fullName || null,
        nextRollNo: nextStudent?.rollNo || null,
        nextName: nextStudent?.fullName || null,
      },
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    return res.status(500).json({
      error: { code: 'FETCH_STUDENT_ERROR', message: 'Failed to fetch student details.' },
    });
  }
};

/**
 * @desc    Get cohort insights (division, branch, batch rank, percentile, delta)
 * @route   GET /api/students/:rollNo/insights
 * @access  Private (Admin only)
 */
const getStudentInsights = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const student = await Student.findOne({ rollNo: rollNo.trim() }).lean();

    if (!student) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Student '${rollNo}' not found.` },
      });
    }

    const studentCgpa = student.academics?.cgpa ?? null;

    async function getGroupMetrics(filterField, filterValue) {
      if (!filterValue) {
        return { rank: null, total: 0, percentile: null, avgCgpa: null, delta: null };
      }

      const matchFilter = { [filterField]: filterValue, 'academics.cgpa': { $ne: null } };

      const [total, higherCount, avgRes] = await Promise.all([
        Student.countDocuments(matchFilter),
        studentCgpa !== null
          ? Student.countDocuments({ ...matchFilter, 'academics.cgpa': { $gt: studentCgpa } })
          : 0,
        Student.aggregate([
          { $match: matchFilter },
          { $group: { _id: null, avg: { $avg: '$academics.cgpa' } } },
        ]),
      ]);

      const avgCgpa = avgRes[0]?.avg ? Number(avgRes[0].avg.toFixed(2)) : null;

      if (studentCgpa === null || total === 0) {
        return { rank: null, total, percentile: null, avgCgpa, delta: null };
      }

      const rank = higherCount + 1;
      const percentile = total > 0 ? Number((((total - rank + 1) / total) * 100).toFixed(1)) : 100;
      const delta = avgCgpa !== null ? Number((studentCgpa - avgCgpa).toFixed(2)) : null;

      return {
        rank,
        total,
        percentile,
        avgCgpa,
        delta,
      };
    }

    const [divisionMetrics, branchMetrics, batchMetrics] = await Promise.all([
      getGroupMetrics('division', student.division),
      getGroupMetrics('branch', student.branch),
      getGroupMetrics('batch', student.batch),
    ]);

    return res.status(200).json({
      success: true,
      cohort: {
        division: { ...divisionMetrics, label: student.division || 'Division' },
        branch: { ...branchMetrics, label: student.branch || 'Branch' },
        batch: { ...batchMetrics, label: student.batch ? `Batch ${student.batch}` : 'Batch' },
      },
    });
  } catch (error) {
    console.error('Cohort Insights Error:', error);
    return res.status(500).json({
      error: { code: 'INSIGHTS_ERROR', message: 'Failed to compute cohort insights.' },
    });
  }
};


/**
 * @desc    Get distinct filter options for dropdowns
 * @route   GET /api/students/filters
 * @access  Private (Admin only)
 */
const getFilterOptions = async (req, res) => {
  try {
    const [branches, divisions, batches, campuses, courses] = await Promise.all([
      Student.distinct('branch'),
      Student.distinct('division'),
      Student.distinct('batch'),
      Student.distinct('campus'),
      Student.distinct('course'),
    ]);

    return res.status(200).json({
      success: true,
      branches: branches.filter(Boolean).sort(),
      divisions: divisions.filter(Boolean).sort(),
      batches: batches.filter(Boolean).sort((a, b) => a - b),
      campuses: campuses.filter(Boolean).sort(),
      courses: courses.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error('Filter options error:', error);
    return res.status(500).json({
      error: { code: 'FILTER_OPTIONS_ERROR', message: 'Failed to fetch filter options.' },
    });
  }
};

/**
 * @desc    Export filtered students to CSV
 * @route   GET /api/students/export
 * @access  Private (Admin only)
 */
const exportStudents = async (req, res) => {
  try {
    const filter = buildStudentQuery(req.query);

    const students = await Student.find(filter)
      .select('-raw')
      .sort({ rollNo: 1 })
      .lean();

    const headers = [
      'S No',
      'Roll No',
      'Full Name',
      'Official Email',
      'Personal Email',
      'Official Phone',
      'Whatsapp No',
      'Alternate Phone',
      'Batch',
      'Campus',
      'Course',
      'Branch',
      'Division',
      'DOB',
      'Age',
      'Nationality',
      '10th Marks',
      '10th Board',
      '10th Year',
      '12th Marks',
      '12th Board',
      '12th Year',
      'Diploma Degree',
      'Diploma Marks',
      'Diploma Institute',
      'Diploma Year',
      'CGPA',
      'Total Live Backlogs',
      'Total Closed Backlogs',
      'Semester Backlog Sum',
      'Average SGPA',
      'Latest SGPA',
      'Sem 1 SGPA',
      'Sem 1 Backlogs',
      'Sem 2 SGPA',
      'Sem 2 Backlogs',
      'Sem 3 SGPA',
      'Sem 3 Backlogs',
      'Sem 4 SGPA',
      'Sem 4 Backlogs',
      'Sem 5 SGPA',
      'Sem 5 Backlogs',
      'Current Passing Year',
      'Placement Policy Submitted',
      'Remarks',
      'Record Date',
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="campus_compass_students.csv"');

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const s = String(str).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    res.write(headers.map(escapeCsv).join(',') + '\r\n');

    for (const s of students) {
      const semMap = {};
      const semBacklogs = {};
      (s.academics?.semesters || []).forEach((sem) => {
        semMap[sem.sem] = sem.sgpa ?? '';
        semBacklogs[sem.sem] = sem.backlogCount ?? '';
      });

      const age = computeAge(s.dob);
      let policyText = 'Not recorded';
      if (s.placementPolicySubmitted === true) policyText = 'Yes';
      if (s.placementPolicySubmitted === false) policyText = 'No';

      const row = [
        s.sNo ?? '',
        s.rollNo,
        s.fullName,
        s.officialEmail || '',
        s.personalEmail || '',
        s.officialPhone || '',
        s.whatsappNo || '',
        s.alternatePhone || '',
        s.batch || '',
        s.campus || '',
        s.course || '',
        s.branch || '',
        s.division || '',
        s.dob ? new Date(s.dob).toISOString().split('T')[0] : '',
        age ?? '',
        s.nationality || '',
        s.tenth?.marks ?? '',
        s.tenth?.board || '',
        s.tenth?.passingYear ?? '',
        s.twelfth?.marks ?? '',
        s.twelfth?.board || '',
        s.twelfth?.passingYear ?? '',
        s.diploma?.degreeName || '',
        s.diploma?.marks ?? '',
        s.diploma?.instituteName || '',
        s.diploma?.passingYear ?? '',
        s.academics?.cgpa ?? '',
        s.academics?.totalLiveBacklogs ?? 0,
        s.academics?.totalClosedBacklogs ?? 0,
        s.academics?.semesterBacklogSum ?? 0,
        s.academics?.avgSgpa ?? '',
        s.academics?.latestSgpa ?? '',
        semMap[1] ?? '',
        semBacklogs[1] ?? '',
        semMap[2] ?? '',
        semBacklogs[2] ?? '',
        semMap[3] ?? '',
        semBacklogs[3] ?? '',
        semMap[4] ?? '',
        semBacklogs[4] ?? '',
        semMap[5] ?? '',
        semBacklogs[5] ?? '',
        s.academics?.currentPassingYear ?? '',
        policyText,
        s.remarks || '',
        s.recordDate ? new Date(s.recordDate).toISOString().split('T')[0] : '',
      ];

      res.write(row.map(escapeCsv).join(',') + '\r\n');
    }

    res.end();
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({
      error: { code: 'EXPORT_ERROR', message: 'Failed to export students data.' },
    });
  }
};

module.exports = {
  getSuggestions,
  getStudents,
  getStudentByRollNo,
  getStudentInsights,
  getFilterOptions,
  exportStudents,
};
