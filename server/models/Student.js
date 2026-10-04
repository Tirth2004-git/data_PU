const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    sem: { type: Number, required: true },
    sgpa: { type: Number, default: null },
    backlogCount: { type: Number, default: null },
    backlogText: { type: String, default: null },
    hasBacklog: { type: Boolean, default: false },
  },
  { _id: false }
);

const diplomaSchema = new mongoose.Schema(
  {
    degreeName: { type: String, default: null },
    marks: { type: Number, default: null },
    instituteName: { type: String, default: null },
    passingYear: { type: Number, default: null },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    sNo: { type: Number, default: null },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    nameLower: {
      type: String,
      required: true,
    },
    nameTokens: {
      type: [String],
      default: [],
    },
    officialEmail: { type: String, trim: true, default: null },
    personalEmail: { type: String, trim: true, default: null },
    officialPhone: { type: String, trim: true, default: null },
    whatsappNo: { type: String, trim: true, default: null },
    alternatePhone: { type: String, trim: true, default: null },
    batch: { type: Number, default: null },
    campus: { type: String, trim: true, default: null },
    course: { type: String, trim: true, default: null },
    branch: { type: String, trim: true, default: null },
    division: { type: String, trim: true, default: null },
    nationality: { type: String, trim: true, default: null },
    dob: { type: Date, default: null },

    tenth: {
      marks: { type: Number, default: null },
      board: { type: String, default: null },
      passingYear: { type: Number, default: null },
    },
    twelfth: {
      marks: { type: Number, default: null },
      board: { type: String, default: null },
      passingYear: { type: Number, default: null },
    },
    diploma: {
      type: diplomaSchema,
      default: null,
    },

    academics: {
      cgpa: { type: Number, default: null },
      liveBacklogsText: { type: String, default: null },
      closedBacklogsText: { type: String, default: null },
      totalLiveBacklogs: { type: Number, default: 0 },
      totalClosedBacklogs: { type: Number, default: 0 },
      currentPassingYear: { type: Number, default: null },
      semesterBacklogSum: { type: Number, default: 0 },
      avgSgpa: { type: Number, default: null },
      latestSgpa: { type: Number, default: null },
      semesters: [semesterSchema],
    },

    placementPolicySubmitted: { type: Boolean, default: null },
    remarks: { type: String, default: null },
    recordDate: { type: Date, default: null },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'students',
    timestamps: true,
  }
);

// Indexes
studentSchema.index({ nameLower: 1 });
studentSchema.index({ nameTokens: 1 });
studentSchema.index({ officialPhone: 1 });
studentSchema.index({ whatsappNo: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ division: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ campus: 1 });
studentSchema.index({ 'academics.cgpa': 1 });
studentSchema.index({ 'academics.totalLiveBacklogs': 1 });
studentSchema.index({ placementPolicySubmitted: 1 });
studentSchema.index({ branch: 1, division: 1 });

module.exports = mongoose.model('Student', studentSchema);
