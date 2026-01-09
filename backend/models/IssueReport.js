const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterRole: {
    type: String,
    enum: ['seller', 'buyer'],
    required: true
  },
  reporterEmail: {
    type: String,
    required: true
  },
  reporterName: {
    type: String,
    required: true
  },
  issueType: {
    type: String,
    enum: ['bug', 'ui_issue', 'feature_request', 'other'],
    default: 'bug'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  pageUrl: {
    type: String,
    required: true
  },
  screenshot: {
    type: String, // Base64 or URL
    required: true
  },
  browserInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String,
    viewportSize: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
issueReportSchema.index({ status: 1, createdAt: -1 });
issueReportSchema.index({ reportedBy: 1 });

module.exports = mongoose.model('IssueReport', issueReportSchema);
