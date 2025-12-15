import express from 'express';
import CustomerComplain from '../models/CustomerComplain.js';
import { authenticateAdmin, authenticateCorporate } from '../middleware/auth.js';

const router = express.Router();

const VALID_CATEGORIES = [
  'General Inquiry',
  'Booking Issue',
  'Tracking Issue',
  'Payment Issue',
  'Complaint',
  'Feedback',
  'Other',
  'Delivery Issues',
  'Billing & Payment',
  'Package Damage',
  'Service Quality',
  'Tracking Issues',
  'Others'
];

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

const formatComplaintResponse = (complaint) => ({
  id: complaint._id,
  name: complaint.name,
  email: complaint.email,
  phone: complaint.phone,
  subject: complaint.subject,
  category: complaint.category,
  priority: complaint.priority,
  status: complaint.status,
  message: complaint.message,
  response: complaint.response,
  responseDate: complaint.responseDate,
  createdAt: complaint.createdAt,
  updatedAt: complaint.updatedAt,
  source: complaint.source,
  corporateInfo: complaint.corporateInfo
});

// POST /api/customer-complain - Create a new customer complaint (public endpoint)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, category, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide name, email, subject, category, and message'
      });
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Create new complaint
    const complaint = new CustomerComplain({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      subject: subject.trim(),
      category,
      message: message.trim(),
      status: 'Open',
      priority: VALID_PRIORITIES.includes(req.body.priority) ? req.body.priority : 'Medium',
      source: 'public'
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: 'Your complaint has been submitted successfully. We will respond within 24 hours.',
      data: {
        id: complaint._id,
        name: complaint.name,
        email: complaint.email,
        subject: complaint.subject,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    console.error('Create customer complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit complaint',
      message: error.message
    });
  }
});

// POST /api/customer-complain/corporate - Create complaint from corporate dashboard
router.post('/corporate', authenticateCorporate, async (req, res) => {
  try {
    const { subject, category, priority = 'Medium', message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide subject, category, and message'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority',
        message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`
      });
    }

    const complaint = new CustomerComplain({
      name: req.corporate.companyName || req.corporate.concernName || 'Corporate Client',
      email: req.corporate.email,
      phone: req.corporate.contactNumber,
      subject: subject.trim(),
      category,
      message: message.trim(),
      priority,
      status: 'Open',
      source: 'corporate',
      corporateId: req.corporate._id,
      corporateInfo: {
        corporateId: req.corporate.corporateId,
        companyName: req.corporate.companyName,
        email: req.corporate.email,
        contactNumber: req.corporate.contactNumber
      }
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: 'Your ticket has been submitted successfully.',
      complaint: formatComplaintResponse(complaint)
    });
  } catch (error) {
    console.error('Corporate create complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit complaint',
      message: error.message
    });
  }
});

// GET /api/customer-complain/corporate - Get corporate complaints
router.get('/corporate', authenticateCorporate, async (req, res) => {
  try {
    const { status } = req.query;
    const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const query = { corporateId: req.corporate._id };
    if (status && allowedStatuses.includes(status)) {
      query.status = status;
    }

    const complaints = await CustomerComplain.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      complaints: complaints.map(formatComplaintResponse)
    });
  } catch (error) {
    console.error('Corporate get complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load complaints'
    });
  }
});

// PUT /api/customer-complain/corporate/:id/resolve - Mark complaint as resolved (corporate)
router.put('/corporate/:id/resolve', authenticateCorporate, async (req, res) => {
  try {
    const complaint = await CustomerComplain.findOne({
      _id: req.params.id,
      corporateId: req.corporate._id,
      status: { $in: ['Open', 'In Progress'] }
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found or cannot be resolved'
      });
    }

    complaint.status = 'Resolved';
    complaint.updatedAt = new Date();
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint marked as resolved',
      complaint: formatComplaintResponse(complaint)
    });
  } catch (error) {
    console.error('Corporate resolve complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve complaint'
    });
  }
});

// PUT /api/customer-complain/corporate/:id/close - Mark complaint as closed (corporate)
router.put('/corporate/:id/close', authenticateCorporate, async (req, res) => {
  try {
    const complaint = await CustomerComplain.findOne({
      _id: req.params.id,
      corporateId: req.corporate._id,
      status: 'Resolved'
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found or cannot be closed. Only resolved complaints can be closed.'
      });
    }

    complaint.status = 'Closed';
    complaint.updatedAt = new Date();
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint marked as closed',
      complaint: formatComplaintResponse(complaint)
    });
  } catch (error) {
    console.error('Corporate close complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close complaint'
    });
  }
});

// GET /api/customer-complain - Get all customer complaints (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;
    
    const query = {};
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const complaints = await CustomerComplain.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('respondedBy', 'name email')
      .lean();

    const totalCount = await CustomerComplain.countDocuments(query);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: pageNum * limitNum < totalCount,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get customer complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer complaints'
    });
  }
});

// GET /api/customer-complain/stats - Get complaint statistics (admin only)
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await CustomerComplain.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await CustomerComplain.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await CustomerComplain.countDocuments();
    const open = await CustomerComplain.countDocuments({ status: 'Open' });
    const inProgress = await CustomerComplain.countDocuments({ status: 'In Progress' });
    const resolved = await CustomerComplain.countDocuments({ status: 'Resolved' });
    const closed = await CustomerComplain.countDocuments({ status: 'Closed' });

    res.json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        byStatus: stats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get customer complaint stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaint statistics'
    });
  }
});

// GET /api/customer-complain/:id - Get a specific complaint (admin only)
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const complaint = await CustomerComplain.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Get customer complaint error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaint'
    });
  }
});

// PUT /api/customer-complain/:id - Update complaint status/response (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, response } = req.body;
    const adminId = req.admin._id;

    const complaint = await CustomerComplain.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      complaint.status = status;
    }

    // Update response if provided
    if (response) {
      complaint.response = response.trim();
      complaint.responseDate = new Date();
      complaint.respondedBy = adminId;
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const updatedComplaint = await CustomerComplain.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: updatedComplaint
    });
  } catch (error) {
    console.error('Update customer complaint error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update complaint'
    });
  }
});

// DELETE /api/customer-complain/:id - Delete a complaint (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const complaint = await CustomerComplain.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer complaint error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete complaint'
    });
  }
});

export default router;

