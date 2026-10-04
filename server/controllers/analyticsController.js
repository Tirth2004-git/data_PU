const Student = require('../models/Student');
const mongoose = require('mongoose');

/**
 * @desc    Get comprehensive analytics overview using MongoDB aggregations with optional scoping
 * @route   GET /api/analytics/overview
 * @access  Private (Admin only)
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    const matchFilter = {};

    if (req.query.branch && req.query.branch !== 'all') {
      matchFilter.branch = req.query.branch;
    }
    if (req.query.campus && req.query.campus !== 'all') {
      matchFilter.campus = req.query.campus;
    }
    if (req.query.course && req.query.course !== 'all') {
      matchFilter.course = req.query.course;
    }
    if (req.query.batch && req.query.batch !== 'all') {
      const b = Number(req.query.batch);
      if (!isNaN(b)) matchFilter.batch = b;
    }

    const totalStudents = await Student.countDocuments(matchFilter);

    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        kpis: {
          totalStudents: 0,
          averageCgpa: 0,
          studentsWithLiveBacklogs: 0,
          liveBacklogsPercentage: 0,
          policySubmitted: 0,
          policySubmittedPercentage: 0,
        },
        cgpaHistogram: [],
        branchStats: [],
        backlogDistribution: [],
        divisionStats: [],
        policyDistribution: [],
        needsAttention: [],
        dataAsOf: null,
      });
    }

    const [
      kpiAgg,
      cgpaHistogramAgg,
      branchAgg,
      backlogAgg,
      divisionAgg,
      policyAgg,
      needsAttentionDocs,
      latestDoc,
    ] = await Promise.all([
      // KPIs: average CGPA, live backlogs count, policy submitted count
      Student.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            avgCgpa: { $avg: '$academics.cgpa' },
            studentsWithLiveBacklogs: {
              $sum: { $cond: [{ $gt: ['$academics.totalLiveBacklogs', 0] }, 1, 0] },
            },
            policySubmitted: {
              $sum: { $cond: [{ $eq: ['$placementPolicySubmitted', true] }, 1, 0] },
            },
          },
        },
      ]),

      // CGPA distribution histogram: buckets 0–5, 5–6, 6–7, 7–8, 8–9, 9–10
      Student.aggregate([
        {
          $match: {
            ...matchFilter,
            'academics.cgpa': { $ne: null, $gte: 0 },
          },
        },
        {
          $bucket: {
            groupBy: '$academics.cgpa',
            boundaries: [0, 5, 6, 7, 8, 9, 10.01],
            default: 'Other',
            output: {
              count: { $sum: 1 },
            },
          },
        },
      ]),

      // Average CGPA and count by branch
      Student.aggregate([
        {
          $match: {
            ...matchFilter,
            branch: { $nin: [null, ''] },
          },
        },
        {
          $group: {
            _id: '$branch',
            studentCount: { $sum: 1 },
            avgCgpa: { $avg: '$academics.cgpa' },
            liveBacklogStudents: {
              $sum: { $cond: [{ $gt: ['$academics.totalLiveBacklogs', 0] }, 1, 0] },
            },
          },
        },
        { $sort: { studentCount: -1 } },
      ]),

      // Live-backlog count distribution (0, 1, 2, 3, 4+)
      Student.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: [{ $ifNull: ['$academics.totalLiveBacklogs', 0] }, 0] }, then: '0' },
                  { case: { $eq: ['$academics.totalLiveBacklogs', 1] }, then: '1' },
                  { case: { $eq: ['$academics.totalLiveBacklogs', 2] }, then: '2' },
                  { case: { $eq: ['$academics.totalLiveBacklogs', 3] }, then: '3' },
                ],
                default: '4+',
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Students per division (top divisions)
      Student.aggregate([
        {
          $match: {
            ...matchFilter,
            division: { $nin: [null, ''] },
          },
        },
        {
          $group: {
            _id: '$division',
            count: { $sum: 1 },
            avgCgpa: { $avg: '$academics.cgpa' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Policy submitted vs pending vs not recorded
      Student.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$placementPolicySubmitted', true] }, then: 'Submitted' },
                  { case: { $eq: ['$placementPolicySubmitted', false] }, then: 'Pending' },
                ],
                default: 'Not Recorded',
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Needs attention: top 10 students with the most live backlogs or lowest CGPA
      Student.find({
        ...matchFilter,
        'academics.totalLiveBacklogs': { $gt: 0 },
      })
        .select('rollNo fullName branch division academics.totalLiveBacklogs academics.totalClosedBacklogs academics.cgpa academics.semesters')
        .sort({ 'academics.totalLiveBacklogs': -1, 'academics.cgpa': 1 })
        .limit(10)
        .lean(),

      // Latest valid recordDate
      Student.findOne({
        recordDate: {
          $ne: null,
          $gte: new Date('2000-01-01T00:00:00.000Z'),
          $lte: new Date(Date.UTC(new Date().getFullYear() + 1, 11, 31, 23, 59, 59, 999)),
        },
      })
        .sort({ recordDate: -1 })
        .select('recordDate')
        .lean(),
    ]);

    const kpi = kpiAgg[0] || {
      avgCgpa: 0,
      studentsWithLiveBacklogs: 0,
      policySubmitted: 0,
    };

    const avgCgpa = kpi.avgCgpa ? Number(kpi.avgCgpa.toFixed(2)) : 0;
    const studentsWithLiveBacklogs = kpi.studentsWithLiveBacklogs || 0;
    const liveBacklogsPercentage = totalStudents
      ? Number(((studentsWithLiveBacklogs / totalStudents) * 100).toFixed(1))
      : 0;
    const policySubmitted = kpi.policySubmitted || 0;
    const policySubmittedPercentage = totalStudents
      ? Number(((policySubmitted / totalStudents) * 100).toFixed(1))
      : 0;

    const bucketLabels = {
      0: '0–5',
      5: '5–6',
      6: '6–7',
      7: '7–8',
      8: '8–9',
      9: '9–10',
    };
    const cgpaHistogram = [0, 5, 6, 7, 8, 9].map((lower) => {
      const match = cgpaHistogramAgg.find((b) => b._id === lower);
      return {
        bucket: bucketLabels[lower],
        count: match ? match.count : 0,
        cgpaMin: lower,
        cgpaMax: lower === 9 ? 10 : lower + 1,
      };
    });

    const backlogOrder = ['0', '1', '2', '3', '4+'];
    const backlogDistribution = backlogOrder.map((key) => {
      const match = backlogAgg.find((b) => b._id === key);
      return {
        backlogs: key,
        count: match ? match.count : 0,
      };
    });

    const branchStats = branchAgg.map((b) => ({
      branch: b._id,
      studentCount: b.studentCount,
      avgCgpa: b.avgCgpa ? Number(b.avgCgpa.toFixed(2)) : 0,
      liveBacklogStudents: b.liveBacklogStudents,
    }));

    const divisionStats = divisionAgg.map((d) => ({
      division: d._id,
      count: d.count,
      avgCgpa: d.avgCgpa ? Number(d.avgCgpa.toFixed(2)) : 0,
    }));

    const policyDistribution = [
      {
        name: 'Submitted',
        count: policyAgg.find((p) => p._id === 'Submitted')?.count || 0,
        color: '#16A34A',
      },
      {
        name: 'Pending',
        count: policyAgg.find((p) => p._id === 'Pending')?.count || 0,
        color: '#D97706',
      },
      {
        name: 'Not Recorded',
        count: policyAgg.find((p) => p._id === 'Not Recorded')?.count || 0,
        color: '#6B7280',
      },
    ];

    const needsAttention = needsAttentionDocs.map((s) => {
      const live = s.academics?.totalLiveBacklogs || 0;
      const cgpa = s.academics?.cgpa ?? null;
      let level = 'Low';
      let reason = 'Good standing';
      if (live >= 3 || (cgpa !== null && cgpa < 5.0)) {
        level = 'High';
        reason = live >= 3 ? `${live} live backlogs` : `CGPA ${cgpa.toFixed(2)}`;
      } else if (live >= 1 || (cgpa !== null && cgpa < 6.0)) {
        level = 'Medium';
        reason = live >= 1 ? `${live} live backlog` : `CGPA ${cgpa.toFixed(2)}`;
      }

      return {
        rollNo: s.rollNo,
        fullName: s.fullName,
        branch: s.branch,
        division: s.division,
        liveBacklogs: live,
        closedBacklogs: s.academics?.totalClosedBacklogs || 0,
        cgpa,
        attentionLevel: level,
        attentionReason: reason,
      };
    });

    return res.status(200).json({
      success: true,
      kpis: {
        totalStudents,
        averageCgpa: avgCgpa,
        studentsWithLiveBacklogs,
        liveBacklogsPercentage,
        policySubmitted,
        policySubmittedPercentage,
      },
      cgpaHistogram,
      branchStats,
      backlogDistribution,
      divisionStats,
      policyDistribution,
      needsAttention,
      dataAsOf: latestDoc?.recordDate || null,
    });
  } catch (error) {
    console.error('Analytics Overview Error:', error);
    return res.status(500).json({
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to compute analytics overview.' },
    });
  }
};

/**
 * @desc    Get data quality metrics and sample lists
 * @route   GET /api/analytics/data-quality
 * @access  Private (Admin only)
 */
