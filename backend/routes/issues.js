const express = require('express');
const IssueReport = require('../models/IssueReport');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Report an issue (sellers and buyers)
router.post('/report', protect, async (req, res) => {
  try {
    const { title, description, pageUrl, screenshot, browserInfo, issueType } = req.body;

    // Validate required fields
    if (!title || !description || !pageUrl || !screenshot) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, pageUrl, screenshot' 
      });
    }

    // Only allow sellers and buyers to report issues (not admins)
    if (req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admins cannot report issues' 
      });
    }

    const issueReport = await IssueReport.create({
      reportedBy: req.user._id,
      reporterRole: req.user.role,
      reporterEmail: req.user.email,
      reporterName: req.user.name,
      title: title.trim(),
      description: description.trim(),
      pageUrl: pageUrl.trim(),
      screenshot: screenshot, // Base64 image
      browserInfo: browserInfo || {},
      issueType: issueType || 'bug',
      status: 'pending'
    });

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: issueReport
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all issues (admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only admins can view all issues' 
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) {
      query.status = status;
    }

    const [issues, total] = await Promise.all([
      IssueReport.find(query)
        .populate('reportedBy', 'name email role')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      IssueReport.countDocuments(query)
    ]);

    res.json({
      issues,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get issue statistics (admin only)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only admins can view statistics' 
      });
    }

    const stats = await IssueReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await IssueReport.countDocuments();
    const pending = await IssueReport.countDocuments({ status: 'pending' });

    res.json({
      total,
      pending,
      byStatus: stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update issue status (admin only)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only admins can update issue status' 
      });
    }

    const { status, adminNotes } = req.body;

    if (!['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    const updateData = { status };
    if (adminNotes) {
      updateData.adminNotes = adminNotes.trim();
    }
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const issue = await IssueReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('reportedBy', 'name email role')
     .populate('resolvedBy', 'name email');

    if (!issue) {
      return res.status(404).json({ 
        message: 'Issue not found' 
      });
    }

    res.json({
      message: 'Issue status updated',
      issue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user's own reported issues
router.get('/my-issues', protect, async (req, res) => {
  try {
    const issues = await IssueReport.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ issues });
  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