const getDataQualityMetrics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();

    // 1. Missing CGPA
    const [missingCgpaCount, missingCgpaSamples] = await Promise.all([
      Student.countDocuments({ 'academics.cgpa': null }),
      Student.find({ 'academics.cgpa': null })
        .select('rollNo fullName branch division batch')
        .limit(10)
        .lean(),
    ]);

    // 2. Missing Contact
    const [missingPhoneCount, missingPhoneSamples] = await Promise.all([
      Student.countDocuments({
        $or: [{ officialPhone: null }, { officialPhone: '' }],
      }),
      Student.find({
        $or: [{ officialPhone: null }, { officialPhone: '' }],
      })
        .select('rollNo fullName branch division')
        .limit(10)
        .lean(),
    ]);

    const [missingEmailCount, missingEmailSamples] = await Promise.all([
      Student.countDocuments({
        $or: [{ officialEmail: null }, { officialEmail: '' }],
      }),
      Student.find({
        $or: [{ officialEmail: null }, { officialEmail: '' }],
      })
        .select('rollNo fullName branch division')
        .limit(10)
        .lean(),
    ]);

    // 3. Missing any semester SGPA
    const [missingAnySgpaCount, missingAnySgpaSamples] = await Promise.all([
      Student.countDocuments({ 'academics.semesters.sgpa': null }),
      Student.find({ 'academics.semesters.sgpa': null })
        .select('rollNo fullName branch division academics.cgpa academics.semesters')
        .limit(10)
        .lean(),
    ]);

    // 4. Policy not recorded
    const [missingPolicyCount, missingPolicySamples] = await Promise.all([
      Student.countDocuments({ placementPolicySubmitted: null }),
      Student.find({ placementPolicySubmitted: null })
        .select('rollNo fullName branch division batch')
        .limit(10)
        .lean(),
    ]);

    // 5. Marks check (<= 10 or > 100)
    const [marksCheckTenthCount, marksCheckTenthSamples] = await Promise.all([
      Student.countDocuments({
        $or: [
          { 'tenth.marks': { $gt: 0, $lte: 10 } },
          { 'tenth.marks': { $gt: 100 } },
        ],
      }),
      Student.find({
        $or: [
          { 'tenth.marks': { $gt: 0, $lte: 10 } },
          { 'tenth.marks': { $gt: 100 } },
        ],
      })
        .select('rollNo fullName tenth.marks tenth.board branch')
        .limit(10)
        .lean(),
    ]);

    const [marksCheckTwelfthCount, marksCheckTwelfthSamples] = await Promise.all([
      Student.countDocuments({
        $or: [
          { 'twelfth.marks': { $gt: 0, $lte: 10 } },
          { 'twelfth.marks': { $gt: 100 } },
        ],
      }),
      Student.find({
        $or: [
          { 'twelfth.marks': { $gt: 0, $lte: 10 } },
          { 'twelfth.marks': { $gt: 100 } },
        ],
      })
        .select('rollNo fullName twelfth.marks twelfth.board branch')
        .limit(10)
        .lean(),
    ]);

    // 6. Backlog sum mismatches
    const allStudents = await Student.find({})
      .select('rollNo fullName branch division academics.totalLiveBacklogs academics.totalClosedBacklogs academics.semesterBacklogSum academics.semesters')
      .lean();

    let backlogMismatches = 0;
    const backlogMismatchSamples = [];

    for (const s of allStudents) {
      const live = s.academics?.totalLiveBacklogs || 0;
      const closed = s.academics?.totalClosedBacklogs || 0;
      const totalBacklogs = live + closed;
      const semSum = s.academics?.semesterBacklogSum || 0;

      if (semSum !== totalBacklogs) {
        backlogMismatches++;
        if (backlogMismatchSamples.length < 10) {
          backlogMismatchSamples.push({
            rollNo: s.rollNo,
            fullName: s.fullName,
            branch: s.branch,
            division: s.division,
            semesterBacklogSum: semSum,
            totalLiveBacklogs: live,
            totalClosedBacklogs: closed,
            sumLiveClosed: totalBacklogs,
            difference: semSum - totalBacklogs,
            semesterCounts: (s.academics?.semesters || []).map((x) => x.backlogCount),
          });
        }
      }
    }

    // 7. Duplicate raw source rows not imported as separate students
    const rawCol = mongoose.connection.db.collection('data');
    const rawDocs = await rawCol.find({}).toArray();
    const rollCounts = {};

    for (const doc of rawDocs) {
      const rawRoll = doc['Roll No'];
      const rollNo = rawRoll !== null && rawRoll !== undefined ? String(rawRoll).trim() : '';
      if (!rollCounts[rollNo]) rollCounts[rollNo] = [];
      rollCounts[rollNo].push(doc);
    }

    const unimportedSourceRows = [];
    Object.entries(rollCounts)
      .filter(([k, v]) => v.length > 1)
      .forEach(([roll, docs]) => {
        unimportedSourceRows.push({
          rollNo: roll,
          occurrences: docs.length,
          reason: 'Duplicate enrollment row in source CSV merged by unique Roll No during normalization',
          rows: docs.map((d) => ({
            sNo: d['S no'],
            fullName: d['Full Name'],
            branch: d['Branch'],
            campus: d['Campus'],
            cgpa: d['B.Tech Current CGPA'] || d.B?.['Tech Current CGPA'] || null,
          })),
        });
      });

    // 8. Invalid dates audit (students with invalid raw dates or DOBs)
    const invalidDateDocs = await Student.find({
      $or: [
        { recordDate: null },
        { dob: null },
      ],
    })
      .select('rollNo fullName branch division raw.Date raw.DOB recordDate dob')
      .lean();

    const invalidDates = invalidDateDocs
      .filter((s) => (s.raw?.Date && !s.recordDate) || (s.raw?.DOB && !s.dob))
      .map((s) => ({
        rollNo: s.rollNo,
        fullName: s.fullName,
        branch: s.branch,
        issue: !s.recordDate && s.raw?.Date ? `Invalid record date: "${s.raw.Date}"` : `Invalid DOB: "${s.raw?.DOB}"`,
        rawDate: s.raw?.Date || null,
        rawDob: s.raw?.DOB || null,
      }));

    // 9. Empty Unnamed Columns Audit
    const sampleRaw = rawDocs[0] || {};
    const unnamedCols = Object.keys(sampleRaw).filter((k) => /^Unnamed: \d+$/i.test(k));
    const emptyUnnamedColumns = {
      detectedColumns: unnamedCols,
      count: unnamedCols.length,
    };

    const latestDoc = await Student.findOne({
      recordDate: {
        $ne: null,
        $gte: new Date('2000-01-01T00:00:00.000Z'),
        $lte: new Date('2027-12-31T23:59:59.999Z'),
      },
    })
      .sort({ recordDate: -1 })
      .select('recordDate')
      .lean();

    return res.status(200).json({
      success: true,
      summary: {
        totalStudents,
        totalRawRows: rawDocs.length,
        dataAsOf: latestDoc?.recordDate || null,
      },
      qualityMetrics: {
        missingCgpa: {
          count: missingCgpaCount,
          samples: missingCgpaSamples,
          filterQuery: 'cgpaMin=null',
        },
        missingPhone: {
          count: missingPhoneCount,
          samples: missingPhoneSamples,
        },
        missingEmail: {
          count: missingEmailCount,
          samples: missingEmailSamples,
        },
        missingAnySgpa: {
          count: missingAnySgpaCount,
          samples: missingAnySgpaSamples,
        },
        policyNotRecorded: {
          count: missingPolicyCount,
          samples: missingPolicySamples,
          filterQuery: 'policySubmitted=null',
        },
        marksCheck: {
          tenthCount: marksCheckTenthCount,
          tenthSamples: marksCheckTenthSamples,
          twelfthCount: marksCheckTwelfthCount,
          twelfthSamples: marksCheckTwelfthSamples,
        },
        backlogConsistency: {
          evaluated: totalStudents,
          matching: totalStudents - backlogMismatches,
          mismatched: backlogMismatches,
          samples: backlogMismatchSamples,
        },
        unimportedSourceRows: {
          count: unimportedSourceRows.length,
          items: unimportedSourceRows,
        },
        invalidDates: {
          count: invalidDates.length,
          items: invalidDates,
        },
        emptyUnnamedColumns,
      },
    });
  } catch (error) {
    console.error('Data Quality Error:', error);
    return res.status(500).json({
      error: { code: 'DATA_QUALITY_ERROR', message: 'Failed to retrieve data quality metrics.' },
    });
  }
};

module.exports = {
  getAnalyticsOverview,
  getDataQualityMetrics,
};
