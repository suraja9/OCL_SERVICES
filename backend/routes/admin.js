import express from 'express';
import Admin from '../models/Admin.js';
import MedicineSettlement from '../models/MedicineSettlement.js';
import MedicineOclCharge from '../models/MedicineOclCharge.js';
import MedicineBooking from '../models/MedicineBooking.js';
import OfficeUser from '../models/OfficeUser.js';
import FormData from '../models/FormData.js';
import PinCodeArea from '../models/PinCodeArea.js';
import Coloader from '../models/Coloader.js';
import CorporatePricing from '../models/CorporatePricing.js';
import CustomerPricing from '../models/CustomerPricing.js';
import ConsignmentAssignment, { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import Tracking from '../models/Tracking.js';
import CustomerBooking from '../models/CustomerBooking.js';
import { getGlobalConsignmentSummary } from '../services/consignmentSequenceService.js';
import { generateToken, authenticateAdmin, requireSuperAdmin, validateLoginInput, authenticateAdminOrOfficeAdmin } from '../middleware/auth.js';
import S3Service from '../services/s3Service.js';
import { uploadForceDeliveryPOD, handleUploadError } from '../middleware/upload.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

const ASSIGNMENT_STATES = {
  ASSIGNED_PATH: 'AssignedPath',
  COMPLETED: 'Completed'
};

// Admin login route
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Admin login attempt: ${email}`);

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        error: 'Admin account is deactivated.'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    // Update login info
    await admin.updateLoginInfo();

    // Generate JWT token
    const token = generateToken(admin._id, 'admin');

    console.log(`✅ Admin login successful: ${admin.name} (${admin.email})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
        permissions: admin.permissions,
        canAssignPermissions: admin.canAssignPermissions
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
});

// Get current admin profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile information.'
    });
  }
});

// Admin dashboard stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Import additional models
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const CustomerComplain = (await import('../models/CustomerComplain.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;
    const CourierRequest = (await import('../models/CourierRequest.js')).default;
    const OnlineCustomer = (await import('../models/OnlineCustomer.js')).default;

    // Get form statistics
    const totalForms = await FormData.countDocuments();
    const completedForms = await FormData.countDocuments({ formCompleted: true });
    const incompleteForms = totalForms - completedForms;

    // Get recent forms
    const recentForms = await FormData.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('senderName senderEmail receiverName receiverEmail createdAt formCompleted')
      .lean();

    // Get forms by completion status over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentFormsStats = await FormData.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            completed: "$formCompleted"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Get pincode statistics
    const totalPincodes = await PinCodeArea.countDocuments();
    const uniqueStates = await PinCodeArea.distinct('statename');
    const uniqueCities = await PinCodeArea.distinct('cityname');

    // Get top states by form submissions
    const topStatesByForms = await FormData.aggregate([
      { $match: { senderState: { $exists: true, $ne: '' } } },
      { $group: { _id: '$senderState', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get booking statistics
    const totalMedicineBookings = await MedicineBooking.countDocuments();
    const medicineBookingsByStatus = await MedicineBooking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalCustomerBookings = await CustomerBooking.countDocuments();
    const customerBookingsByStatus = await CustomerBooking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalCorporateBookings = await ConsignmentUsage.countDocuments({
      $or: [
        { corporateId: { $exists: true, $ne: null } },
        { assignmentType: 'corporate' }
      ]
    });

    // Get tracking statistics
    const totalTrackings = await Tracking.countDocuments();
    const trackingsByStatus = await Tracking.aggregate([
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get corporate statistics
    const totalCorporates = await CorporateData.countDocuments();
    const activeCorporates = await CorporateData.countDocuments({ isActive: true });
    const pendingCorporates = await CorporateData.countDocuments({ status: 'pending' });

    // Get coloader statistics
    const totalColoaders = await Coloader.countDocuments();
    const activeColoaders = await Coloader.countDocuments({ isActive: true });
    const approvedColoaders = await Coloader.countDocuments({ status: 'approved' });

    // Get courier boy statistics
    const totalCourierBoys = await CourierBoy.countDocuments();
    const approvedCourierBoys = await CourierBoy.countDocuments({ status: 'approved' });
    const verifiedCourierBoys = await CourierBoy.countDocuments({ isVerified: true });

    // Get complaint statistics
    const totalComplaints = await CustomerComplain.countDocuments();
    const openComplaints = await CustomerComplain.countDocuments({ status: 'Open' });
    const inProgressComplaints = await CustomerComplain.countDocuments({ status: 'In Progress' });
    const resolvedComplaints = await CustomerComplain.countDocuments({ status: 'Resolved' });

    // Get invoice statistics
    let totalInvoices = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    try {
      totalInvoices = await Invoice.countDocuments();
      paidInvoices = await Invoice.countDocuments({ paymentStatus: 'paid' });
      pendingInvoices = await Invoice.countDocuments({ paymentStatus: 'pending' });
    } catch (err) {
      console.log('Invoice model not available:', err.message);
    }

    // Get courier request statistics
    let totalCourierRequests = 0;
    let pendingCourierRequests = 0;
    try {
      totalCourierRequests = await CourierRequest.countDocuments();
      pendingCourierRequests = await CourierRequest.countDocuments({ status: 'pending' });
    } catch (err) {
      console.log('CourierRequest model not available:', err.message);
    }

    // Get online customer statistics
    let totalOnlineCustomers = 0;
    try {
      totalOnlineCustomers = await OnlineCustomer.countDocuments();
    } catch (err) {
      console.log('OnlineCustomer model not available:', err.message);
    }

    // Get employee statistics
    const totalEmployees = await OfficeUser.countDocuments();
    const activeEmployees = await OfficeUser.countDocuments({ isActive: true });

    // Get recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMedicineBookings = await MedicineBooking.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('consignmentNumber status createdAt')
      .lean();

    const recentCustomerBookings = await CustomerBooking.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('consignmentNumber status createdAt')
      .lean();

    // Get monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await MedicineBooking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        forms: {
          total: totalForms,
          completed: completedForms,
          incomplete: incompleteForms,
          completionRate: totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0
        },
        pincodes: {
          total: totalPincodes,
          states: uniqueStates.length,
          cities: uniqueCities.length
        },
        bookings: {
          medicine: {
            total: totalMedicineBookings,
            byStatus: medicineBookingsByStatus
          },
          customer: {
            total: totalCustomerBookings,
            byStatus: customerBookingsByStatus
          },
          corporate: {
            total: totalCorporateBookings
          },
          recent: {
            medicine: recentMedicineBookings,
            customer: recentCustomerBookings
          },
          monthlyTrend: monthlyBookings
        },
        trackings: {
          total: totalTrackings,
          byStatus: trackingsByStatus
        },
        corporates: {
          total: totalCorporates,
          active: activeCorporates,
          pending: pendingCorporates
        },
        coloaders: {
          total: totalColoaders,
          active: activeColoaders,
          approved: approvedColoaders
        },
        courierBoys: {
          total: totalCourierBoys,
          approved: approvedCourierBoys,
          verified: verifiedCourierBoys
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices
        },
        courierRequests: {
          total: totalCourierRequests,
          pending: pendingCourierRequests
        },
        employees: {
          total: totalEmployees,
          active: activeEmployees
        },
        onlineCustomers: {
          total: totalOnlineCustomers
        },
        recent: {
          forms: recentForms,
          stats: recentFormsStats,
          topStates: topStatesByForms
        }
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard statistics.'
    });
  }
});

// Get medicine settlements total for a month/year (admin)
router.get('/medicine/settlements/summary', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }
    if (isNaN(year) || year < 2020 || year > 2030) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    const agg = await MedicineSettlement.aggregate([
      { $match: { settlementMonth: month, settlementYear: year } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);
    const total = agg.length > 0 ? agg[0].total : 0;
    const ocl = await MedicineOclCharge.findOne({ month, year });
    return res.json({ success: true, data: { total, oclCharge: ocl?.amount || 0 } });
  } catch (error) {
    console.error('Error fetching medicine settlements summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// Get full medicine settlements data for a month/year (admin)
router.get('/medicine/settlements', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }
    if (isNaN(year) || year < 2020 || year > 2030) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }

    const settlements = await MedicineSettlement.find({
      settlementMonth: month,
      settlementYear: year
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: settlements });
  } catch (error) {
    console.error('Error fetching medicine settlements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settlements' });
  }
});

// Get OCL charge for a month/year (admin)
router.get('/medicine/ocl-charge', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }
    if (isNaN(year) || year < 2020 || year > 2030) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }
    const doc = await MedicineOclCharge.findOne({ month, year });
    return res.json({ success: true, data: doc || { month, year, amount: 0 } });
  } catch (error) {
    console.error('Error fetching OCL charge:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch OCL charge' });
  }
});

// Create/Update OCL charge for a month/year (admin)
router.post('/medicine/ocl-charge', authenticateAdmin, async (req, res) => {
  try {
    const { month, year, amount, note } = req.body;
    const m = parseInt(month);
    const y = parseInt(year);
    if (isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }
    if (isNaN(y) || y < 2020 || y > 2030) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }
    const amt = Number(amount) || 0;
    const updated = await MedicineOclCharge.findOneAndUpdate(
      { month: m, year: y },
      { $set: { amount: amt, note: note || '' } },
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error saving OCL charge:', error);
    res.status(500).json({ success: false, message: 'Failed to save OCL charge' });
  }
});

// ==================== CUSTOMER PRICING MANAGEMENT ROUTES ====================

const CUSTOMER_PRICING_TEMPLATE = Object.freeze({
  standardDox: {
    air: {
      '01gm-250gm': { assamToNe: 0, assamToRoi: 0 },
      '251gm-500gm': { assamToNe: 0, assamToRoi: 0 },
      add500gm: { assamToNe: 0, assamToRoi: 0 }
    },
    road: {
      '01gm-250gm': { assamToNe: 0, assamToRoi: 0 },
      '251gm-500gm': { assamToNe: 0, assamToRoi: 0 },
      add500gm: { assamToNe: 0, assamToRoi: 0 }
    },
    train: { assamToNe: 0, assamToRoi: 0 } // Per kg only
  },
  standardNonDox: {
    air: {
      '1kg-5kg': { assamToNe: 0, assamToRoi: 0 },
      '5kg-100kg': { assamToNe: 0, assamToRoi: 0 }
    },
    road: {
      '1kg-5kg': { assamToNe: 0, assamToRoi: 0 },
      '5kg-100kg': { assamToNe: 0, assamToRoi: 0 }
    },
    train: { assamToNe: 0, assamToRoi: 0 } // Per kg only
  },
  priorityPricing: {
    base500gm: 0
  },
  reversePricing: {
    toAssam: {
      byRoad: { normal: 0, priority: 0 },
      byTrain: { normal: 0, priority: 0 },
      byFlight: { normal: 0, priority: 0 }
    },
    toNorthEast: {
      byRoad: { normal: 0, priority: 0 },
      byTrain: { normal: 0, priority: 0 },
      byFlight: { normal: 0, priority: 0 }
    }
  }
});

const sanitizePriceValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric * 100) / 100;
};

const applyTemplateToPayload = (template, payloadSection) => {
  if (template === null || typeof template !== 'object') {
    return sanitizePriceValue(payloadSection);
  }

  const result = {};

  for (const key of Object.keys(template)) {
    const templateValue = template[key];
    const payloadValue = payloadSection ? payloadSection[key] : undefined;

    if (templateValue !== null && typeof templateValue === 'object') {
      result[key] = applyTemplateToPayload(templateValue, payloadValue || {});
    } else {
      result[key] = sanitizePriceValue(payloadValue);
    }
  }

  return result;
};

const normalizeCustomerPricingPayload = (payload = {}) => ({
  standardDox: applyTemplateToPayload(CUSTOMER_PRICING_TEMPLATE.standardDox, payload.standardDox || {}),
  standardNonDox: applyTemplateToPayload(CUSTOMER_PRICING_TEMPLATE.standardNonDox, payload.standardNonDox || {}),
  priorityPricing: applyTemplateToPayload(CUSTOMER_PRICING_TEMPLATE.priorityPricing, payload.priorityPricing || {}),
  reversePricing: applyTemplateToPayload(CUSTOMER_PRICING_TEMPLATE.reversePricing, payload.reversePricing || {})
});

// Get customer pricing (singleton) - Public endpoint for booking
router.get('/customer-pricing/public', async (_req, res) => {
  try {
    const pricing = await CustomerPricing.getSingleton();
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Get customer pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch customer pricing.' });
  }
});

// Get customer pricing (singleton)
router.get('/customer-pricing', authenticateAdmin, async (_req, res) => {
  try {
    const pricing = await CustomerPricing.getSingleton();
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Get customer pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch customer pricing.' });
  }
});

// Update customer pricing
router.put('/customer-pricing', authenticateAdmin, async (req, res) => {
  try {
    const normalizedPricing = normalizeCustomerPricingPayload(req.body || {});
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : undefined;

    const updateData = {
      ...normalizedPricing,
      lastUpdatedBy: req.admin._id,
      lastUpdatedAt: new Date()
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const pricing = await CustomerPricing.findOneAndUpdate(
      { slug: 'default' },
      {
        $set: updateData,
        $setOnInsert: { slug: 'default' }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate('lastUpdatedBy', 'name email');

    console.log(`✅ Customer pricing updated by admin ${req.admin.name}`);

    res.json({
      success: true,
      message: 'Customer pricing updated successfully.',
      data: pricing
    });
  } catch (error) {
    console.error('Update customer pricing error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({ error: 'Failed to update customer pricing.' });
    }
  }
});

// Get all address forms with pagination and search - Query from Tracking table only
router.get('/addressforms', authenticateAdmin, async (req, res) => {
  // Check if admin has address forms permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const assignmentState = typeof req.query.assignmentState === 'string' ? req.query.assignmentState : undefined;

    // Build search query for Tracking table
    const trackingQuery = {};
    // Build search query for CustomerBooking table
    const customerBookingQuery = {};

    // Filter by currentStatus
    if (req.query.currentStatus) {
      trackingQuery.currentStatus = req.query.currentStatus;
      customerBookingQuery.currentStatus = req.query.currentStatus;
    }

    // Filter by assignment state (AssignedPath / Completed)
    if (assignmentState) {
      const normalizedAssignmentState = assignmentState;
      trackingQuery['assigned.currentAssignment'] = normalizedAssignmentState === ASSIGNMENT_STATES.ASSIGNED_PATH
        ? { $in: [ASSIGNMENT_STATES.ASSIGNED_PATH, null] } // include legacy records without the flag
        : normalizedAssignmentState;
      trackingQuery['assigned.0'] = { $exists: true };
      
      customerBookingQuery['assigned.currentAssignment'] = normalizedAssignmentState === ASSIGNMENT_STATES.ASSIGNED_PATH
        ? { $in: [ASSIGNMENT_STATES.ASSIGNED_PATH, null] }
        : normalizedAssignmentState;
      customerBookingQuery['assigned.0'] = { $exists: true };
    }

    // Add search conditions for Tracking
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      trackingQuery.$or = [
        { 'booked.originData.name': searchRegex },
        { 'booked.destinationData.name': searchRegex },
        { 'booked.originData.city': searchRegex },
        { 'booked.destinationData.city': searchRegex },
        { 'booked.originData.pincode': searchRegex },
        { 'booked.destinationData.pincode': searchRegex },
        { bookingReference: searchRegex }
      ];

      // If search is numeric, also search by consignment number
      if (!isNaN(search)) {
        trackingQuery.$or.push({ consignmentNumber: parseFloat(search) });
      }
    }

    // Add search conditions for CustomerBooking
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      customerBookingQuery.$or = [
        { 'origin.name': searchRegex },
        { 'destination.name': searchRegex },
        { 'origin.city': searchRegex },
        { 'destination.city': searchRegex },
        { 'origin.pincode': searchRegex },
        { 'destination.pincode': searchRegex },
        { bookingReference: searchRegex }
      ];

      // If search is numeric, also search by consignment number
      if (!isNaN(search)) {
        customerBookingQuery.$or.push({ consignmentNumber: parseFloat(search) });
      }
    }

    // Get total counts first
    const [trackingCount, customerBookingCount] = await Promise.all([
      Tracking.countDocuments(trackingQuery),
      CustomerBooking.countDocuments(customerBookingQuery)
    ]);

    const totalCount = trackingCount + customerBookingCount;

    // Fetch records from both collections - fetch more than needed to account for pagination across collections
    // Fetch up to skip + limit from each to ensure we have enough records after combining
    const fetchLimit = skip + limit;
    const [trackingRecords, customerBookingRecords] = await Promise.all([
      Tracking.find(trackingQuery)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean(),
      CustomerBooking.find(customerBookingQuery)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean()
    ]);

    console.log(`📊 Found ${trackingRecords.length} tracking records and ${customerBookingRecords.length} customer booking records`);
    console.log(`📊 Total count: ${totalCount} (Tracking: ${trackingCount}, CustomerBooking: ${customerBookingCount})`);
    if (req.query.currentStatus) {
      console.log(`🔍 Filtered by currentStatus: ${req.query.currentStatus}`);
    }

    // Transform Tracking records to match expected frontend structure
    const transformedTrackingData = trackingRecords.map(tracking => {
      const bookedData = tracking.booked && tracking.booked.length > 0 ? tracking.booked[0] : {};

      return {
        _id: tracking._id,
        consignmentNumber: tracking.consignmentNumber,
        bookingReference: tracking.bookingReference,
        originData: bookedData.originData || null,
        destinationData: bookedData.destinationData || null,
        shipmentData: bookedData.shipmentData || null,
        invoiceData: bookedData.invoiceData || null,
        paymentData: bookedData.paymentData || null,
        corporateInfo: bookedData.corporateInfo || null,
        uploadData: bookedData.uploadData || null,
        formCompleted: true,
        createdAt: tracking.createdAt || bookedData.bookingDate,
        assignmentData: {
          assignedColoader: tracking.assigned && tracking.assigned.length > 0 ? tracking.assigned[tracking.assigned.length - 1].coloaderId : null,
          assignedColoaderName: tracking.assigned && tracking.assigned.length > 0 ? tracking.assigned[tracking.assigned.length - 1].coloaderName : null,
          assignedAt: tracking.assigned && tracking.assigned.length > 0 ? tracking.assigned[tracking.assigned.length - 1].assignedAt : null,
          totalLegs: tracking.assigned && tracking.assigned.length > 0 ? tracking.assigned[tracking.assigned.length - 1].totalLegs : 1,
          legAssignments: tracking.assigned || [],
          status: tracking.currentStatus,
          completedAt: null
        },
        currentStatus: tracking.currentStatus,
        statusHistory: tracking.statusHistory || [],
        trackingData: {
          currentStatus: tracking.currentStatus,
          assigned: tracking.assigned || [],
          statusHistory: tracking.statusHistory || []
        },
        source: 'tracking' // Add source identifier
      };
    });

    // Transform CustomerBooking records to match expected frontend structure
    const transformedCustomerBookingData = customerBookingRecords.map(booking => {
      // Transform origin/destination to match originData/destinationData format
      const originData = booking.origin ? {
        name: booking.origin.name,
        city: booking.origin.city,
        state: booking.origin.state,
        pincode: booking.origin.pincode,
        flatBuilding: booking.origin.flatBuilding,
        locality: booking.origin.locality,
        landmark: booking.origin.landmark,
        area: booking.origin.area,
        district: booking.origin.district
      } : null;

      const destinationData = booking.destination ? {
        name: booking.destination.name,
        city: booking.destination.city,
        state: booking.destination.state,
        pincode: booking.destination.pincode,
        flatBuilding: booking.destination.flatBuilding,
        locality: booking.destination.locality,
        landmark: booking.destination.landmark,
        area: booking.destination.area,
        district: booking.destination.district
      } : null;

      // Transform shipment data
      const shipmentData = booking.shipment ? {
        actualWeight: booking.actualWeight || parseFloat(booking.shipment.weight) || 0,
        totalPackages: booking.shipment.packagesCount || '1',
        natureOfConsignment: booking.shipment.natureOfConsignment || ''
      } : null;

      return {
        _id: booking._id,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference,
        originData: originData,
        destinationData: destinationData,
        shipmentData: shipmentData,
        invoiceData: {
          finalPrice: booking.totalAmount || booking.calculatedPrice || 0
        },
        paymentData: {
          paymentStatus: booking.paymentStatus || 'pending',
          paymentType: booking.paymentMethod || ''
        },
        corporateInfo: null,
        uploadData: {
          totalPackages: parseInt(booking.shipment?.packagesCount || '1', 10)
        },
        formCompleted: true,
        createdAt: booking.createdAt || booking.BookedAt,
        assignmentData: {
          assignedColoader: booking.assigned && booking.assigned.length > 0 ? booking.assigned[booking.assigned.length - 1].coloaderId : null,
          assignedColoaderName: booking.assigned && booking.assigned.length > 0 ? booking.assigned[booking.assigned.length - 1].coloaderName : null,
          assignedAt: booking.assigned && booking.assigned.length > 0 ? booking.assigned[booking.assigned.length - 1].assignedAt : null,
          totalLegs: booking.assigned && booking.assigned.length > 0 ? booking.assigned[booking.assigned.length - 1].totalLegs : 1,
          legAssignments: booking.assigned || [],
          status: booking.currentStatus,
          completedAt: null
        },
        currentStatus: booking.currentStatus,
        statusHistory: booking.statusHistory || [],
        trackingData: {
          currentStatus: booking.currentStatus,
          assigned: booking.assigned || [],
          statusHistory: booking.statusHistory || []
        },
        source: 'customerbooking' // Add source identifier
      };
    });

    // Combine and sort by createdAt (newest first)
    const allTransformedData = [...transformedTrackingData, ...transformedCustomerBookingData]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const transformedData = allTransformedData.slice(skip, skip + limit);

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      },
      search: search
    });

  } catch (error) {
    console.error('Get address forms error:', error);
    res.status(500).json({
      error: 'Failed to get address forms.'
    });
  }
});

// Get address form by consignment number
router.get('/addressforms/consignment/:consignmentNumber', authenticateAdmin, async (req, res) => {
  // Check permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }
  try {
    const consignmentNumber = req.params.consignmentNumber;
    // Try numeric match first, but support string storage too
    const numeric = Number(consignmentNumber);
    const form = await FormData.findOne({
      $or: [
        { consignmentNumber: numeric },
        { consignmentNumber: consignmentNumber }
      ]
    }).lean();
    if (!form) {
      return res.status(404).json({ error: 'Order not found for consignment number.' });
    }
    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Get by consignment error:', error);
    res.status(500).json({ error: 'Failed to fetch order by consignment number.' });
  }
});

// Scan tracking record and mark as received
// Get tracking records with optional status filter
router.get('/tracking', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const status = req.query.status || 'received';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = status ? { currentStatus: status } : {};

    const [records, totalCount] = await Promise.all([
      Tracking.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tracking.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Get tracking records error:', error);
    res.status(500).json({ error: 'Failed to fetch tracking records.' });
  }
});

// Get CustomerBookings with optional status filter
router.get('/customerbookings', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const status = req.query.status || 'received';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = status ? { currentStatus: status } : {};

    const [records, totalCount] = await Promise.all([
      CustomerBooking.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerBooking.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch customer bookings.' });
  }
});

// Get tracking records for force delivery (specific statuses only)
router.get('/tracking/force-delivery', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Allowed statuses for force delivery
    const allowedStatuses = ['booked', 'received', 'pickup', 'assigned', 'intransit', 'reached-hub'];
    
    // Query to filter by allowed statuses and exclude delivered/force delivered orders
    // Exclude orders where forceDelivery is true (since status will be 'delivered' after force delivery)
    const query = {
      currentStatus: { $in: allowedStatuses },
      $or: [
        { forceDelivery: { $exists: false } },
        { forceDelivery: false }
      ]
    };

    // Fetch tracking records with pagination
    const [records, totalCount] = await Promise.all([
      Tracking.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tracking.countDocuments(query)
    ]);

    // Transform records to include booked data in a flattened structure
    const transformedData = records.map(tracking => {
      const bookedData = tracking.booked && tracking.booked.length > 0 ? tracking.booked[0] : {};
      
      return {
        _id: tracking._id,
        consignmentNumber: tracking.consignmentNumber,
        bookingReference: tracking.bookingReference || tracking.consignmentNumber?.toString(),
        originData: bookedData.originData || null,
        destinationData: bookedData.destinationData || null,
        currentStatus: tracking.currentStatus,
        createdAt: tracking.createdAt || bookedData.bookingDate || new Date(),
        senderName: bookedData.originData?.name || bookedData.senderName || null,
        receiverName: bookedData.destinationData?.name || bookedData.receiverName || null,
        invoiceData: bookedData.invoiceData || null,
        paymentData: bookedData.paymentData || null,
        paymentStatus: bookedData.paymentStatus || 'unpaid',
        assignmentType: tracking.assignmentType,
        entityId: tracking.entityId,
        corporateId: tracking.corporateId,
        statusHistory: tracking.statusHistory || [],
        updatedAt: tracking.updatedAt
      };
    });

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Get force delivery tracking records error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch force delivery tracking records.' 
    });
  }
});

// Submit force delivery (POST endpoint)
router.post('/tracking/force-delivery', authenticateAdmin, uploadForceDeliveryPOD, handleUploadError, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { trackingId, personName, vehicleType, vehicleNumber } = req.body;

    // Validation
    if (!trackingId) {
      return res.status(400).json({
        success: false,
        error: 'Tracking ID is required'
      });
    }

    if (!personName || !vehicleType || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Person name, vehicle type, and vehicle number are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'POD file is required'
      });
    }

    // Find the tracking record
    const tracking = await Tracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking record not found'
      });
    }

    // Upload POD file to S3
    let podImageUrl = '';
    try {
      const uploadResult = await S3Service.uploadFile(req.file, 'uploads/force-delivery-pod');
      if (uploadResult.success) {
        podImageUrl = uploadResult.url;
      } else {
        throw new Error('Failed to upload POD to S3');
      }
    } catch (uploadError) {
      console.error('Error uploading POD to S3:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload POD file'
      });
    }

    // Prepare force delivery data
    const forceData = {
      personName: personName.trim(),
      vehicleType: vehicleType.trim(),
      vehicleNumber: vehicleNumber.trim(),
      podImageUrl: podImageUrl,
      submittedBy: {
        adminId: req.admin._id,
        adminName: req.admin.name,
        adminEmail: req.admin.email
      },
      submittedAt: new Date()
    };

    // Update tracking record
    tracking.currentStatus = 'delivered';
    tracking.forceDelivery = true;
    tracking.force = forceData;

    // Add status history entry
    tracking.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      notes: `Force delivery completed by ${req.admin.name}. Person: ${personName}, Vehicle: ${vehicleType} - ${vehicleNumber}`
    });

    // Add to delivered array if it doesn't exist
    if (!tracking.delivered) {
      tracking.delivered = {
        scannedConsignments: [],
        amountCollected: null,
        deliveredAt: new Date(),
        paymentMethod: null,
        status: 'delivered'
      };
    } else {
      tracking.delivered.deliveredAt = new Date();
      tracking.delivered.status = 'delivered';
    }

    // Save the updated tracking record
    await tracking.save();

    console.log(`✅ Force delivery completed for consignment #${tracking.consignmentNumber} by ${req.admin.name}`);

    // Get booked data for email and WhatsApp
    const bookedData = tracking.booked && tracking.booked.length > 0 ? tracking.booked[0] : {};

    // Send delivery confirmation email to sender/origin (non-blocking)
    try {
      const emailService = (await import('../services/emailService.js')).default;
      const originEmail = bookedData?.originData?.email || bookedData?.senderEmail || null;

      if (originEmail) {
        // Determine if this is a corporate booking or form-based booking
        const isCorporate = tracking.corporateId || tracking.assignmentType === 'corporate';
        
        // Prepare delivery data for email
        const deliveryEmailData = {
          consignmentNumber: tracking.consignmentNumber,
          bookingReference: tracking.bookingReference || tracking.consignmentNumber?.toString(),
          bookingDate: bookedData?.bookingDate || tracking.createdAt,
          deliveredAt: new Date(),
          paymentStatus: bookedData?.paymentStatus || 'unpaid',
          paymentMethod: bookedData?.paymentData?.paymentMethod || '',
          shippingMode: bookedData?.shipmentData?.mode || bookedData?.invoiceData?.transportMode || 'Standard',
          serviceType: bookedData?.shipmentData?.services || bookedData?.invoiceData?.serviceType || 'Express',
          calculatedPrice: bookedData?.invoiceData?.finalPrice || bookedData?.invoiceData?.total || null,
          basePrice: bookedData?.invoiceData?.basePrice || null,
          gstAmount: bookedData?.invoiceData?.gstAmount || null,
          pickupCharge: bookedData?.pickupCharge || 0,
          totalAmount: bookedData?.invoiceData?.finalPrice || bookedData?.invoiceData?.total || null,
          origin: bookedData?.originData || { email: originEmail },
          destination: bookedData?.destinationData || {},
          shipment: bookedData?.shipmentData || {},
          packageImages: bookedData?.shipmentData?.packageImages || bookedData?.packageImages || [],
          forceDelivery: {
            personName: forceData.personName,
            vehicleType: forceData.vehicleType,
            vehicleNumber: forceData.vehicleNumber
          }
        };

        // Send appropriate email based on booking type
        if (isCorporate) {
          emailService.sendCorporateDeliveryConfirmationEmail(deliveryEmailData)
            .then(result => {
              console.log(`✅ Corporate delivery confirmation email sent to ${originEmail} for consignment #${tracking.consignmentNumber}`);
            })
            .catch(error => {
              console.error(`❌ Failed to send corporate delivery confirmation email to ${originEmail}:`, error);
            });
        } else {
          // Form-based booking (from BookingPanel)
          emailService.sendShipmentDeliveryConfirmationEmail({
            ...deliveryEmailData,
            senderEmail: originEmail,
            originData: bookedData?.originData || {},
            destinationData: bookedData?.destinationData || {},
            shipmentData: bookedData?.shipmentData || {}
          })
            .then(result => {
              console.log(`✅ Shipment delivery confirmation email sent to ${originEmail} for consignment #${tracking.consignmentNumber}`);
            })
            .catch(error => {
              console.error(`❌ Failed to send shipment delivery confirmation email to ${originEmail}:`, error);
            });
        }
      } else {
        console.warn(`⚠️ No origin email found for tracking consignment #${tracking.consignmentNumber}, skipping delivery email`);
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('❌ Error preparing delivery confirmation email:', emailError);
    }

    // Send WhatsApp notification to sender/origin phone number (non-blocking)
    try {
      // Get origin phone number from booked data
      const originPhoneNumber = bookedData?.originData?.mobileNumber || bookedData?.senderPhone || null;

      if (originPhoneNumber) {
        // Build tracking URL
        const trackingUrl = `https://oclservices.com/tracking?view=progress&type=awb&number=${tracking.consignmentNumber}`;

        // Send WhatsApp notification (non-blocking - don't fail if this fails)
        whatsappService.sendDeliveredNotification({
          phoneNumber: originPhoneNumber,
          consignmentNumber: tracking.consignmentNumber,
          trackingUrl: trackingUrl
        }).then(result => {
          if (result.success) {
            console.log(`✅ WhatsApp delivered notification sent to ${originPhoneNumber} for consignment #${tracking.consignmentNumber}`);
          } else {
            console.error(`❌ Failed to send WhatsApp delivered notification to ${originPhoneNumber}:`, result.error);
          }
        }).catch(error => {
          console.error(`❌ Error sending WhatsApp delivered notification to ${originPhoneNumber}:`, error);
        });
      } else {
        console.warn(`⚠️ No origin phone number found for tracking consignment #${tracking.consignmentNumber}, skipping WhatsApp notification`);
      }
    } catch (whatsappError) {
      // Log error but don't fail the request
      console.error('❌ Error preparing WhatsApp notification:', whatsappError);
    }

    res.json({
      success: true,
      message: 'Force delivery submitted successfully',
      data: {
        trackingId: tracking._id,
        consignmentNumber: tracking.consignmentNumber,
        currentStatus: tracking.currentStatus,
        forceDelivery: tracking.forceDelivery
      }
    });
  } catch (error) {
    console.error('Force delivery submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit force delivery'
    });
  }
});

// Get customer booking records for force delivery (any currentStatus except delivered)
router.get('/customerbookings/force-delivery', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Query to exclude delivered and force delivered orders
    const query = {
      currentStatus: { $ne: 'delivered' },
      $or: [
        { forceDelivery: { $exists: false } },
        { forceDelivery: false }
      ]
    };

    // Fetch customer booking records with pagination
    const [records, totalCount] = await Promise.all([
      CustomerBooking.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerBooking.countDocuments(query)
    ]);

    // Transform records to match expected frontend structure
    const transformedData = records.map(booking => {
      return {
        _id: booking._id,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference || booking.consignmentNumber?.toString(),
        originData: booking.origin ? {
          name: booking.origin.name || null,
          city: booking.origin.city || null,
          state: booking.origin.state || null
        } : null,
        destinationData: booking.destination ? {
          name: booking.destination.name || null,
          city: booking.destination.city || null,
          state: booking.destination.state || null
        } : null,
        currentStatus: booking.currentStatus,
        createdAt: booking.BookedAt || booking.createdAt || new Date(),
        senderName: booking.origin?.name || null,
        receiverName: booking.destination?.name || null,
        invoiceData: {
          finalPrice: booking.calculatedPrice || booking.totalAmount || 0
        },
        paymentData: {
          paymentType: booking.paymentMethod || null
        },
        paymentStatus: booking.paymentStatus || 'pending',
        statusHistory: booking.statusHistory || [],
        updatedAt: booking.updatedAt
      };
    });

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Get force delivery customer booking records error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch force delivery customer booking records.' 
    });
  }
});

// Submit force delivery for customer booking (POST endpoint)
router.post('/customerbookings/force-delivery', authenticateAdmin, uploadForceDeliveryPOD, handleUploadError, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { bookingId, personName, vehicleType, vehicleNumber } = req.body;

    // Validation
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }

    if (!personName || !vehicleType || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Person name, vehicle type, and vehicle number are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'POD file is required'
      });
    }

    // Find the customer booking record
    const booking = await CustomerBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Customer booking record not found'
      });
    }

    // Upload POD file to S3
    let podImageUrl = '';
    try {
      const uploadResult = await S3Service.uploadFile(req.file, 'uploads/force-delivery-pod');
      if (uploadResult.success) {
        podImageUrl = uploadResult.url;
      } else {
        throw new Error('Failed to upload POD to S3');
      }
    } catch (uploadError) {
      console.error('Error uploading POD to S3:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload POD file'
      });
    }

    // Prepare force delivery data
    const forceData = {
      personName: personName.trim(),
      vehicleType: vehicleType.trim(),
      vehicleNumber: vehicleNumber.trim(),
      podImageUrl: podImageUrl,
      submittedBy: {
        adminId: req.admin._id,
        adminName: req.admin.name,
        adminEmail: req.admin.email
      },
      submittedAt: new Date()
    };

    // Update customer booking record
    booking.currentStatus = 'delivered';
    booking.status = 'delivered';
    booking.forceDelivery = true;
    booking.force = forceData;

    // Add status history entry
    if (!booking.statusHistory) {
      booking.statusHistory = [];
    }
    booking.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      notes: `Force delivery completed by ${req.admin.name}. Person: ${personName}, Vehicle: ${vehicleType} - ${vehicleNumber}`
    });

    // Add to delivered object if it doesn't exist
    if (!booking.delivered) {
      booking.delivered = {
        deliveredAt: new Date(),
        amountCollected: booking.calculatedPrice || booking.totalAmount || null,
        paymentMethod: booking.paymentMethod || null,
        timestamp: new Date()
      };
    } else {
      booking.delivered.deliveredAt = new Date();
      booking.delivered.timestamp = new Date();
    }

    // Save the updated customer booking record
    await booking.save();

    console.log(`✅ Force delivery completed for customer booking consignment #${booking.consignmentNumber} by ${req.admin.name}`);

    // Send delivery confirmation email to sender/origin (non-blocking)
    try {
      const emailService = (await import('../services/emailService.js')).default;
      const originEmail = booking.origin?.email || null;

      if (originEmail) {
        // Prepare delivery data for email
        const deliveryEmailData = {
          consignmentNumber: booking.consignmentNumber,
          bookingReference: booking.bookingReference || booking.consignmentNumber?.toString(),
          bookingDate: booking.createdAt || booking.BookedAt,
          deliveredAt: new Date(),
          paymentStatus: booking.paymentStatus || 'unpaid',
          paymentMethod: booking.paymentMethod || '',
          shippingMode: booking.shippingMode || 'Standard',
          serviceType: booking.serviceType || 'Express',
          calculatedPrice: booking.calculatedPrice || booking.totalAmount || null,
          basePrice: booking.basePrice || null,
          gstAmount: booking.gstAmount || null,
          pickupCharge: booking.pickupCharge || 100,
          totalAmount: booking.totalAmount || booking.calculatedPrice || null,
          origin: booking.origin || {},
          destination: booking.destination || {},
          shipment: booking.shipment || {},
          packageImages: booking.packageImages || [],
          forceDelivery: {
            personName: forceData.personName,
            vehicleType: forceData.vehicleType,
            vehicleNumber: forceData.vehicleNumber
          }
        };

        // Send online booking delivery confirmation email
        emailService.sendOnlineDeliveryConfirmationEmail(deliveryEmailData)
          .then(result => {
            console.log(`✅ Online delivery confirmation email sent to ${originEmail} for consignment #${booking.consignmentNumber}`);
          })
          .catch(error => {
            console.error(`❌ Failed to send online delivery confirmation email to ${originEmail}:`, error);
          });
      } else {
        console.warn(`⚠️ No origin email found for customer booking consignment #${booking.consignmentNumber}, skipping delivery email`);
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('❌ Error preparing delivery confirmation email:', emailError);
    }

    // Send WhatsApp notification to sender/origin phone number (non-blocking)
    try {
      // Get origin phone number from booking
      const originPhoneNumber = booking.origin?.mobileNumber || null;

      if (originPhoneNumber) {
        // Build tracking URL
        const trackingUrl = `https://oclservices.com/tracking?view=progress&type=awb&number=${booking.consignmentNumber}`;

        // Send WhatsApp notification (non-blocking - don't fail if this fails)
        whatsappService.sendDeliveredNotification({
          phoneNumber: originPhoneNumber,
          consignmentNumber: booking.consignmentNumber,
          trackingUrl: trackingUrl
        }).then(result => {
          if (result.success) {
            console.log(`✅ WhatsApp delivered notification sent to ${originPhoneNumber} for consignment #${booking.consignmentNumber}`);
          } else {
            console.error(`❌ Failed to send WhatsApp delivered notification to ${originPhoneNumber}:`, result.error);
          }
        }).catch(error => {
          console.error(`❌ Error sending WhatsApp delivered notification to ${originPhoneNumber}:`, error);
        });
      } else {
        console.warn(`⚠️ No origin phone number found for customer booking consignment #${booking.consignmentNumber}, skipping WhatsApp notification`);
      }
    } catch (whatsappError) {
      // Log error but don't fail the request
      console.error('❌ Error preparing WhatsApp notification:', whatsappError);
    }

    res.json({
      success: true,
      message: 'Force delivery submitted successfully',
      data: {
        bookingId: booking._id,
        consignmentNumber: booking.consignmentNumber,
        currentStatus: booking.currentStatus,
        forceDelivery: booking.forceDelivery
      }
    });
  } catch (error) {
    console.error('Force delivery submission error for customer booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit force delivery'
    });
  }
});

// Get tracking by consignment number
router.get('/tracking/consignment/:consignmentNumber', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber } = req.params;
    const numericConsignment = Number(consignmentNumber);

    const tracking = await Tracking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    ).lean();

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found for consignment number.' });
    }

    res.json({ success: true, data: tracking });
  } catch (error) {
    console.error('Get tracking by consignment error:', error);
    res.status(500).json({ error: 'Failed to fetch tracking record.' });
  }
});

// Get tracking records grouped by latest assigned coloader (currentStatus = assigned)
router.get('/tracking/coloader/groups', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { status = 'assigned' } = req.query;
    const trackingFilter = {
      currentStatus: status,
      'assigned.0': { $exists: true }
    };

    const trackingRecords = await Tracking.find(trackingFilter)
      .sort({ updatedAt: -1 })
      .lean();

    const groupsMap = new Map();

    trackingRecords.forEach((tracking) => {
      if (!tracking.assigned || tracking.assigned.length === 0) {
        return;
      }

      const latestAssignment = tracking.assigned[tracking.assigned.length - 1];
      if (!latestAssignment?.coloaderId) {
        return;
      }

      const key = latestAssignment.coloaderId.toString();

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          coloaderId: latestAssignment.coloaderId,
          coloaderName: latestAssignment.coloaderName || 'Unknown Coloader',
          totalOrders: 0,
          latestAssignedAt: latestAssignment.assignedAt || tracking.updatedAt,
          shipments: []
        });
      }

      const group = groupsMap.get(key);
      group.totalOrders += 1;
      if (
        latestAssignment.assignedAt &&
        (!group.latestAssignedAt || latestAssignment.assignedAt > group.latestAssignedAt)
      ) {
        group.latestAssignedAt = latestAssignment.assignedAt;
      }

      group.shipments.push({
        ...tracking,
        latestAssignment
      });
    });

    const groupedData = Array.from(groupsMap.values()).sort(
      (a, b) => new Date(b.latestAssignedAt || 0) - new Date(a.latestAssignedAt || 0)
    );

    res.json({
      success: true,
      data: groupedData,
      meta: {
        totalColoaders: groupedData.length,
        totalShipments: trackingRecords.length,
        statusFilter: status
      }
    });
  } catch (error) {
    console.error('Get coloader tracking groups error:', error);
    res.status(500).json({ error: 'Failed to fetch coloader assignments.' });
  }
});

// Get coloader address options for courier assignment
router.get('/tracking/coloader/:coloaderId/addresses', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { coloaderId } = req.params;

    if (!coloaderId) {
      return res.status(400).json({ error: 'coloaderId is required.' });
    }

    const coloader = await Coloader.findById(coloaderId)
      .select('companyName companyAddress fromLocations toLocations mobileNumbers')
      .lean();

    if (!coloader) {
      return res.status(404).json({ error: 'Coloader not found.' });
    }

    res.json({
      success: true,
      data: {
        coloaderId: coloader._id,
        coloaderName: coloader.companyName,
        companyAddress: coloader.companyAddress,
        fromLocations: coloader.fromLocations || [],
        toLocations: coloader.toLocations || [],
        mobileNumbers: coloader.mobileNumbers || []
      }
    });
  } catch (error) {
    console.error('Get coloader addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch coloader addresses.' });
  }
});

// Assign courier boy to tracking records (from coloader tab)
router.post('/tracking/coloader/assign-courier-boy', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { trackingIds, courierBoyId, coloaderId, addressSelection } = req.body;

    if (!Array.isArray(trackingIds) || trackingIds.length === 0) {
      return res.status(400).json({ error: 'trackingIds array is required.' });
    }

    if (!courierBoyId) {
      return res.status(400).json({ error: 'courierBoyId is required.' });
    }

    if (!coloaderId) {
      return res.status(400).json({ error: 'coloaderId is required.' });
    }

    if (!addressSelection || !addressSelection.type) {
      return res.status(400).json({ error: 'addressSelection with a valid type is required.' });
    }

    const validAddressTypes = ['company', 'from', 'to'];
    if (!validAddressTypes.includes(addressSelection.type)) {
      return res.status(400).json({ error: 'addressSelection.type must be one of company, from, or to.' });
    }

    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const courierBoy = await CourierBoy.findById(courierBoyId)
      .select('fullName email phone')
      .lean();

    if (!courierBoy) {
      return res.status(404).json({ error: 'Courier boy not found.' });
    }

    const coloader = await Coloader.findById(coloaderId)
      .select('companyName companyAddress fromLocations toLocations mobileNumbers')
      .lean();

    if (!coloader) {
      return res.status(404).json({ error: 'Coloader not found.' });
    }

    let selectedAddressDetails = null;
    let coloaderAddressLabel = 'Company Address';
    let coloaderAddressIndex = null;

    if (addressSelection.type === 'company') {
      selectedAddressDetails = coloader.companyAddress;
      coloaderAddressLabel = 'Company Address';
    } else if (addressSelection.type === 'from') {
      const index = Number(addressSelection.index);
      if (Number.isNaN(index) || index < 0 || index >= (coloader.fromLocations || []).length) {
        return res.status(400).json({ error: 'Invalid from address index.' });
      }
      selectedAddressDetails = coloader.fromLocations[index];
      coloaderAddressLabel = `From Address ${index + 1}`;
      coloaderAddressIndex = index;
    } else if (addressSelection.type === 'to') {
      const index = Number(addressSelection.index);
      if (Number.isNaN(index) || index < 0 || index >= (coloader.toLocations || []).length) {
        return res.status(400).json({ error: 'Invalid to address index.' });
      }
      selectedAddressDetails = coloader.toLocations[index];
      coloaderAddressLabel = `To Address ${index + 1}`;
      coloaderAddressIndex = index;
    }

    if (!selectedAddressDetails) {
      return res.status(400).json({ error: 'Selected address details could not be determined.' });
    }

    const uniqueTrackingIds = [...new Set(trackingIds.filter(Boolean))];
    const trackings = await Tracking.find({ _id: { $in: uniqueTrackingIds } });

    if (!trackings.length) {
      return res.status(404).json({ error: 'No tracking records found for provided IDs.' });
    }

    const adminName = req.admin.name || req.admin.email || 'Admin';
    const invalidTrackings = trackings.filter((tracking) => {
      if (!Array.isArray(tracking.assigned) || tracking.assigned.length === 0) {
        return true;
      }
      const latestAssignment = tracking.assigned[tracking.assigned.length - 1];
      return !latestAssignment.coloaderId || latestAssignment.coloaderId.toString() !== coloaderId;
    });

    if (invalidTrackings.length > 0) {
      return res.status(400).json({
        error: 'One or more tracking records are not linked with the provided coloader.',
        invalidTrackingIds: invalidTrackings.map((t) => t._id)
      });
    }

    const assignments = [];
    const coloaderPhone = (coloader.mobileNumbers && coloader.mobileNumbers[0]) || '';

    for (const tracking of trackings) {
      const assignedAt = new Date();
      const courierEntry = {
        courierBoyId: courierBoyId,
        courierBoyName: courierBoy.fullName || 'Courier Boy',
        courierBoyEmail: courierBoy.email || '',
        courierBoyPhone: courierBoy.phone || '',
        coloaderId: coloader._id,
        coloaderName: coloader.companyName,
        coloaderPhone,
        coloaderAddressType: addressSelection.type,
        coloaderAddressLabel,
        coloaderAddressDetails: selectedAddressDetails,
        coloaderAddressIndex,
        adminId: req.admin._id,
        adminName,
        adminEmail: req.admin.email || '',
        assignedAt
      };

      if (!Array.isArray(tracking.courierboy)) {
        tracking.courierboy = [];
      }
      tracking.courierboy.push(courierEntry);

      tracking.currentStatus = 'courierboy';
      tracking.statusHistory.push({
        status: 'courierboy',
        timestamp: assignedAt,
        notes: `Courier boy ${courierEntry.courierBoyName} assigned by ${adminName}`
      });

      await tracking.save();
      assignments.push({
        trackingId: tracking._id,
        consignmentNumber: tracking.consignmentNumber,
        bookingReference: tracking.bookingReference
      });
    }

    res.json({
      success: true,
      message: `Courier boy assigned to ${assignments.length} tracking record(s).`,
      assignments
    });
  } catch (error) {
    console.error('Assign courier boy to tracking error:', error);
    res.status(500).json({ error: 'Failed to assign courier boy to tracking records.' });
  }
});

// Get customer bookings grouped by latest assigned coloader (currentStatus = assigned)
router.get('/customer-booking/coloader/groups', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { status = 'assigned' } = req.query;
    const bookingFilter = {
      currentStatus: status,
      'assigned.0': { $exists: true }
    };

    console.log('🔍 Fetching customer bookings with filter:', JSON.stringify(bookingFilter, null, 2));
    const customerBookings = await CustomerBooking.find(bookingFilter)
      .sort({ updatedAt: -1 })
      .lean();
    
    console.log(`📦 Found ${customerBookings.length} customer bookings with currentStatus="${status}"`);

    const groupsMap = new Map();

    customerBookings.forEach((booking) => {
      if (!booking.assigned || booking.assigned.length === 0) {
        return;
      }

      const latestAssignment = booking.assigned[booking.assigned.length - 1];
      if (!latestAssignment?.coloaderId) {
        return;
      }

      const key = latestAssignment.coloaderId.toString();

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          coloaderId: latestAssignment.coloaderId,
          coloaderName: latestAssignment.coloaderName || 'Unknown Coloader',
          totalOrders: 0,
          latestAssignedAt: latestAssignment.assignedAt || booking.updatedAt,
          bookings: []
        });
      }

      const group = groupsMap.get(key);
      group.totalOrders += 1;
      if (
        latestAssignment.assignedAt &&
        (!group.latestAssignedAt || latestAssignment.assignedAt > group.latestAssignedAt)
      ) {
        group.latestAssignedAt = latestAssignment.assignedAt;
      }

      group.bookings.push({
        ...booking,
        latestAssignment
      });
    });

    const groupedData = Array.from(groupsMap.values()).sort(
      (a, b) => new Date(b.latestAssignedAt || 0) - new Date(a.latestAssignedAt || 0)
    );

    res.json({
      success: true,
      data: groupedData,
      meta: {
        totalColoaders: groupedData.length,
        totalBookings: customerBookings.length,
        statusFilter: status
      }
    });
  } catch (error) {
    console.error('Get customer booking coloader groups error:', error);
    res.status(500).json({ error: 'Failed to fetch customer booking coloader assignments.' });
  }
});

// Assign courier boy to customer bookings (from coloader tab)
router.post('/customer-booking/coloader/assign-courier-boy', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { bookingIds, courierBoyId, coloaderId, addressSelection } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ error: 'bookingIds array is required.' });
    }

    if (!courierBoyId) {
      return res.status(400).json({ error: 'courierBoyId is required.' });
    }

    if (!coloaderId) {
      return res.status(400).json({ error: 'coloaderId is required.' });
    }

    if (!addressSelection || !addressSelection.type) {
      return res.status(400).json({ error: 'addressSelection with a valid type is required.' });
    }

    const validAddressTypes = ['company', 'from', 'to'];
    if (!validAddressTypes.includes(addressSelection.type)) {
      return res.status(400).json({ error: 'addressSelection.type must be one of company, from, or to.' });
    }

    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const courierBoy = await CourierBoy.findById(courierBoyId)
      .select('fullName email phone')
      .lean();

    if (!courierBoy) {
      return res.status(404).json({ error: 'Courier boy not found.' });
    }

    const coloader = await Coloader.findById(coloaderId)
      .select('companyName companyAddress fromLocations toLocations mobileNumbers')
      .lean();

    if (!coloader) {
      return res.status(404).json({ error: 'Coloader not found.' });
    }

    let selectedAddressDetails = null;
    let coloaderAddressLabel = 'Company Address';
    let coloaderAddressIndex = null;

    if (addressSelection.type === 'company') {
      selectedAddressDetails = coloader.companyAddress;
      coloaderAddressLabel = 'Company Address';
    } else if (addressSelection.type === 'from') {
      const index = Number(addressSelection.index);
      if (Number.isNaN(index) || index < 0 || index >= (coloader.fromLocations || []).length) {
        return res.status(400).json({ error: 'Invalid from address index.' });
      }
      selectedAddressDetails = coloader.fromLocations[index];
      coloaderAddressLabel = `From Address ${index + 1}`;
      coloaderAddressIndex = index;
    } else if (addressSelection.type === 'to') {
      const index = Number(addressSelection.index);
      if (Number.isNaN(index) || index < 0 || index >= (coloader.toLocations || []).length) {
        return res.status(400).json({ error: 'Invalid to address index.' });
      }
      selectedAddressDetails = coloader.toLocations[index];
      coloaderAddressLabel = `To Address ${index + 1}`;
      coloaderAddressIndex = index;
    }

    if (!selectedAddressDetails) {
      return res.status(400).json({ error: 'Selected address details could not be determined.' });
    }

    const uniqueBookingIds = [...new Set(bookingIds.filter(Boolean))];
    const bookings = await CustomerBooking.find({ _id: { $in: uniqueBookingIds } });

    if (!bookings.length) {
      return res.status(404).json({ error: 'No customer bookings found for provided IDs.' });
    }

    const adminName = req.admin.name || req.admin.email || 'Admin';
    const invalidBookings = bookings.filter((booking) => {
      if (!Array.isArray(booking.assigned) || booking.assigned.length === 0) {
        return true;
      }
      const latestAssignment = booking.assigned[booking.assigned.length - 1];
      return !latestAssignment.coloaderId || latestAssignment.coloaderId.toString() !== coloaderId;
    });

    if (invalidBookings.length > 0) {
      return res.status(400).json({
        error: 'One or more customer bookings are not linked with the provided coloader.',
        invalidBookingIds: invalidBookings.map((b) => b._id)
      });
    }

    const assignments = [];
    const coloaderPhone = (coloader.mobileNumbers && coloader.mobileNumbers[0]) || '';

    for (const booking of bookings) {
      const assignedAt = new Date();
      const courierEntry = {
        courierBoyId: courierBoyId,
        courierBoyName: courierBoy.fullName || 'Courier Boy',
        courierBoyEmail: courierBoy.email || '',
        courierBoyPhone: courierBoy.phone || '',
        coloaderId: coloader._id,
        coloaderName: coloader.companyName,
        coloaderPhone,
        coloaderAddressType: addressSelection.type,
        coloaderAddressLabel,
        coloaderAddressDetails: selectedAddressDetails,
        coloaderAddressIndex,
        adminId: req.admin._id,
        adminName,
        adminEmail: req.admin.email || '',
        assignedAt
      };

      if (!Array.isArray(booking.courierboy)) {
        booking.courierboy = [];
      }
      booking.courierboy.push(courierEntry);

      booking.currentStatus = 'courierboy';
      booking.statusHistory.push({
        status: 'courierboy',
        timestamp: assignedAt,
        notes: `Courier boy ${courierEntry.courierBoyName} assigned by ${adminName}`
      });

      await booking.save();
      assignments.push({
        bookingId: booking._id,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference
      });
    }

    res.json({
      success: true,
      message: `Courier boy assigned to ${assignments.length} customer booking(s).`,
      assignments
    });
  } catch (error) {
    console.error('Assign courier boy to customer booking error:', error);
    res.status(500).json({ error: 'Failed to assign courier boy to customer bookings.' });
  }
});

// Scan tracking record and mark as received
router.post('/tracking/scan', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber } = req.body;

    if (!consignmentNumber) {
      return res.status(400).json({ error: 'consignmentNumber is required.' });
    }

    const numericConsignment = Number(consignmentNumber);
    const tracking = await Tracking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      :
      {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found for consignment number.' });
    }

    if (tracking.currentStatus !== 'pickup') {
      return res.status(400).json({
        error: 'Consignment must be in pickup status before marking as received.',
        currentStatus: tracking.currentStatus
      });
    }

    const receivedEntry = {
      adminId: req.admin._id,
      adminName: req.admin.name,
      adminEmail: req.admin.email,
      scannedAt: new Date()
    };

    tracking.currentStatus = 'received';
    tracking.statusHistory.push({
      status: 'received',
      timestamp: new Date(),
      notes: `Order received by ${req.admin.name || req.admin.email}`
    });
    tracking.received = tracking.received || [];
    tracking.received.push(receivedEntry);

    await tracking.save();

    // Attempt to sync FormData record if present
    const formUpdateCriteria = Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : { consignmentNumber: numericConsignment };

    await FormData.findOneAndUpdate(
      formUpdateCriteria,
      { $set: { 'assignmentData.status': 'received' } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Tracking record updated to received.',
      data: tracking.toObject(),
      receivedEntry
    });
  } catch (error) {
    console.error('Tracking scan error:', error);
    res.status(500).json({
      error: 'Failed to update tracking record for consignment.'
    });
  }
});

// Update tracking weight
router.post('/tracking/update-weight', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber, newWeight } = req.body;

    if (!consignmentNumber || newWeight === undefined || newWeight === null) {
      return res.status(400).json({ error: 'consignmentNumber and newWeight are required.' });
    }

    const numericConsignment = Number(consignmentNumber);
    const weightNumber = Number(newWeight);

    if (Number.isNaN(weightNumber) || weightNumber <= 0) {
      return res.status(400).json({ error: 'newWeight must be a positive number.' });
    }

    const tracking = await Tracking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found for consignment number.' });
    }

    const bookingIndex = tracking.booked && tracking.booked.length > 0
      ? tracking.booked.length - 1
      : -1;

    if (bookingIndex === -1) {
      return res.status(400).json({ error: 'Tracking record does not contain booking data to update weight.' });
    }

    tracking.booked[bookingIndex] = tracking.booked[bookingIndex] || {};
    tracking.booked[bookingIndex].shipmentData = tracking.booked[bookingIndex].shipmentData || {};
    tracking.booked[bookingIndex].shipmentData.actualWeight = weightNumber;
    tracking.markModified(`booked.${bookingIndex}.shipmentData`);

    await tracking.save();

    res.json({
      success: true,
      message: 'Tracking weight updated successfully.',
      data: tracking.toObject()
    });
  } catch (error) {
    console.error('Tracking weight update error:', error);
    res.status(500).json({ error: 'Failed to update tracking weight.' });
  }
});

// Update tracking status (e.g., from undelivered to rto or reverse)
router.post('/tracking/update-status', authenticateAdmin, async (req, res) => {
  try {
    const { consignmentNumber, newStatus } = req.body;

    if (!consignmentNumber || !newStatus) {
      return res.status(400).json({ error: 'consignmentNumber and newStatus are required.' });
    }

    // Validate status values
    const validStatuses = ['rto', 'reserve', 'undelivered'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const numericConsignment = Number(consignmentNumber);
    const tracking = await Tracking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found for consignment number.' });
    }

    // Only allow updating from undelivered status
    if (tracking.currentStatus !== 'undelivered') {
      return res.status(400).json({
        error: `Consignment must be in 'undelivered' status to update. Current status: ${tracking.currentStatus}`,
        currentStatus: tracking.currentStatus
      });
    }

    // Update status
    const oldStatus = tracking.currentStatus;
    tracking.currentStatus = newStatus;
    
    // Add to status history
    if (!tracking.statusHistory) {
      tracking.statusHistory = [];
    }
    tracking.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      notes: `Status changed from ${oldStatus} to ${newStatus} by ${req.admin.name || req.admin.email}`
    });

    await tracking.save();

    // Attempt to sync FormData record if present
    const formUpdateCriteria = Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : { consignmentNumber: numericConsignment };

    await FormData.findOneAndUpdate(
      formUpdateCriteria,
      { $set: { 'assignmentData.status': newStatus } },
      { new: true }
    );

    console.log(`✅ Tracking status updated by admin ${req.admin.name}: ${consignmentNumber} from ${oldStatus} to ${newStatus}`);

    res.json({
      success: true,
      message: `Tracking status updated from ${oldStatus} to ${newStatus}.`,
      data: {
        consignmentNumber: tracking.consignmentNumber,
        oldStatus,
        newStatus,
        updatedAt: tracking.updatedAt
      }
    });
  } catch (error) {
    console.error('Update tracking status error:', error);
    res.status(500).json({
      error: 'Failed to update tracking status.'
    });
  }
});

// Update tracking details
router.post('/tracking/update-details', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber, originData, destinationData, shipmentData } = req.body;

    if (!consignmentNumber) {
      return res.status(400).json({ error: 'consignmentNumber is required.' });
    }

    const numericConsignment = Number(consignmentNumber);
    const tracking = await Tracking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found for consignment number.' });
    }

    const bookingIndex = tracking.booked && tracking.booked.length > 0
      ? tracking.booked.length - 1
      : -1;

    if (bookingIndex === -1) {
      return res.status(400).json({ error: 'Tracking record does not contain booking data to update.' });
    }

    // Update origin data
    if (originData) {
      tracking.booked[bookingIndex].originData = {
        ...tracking.booked[bookingIndex].originData,
        ...originData
      };
    }

    // Update destination data
    if (destinationData) {
      tracking.booked[bookingIndex].destinationData = {
        ...tracking.booked[bookingIndex].destinationData,
        ...destinationData
      };
    }

    // Update shipment data
    if (shipmentData) {
      tracking.booked[bookingIndex].shipmentData = {
        ...tracking.booked[bookingIndex].shipmentData,
        ...shipmentData
      };
    }

    tracking.markModified(`booked.${bookingIndex}`);
    await tracking.save();

    res.json({
      success: true,
      message: 'Tracking details updated successfully.',
      data: tracking.toObject()
    });
  } catch (error) {
    console.error('Tracking details update error:', error);
    res.status(500).json({ error: 'Failed to update tracking details.' });
  }
});

// Get CustomerBooking by consignment number
router.get('/customerbookings/consignment/:consignmentNumber', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber } = req.params;
    const numericConsignment = Number(consignmentNumber);

    const booking = await CustomerBooking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    ).lean();

    if (!booking) {
      return res.status(404).json({ error: 'Customer booking not found for consignment number.' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get customer booking by consignment error:', error);
    res.status(500).json({ error: 'Failed to fetch customer booking.' });
  }
});

// Scan CustomerBooking and mark as received
router.post('/customerbookings/scan', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber } = req.body;

    if (!consignmentNumber) {
      return res.status(400).json({ error: 'consignmentNumber is required.' });
    }

    const numericConsignment = Number(consignmentNumber);
    const booking = await CustomerBooking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Customer booking not found for consignment number.' });
    }

    if (booking.currentStatus === 'received') {
      return res.status(400).json({
        error: 'Customer booking is already marked as received.',
        currentStatus: booking.currentStatus
      });
    }

    if (booking.currentStatus !== 'picked') {
      return res.status(400).json({
        error: 'Customer booking must be in picked status before marking as received.',
        currentStatus: booking.currentStatus
      });
    }

    // Update currentStatus to received and add ReceivedAt timestamp
    booking.currentStatus = 'received';
    booking.ReceivedAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Customer booking updated to received.',
      data: booking.toObject()
    });
  } catch (error) {
    console.error('Customer booking scan error:', error);
    res.status(500).json({
      error: 'Failed to update customer booking for consignment.'
    });
  }
});

// Update customer booking details
router.post('/customerbookings/update-details', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { consignmentNumber, origin, destination, shipment, actualWeight } = req.body;

    if (!consignmentNumber) {
      return res.status(400).json({ error: 'consignmentNumber is required.' });
    }

    const numericConsignment = Number(consignmentNumber);
    const booking = await CustomerBooking.findOne(Number.isNaN(numericConsignment)
      ? { consignmentNumber: consignmentNumber }
      : {
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: consignmentNumber }
        ]
      }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Customer booking not found for consignment number.' });
    }

    // Update origin
    if (origin) {
      booking.origin = {
        ...booking.origin,
        ...origin
      };
    }

    // Update destination
    if (destination) {
      booking.destination = {
        ...booking.destination,
        ...destination
      };
    }

    // Update shipment
    if (shipment) {
      booking.shipment = {
        ...booking.shipment,
        ...shipment
      };
    }

    // Update actual weight
    if (actualWeight !== undefined) {
      booking.actualWeight = actualWeight;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Customer booking details updated successfully.',
      data: booking.toObject()
    });
  } catch (error) {
    console.error('Customer booking details update error:', error);
    res.status(500).json({ error: 'Failed to update customer booking details.' });
  }
});

// Mark order as received (optionally update weight)
router.post('/mark-order-received', authenticateAdmin, async (req, res) => {
  // Check permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }
  try {
    const { orderId, newWeight } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required.' });
    }

    const update = { 'assignmentData.status': 'received' };
    if (newWeight !== undefined && newWeight !== null && !Number.isNaN(Number(newWeight))) {
      update['shipmentData.actualWeight'] = Number(newWeight);
    }

    const updated = await FormData.findByIdAndUpdate(
      orderId,
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Address form not found.' });
    }

    res.json({ success: true, message: 'Order marked as received.', data: updated });
  } catch (error) {
    console.error('Mark order received error:', error);
    res.status(500).json({ error: 'Failed to mark order as received.' });
  }
});

// Update address form details
router.post('/addressforms/update-details', authenticateAdmin, async (req, res) => {
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms permission required.'
    });
  }

  try {
    const { orderId, originData, destinationData, shipmentData } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required.' });
    }

    const form = await FormData.findById(orderId);

    if (!form) {
      return res.status(404).json({ error: 'Address form not found.' });
    }

    // Update origin data
    if (originData) {
      form.originData = {
        ...form.originData,
        ...originData
      };
      // Also update legacy sender fields for compatibility
      if (originData.name) form.senderName = originData.name;
      if (originData.city) form.senderCity = originData.city;
      if (originData.state) form.senderState = originData.state;
      if (originData.pincode) form.senderPincode = originData.pincode;
      if (originData.flatBuilding) form.senderAddressLine1 = originData.flatBuilding;
      if (originData.landmark) form.senderLandmark = originData.landmark;
      if (originData.area) form.senderArea = originData.area;
      if (originData.district) form.senderDistrict = originData.district;
    }

    // Update destination data
    if (destinationData) {
      form.destinationData = {
        ...form.destinationData,
        ...destinationData
      };
      // Also update legacy receiver fields for compatibility
      if (destinationData.name) form.receiverName = destinationData.name;
      if (destinationData.city) form.receiverCity = destinationData.city;
      if (destinationData.state) form.receiverState = destinationData.state;
      if (destinationData.pincode) form.receiverPincode = destinationData.pincode;
      if (destinationData.flatBuilding) form.receiverAddressLine1 = destinationData.flatBuilding;
      if (destinationData.landmark) form.receiverLandmark = destinationData.landmark;
      if (destinationData.area) form.receiverArea = destinationData.area;
      if (destinationData.district) form.receiverDistrict = destinationData.district;
    }

    // Update shipment data
    if (shipmentData) {
      form.shipmentData = {
        ...form.shipmentData,
        ...shipmentData
      };
    }

    await form.save();

    res.json({
      success: true,
      message: 'Address form details updated successfully.',
      data: form.toObject()
    });
  } catch (error) {
    console.error('Address form details update error:', error);
    res.status(500).json({ error: 'Failed to update address form details.' });
  }
});

// Get single address form by ID
router.get('/addressforms/:id', authenticateAdmin, async (req, res) => {
  try {
    const form = await FormData.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        error: 'Address form not found.'
      });
    }

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    console.error('Get address form error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid form ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to get address form.' });
    }
  }
});

// Update address form by ID
router.put('/addressforms/:id', authenticateAdmin, async (req, res) => {
  try {
    const updatedForm = await FormData.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedForm) {
      return res.status(404).json({
        error: 'Address form not found.'
      });
    }

    console.log(`✅ Address form updated by admin ${req.admin.name}: ${updatedForm._id}`);

    res.json({
      success: true,
      message: 'Address form updated successfully.',
      data: updatedForm
    });

  } catch (error) {
    console.error('Update address form error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid form ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to update address form.' });
    }
  }
});

// Delete address form by ID
router.delete('/addressforms/:id', authenticateAdmin, async (req, res) => {
  try {
    const deletedForm = await FormData.findByIdAndDelete(req.params.id);

    if (!deletedForm) {
      return res.status(404).json({
        error: 'Address form not found.'
      });
    }

    console.log(`🗑️ Address form deleted by admin ${req.admin.name}: ${deletedForm._id}`);

    res.json({
      success: true,
      message: 'Address form deleted successfully.',
      deletedData: {
        id: deletedForm._id,
        senderName: deletedForm.senderName,
        senderEmail: deletedForm.senderEmail
      }
    });

  } catch (error) {
    console.error('Delete address form error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid form ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to delete address form.' });
    }
  }
});

// Get all pincodes with pagination and search
router.get('/pincodes', authenticateAdmin, async (req, res) => {
  // Check if admin has pincode management permission
  if (!req.admin.hasPermission('pincodeManagement')) {
    return res.status(403).json({
      error: 'Access denied. Pincode management permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchConditions = [
        { areaname: searchRegex },
        { cityname: searchRegex },
        { statename: searchRegex },
        { distrcitname: searchRegex } // Note: using the typo that exists in the model
      ];

      // If search term is numeric, also search by pincode
      if (!isNaN(search)) {
        searchConditions.push({ pincode: parseInt(search) });
      }

      query = { $or: searchConditions };
    }

    // Add filters
    if (req.query.state) {
      query.statename = new RegExp(req.query.state, 'i');
    }

    if (req.query.city) {
      query.cityname = new RegExp(req.query.city, 'i');
    }

    const pincodes = await PinCodeArea.find(query)
      .sort({ pincode: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await PinCodeArea.countDocuments(query);

    res.json({
      success: true,
      data: pincodes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      },
      search: search
    });

  } catch (error) {
    console.error('Get pincodes error:', error);
    res.status(500).json({
      error: 'Failed to get pincodes.'
    });
  }
});

// Add new pincode
router.post('/pincodes', authenticateAdmin, async (req, res) => {
  try {
    const { pincode, areaname, cityname, districtname, statename, serviceable, bulkOrder, priority, standard, modes } = req.body;

    // Validate required fields
    if (!pincode || !areaname || !cityname || !statename) {
      return res.status(400).json({
        error: 'Pincode, area name, city name, and state name are required.'
      });
    }

    // Check if pincode already exists
    const existingPincode = await PinCodeArea.findOne({
      pincode: parseInt(pincode),
      areaname: areaname.trim(),
      cityname: cityname.trim()
    });

    if (existingPincode) {
      return res.status(409).json({
        error: 'This pincode area combination already exists.'
      });
    }

    const newPincode = new PinCodeArea({
      pincode: parseInt(pincode),
      areaname: areaname.trim(),
      cityname: cityname.trim(),
      distrcitname: districtname?.trim() || cityname.trim(), // Note: using the typo that exists in the model
      statename: statename.trim(),
      serviceable: typeof serviceable === 'boolean' ? serviceable : false,
      bulkOrder: typeof bulkOrder === 'boolean' ? bulkOrder : false,
      priority: typeof priority === 'boolean' ? priority : false,
      standard: typeof standard === 'boolean' ? standard : false,
      modes: {
        byAir: typeof modes?.byAir === 'boolean' ? modes.byAir : false,
        byTrain: typeof modes?.byTrain === 'boolean' ? modes.byTrain : false,
        byRoad: typeof modes?.byRoad === 'boolean' ? modes.byRoad : false
      }
    });

    await newPincode.save();

    console.log(`✅ Pincode added by admin ${req.admin.name}: ${newPincode.pincode} - ${newPincode.areaname}`);

    res.json({
      success: true,
      message: 'Pincode added successfully.',
      data: newPincode
    });

  } catch (error) {
    console.error('Add pincode error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.code === 11000) {
      res.status(409).json({
        error: 'Duplicate pincode entry detected.'
      });
    } else {
      res.status(500).json({ error: 'Failed to add pincode.' });
    }
  }
});

// Update pincode by ID
router.put('/pincodes/:id', authenticateAdmin, async (req, res) => {
  try {
    const updateBody = { ...req.body };
    if (typeof updateBody.pincode !== 'undefined') {
      updateBody.pincode = parseInt(updateBody.pincode);
    }
    if (typeof updateBody.areaname === 'string') updateBody.areaname = updateBody.areaname.trim();
    if (typeof updateBody.cityname === 'string') updateBody.cityname = updateBody.cityname.trim();
    if (typeof updateBody.districtname === 'string' || typeof updateBody.distrcitname === 'string') {
      updateBody.distrcitname = (updateBody.districtname || updateBody.distrcitname).trim();
      delete updateBody.districtname;
    }
    if (typeof updateBody.statename === 'string') updateBody.statename = updateBody.statename.trim();

    // Handle modes field
    if (updateBody.modes) {
      updateBody.modes = {
        byAir: typeof updateBody.modes.byAir === 'boolean' ? updateBody.modes.byAir : false,
        byTrain: typeof updateBody.modes.byTrain === 'boolean' ? updateBody.modes.byTrain : false,
        byRoad: typeof updateBody.modes.byRoad === 'boolean' ? updateBody.modes.byRoad : false
      };
    }

    const updatedPincode = await PinCodeArea.findByIdAndUpdate(
      req.params.id,
      updateBody,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedPincode) {
      return res.status(404).json({
        error: 'Pincode not found.'
      });
    }

    console.log(`✅ Pincode updated by admin ${req.admin.name}: ${updatedPincode.pincode} - ${updatedPincode.areaname}`);

    res.json({
      success: true,
      message: 'Pincode updated successfully.',
      data: updatedPincode
    });

  } catch (error) {
    console.error('Update pincode error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pincode ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to update pincode.' });
    }
  }
});

// Bulk update pincode bulk order status
router.patch('/pincodes/bulk-order', authenticateAdmin, async (req, res) => {
  try {
    const { pincodeIds, bulkOrder } = req.body;

    if (!Array.isArray(pincodeIds) || pincodeIds.length === 0) {
      return res.status(400).json({
        error: 'pincodeIds array is required and cannot be empty.'
      });
    }

    if (typeof bulkOrder !== 'boolean') {
      return res.status(400).json({
        error: 'bulkOrder must be a boolean value.'
      });
    }

    const result = await PinCodeArea.updateMany(
      { _id: { $in: pincodeIds } },
      { bulkOrder: bulkOrder }
    );

    console.log(`✅ Bulk order status updated by admin ${req.admin.name}: ${result.modifiedCount} pincodes`);

    res.json({
      success: true,
      message: `Bulk order status updated for ${result.modifiedCount} pincodes.`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update bulk order error:', error);
    res.status(500).json({ error: 'Failed to update bulk order status.' });
  }
});

// Delete pincode by ID
router.delete('/pincodes/:id', authenticateAdmin, async (req, res) => {
  try {
    const deletedPincode = await PinCodeArea.findByIdAndDelete(req.params.id);

    if (!deletedPincode) {
      return res.status(404).json({
        error: 'Pincode not found.'
      });
    }

    console.log(`🗑️ Pincode deleted by admin ${req.admin.name}: ${deletedPincode.pincode} - ${deletedPincode.areaname}`);

    res.json({
      success: true,
      message: 'Pincode deleted successfully.',
      deletedData: {
        id: deletedPincode._id,
        pincode: deletedPincode.pincode,
        areaname: deletedPincode.areaname
      }
    });

  } catch (error) {
    console.error('Delete pincode error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pincode ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to delete pincode.' });
    }
  }
});

// ADMIN MANAGEMENT ROUTES (Super Admin Only)

// Get all admins
router.get('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };
    }

    const admins = await Admin.find(query)
      .populate('assignedBy', 'name email')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Admin.countDocuments(query);

    res.json({
      success: true,
      data: admins,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      error: 'Failed to get admins.'
    });
  }
});

// Create new admin (assign admin role to office user)
router.post('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { userId, permissions, canAssignPermissions } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required.'
      });
    }

    // Find the office user
    const officeUser = await OfficeUser.findById(userId);
    if (!officeUser) {
      return res.status(404).json({
        error: 'Office user not found.'
      });
    }

    // Check if user is already an admin
    const existingAdmin = await Admin.findOne({ email: officeUser.email });
    if (existingAdmin) {
      return res.status(409).json({
        error: 'This user is already an admin.'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      email: officeUser.email,
      password: officeUser.password, // Use existing password
      name: officeUser.name,
      role: 'admin',
      permissions: {
        dashboard: true, // Always true - default permission
        userManagement: permissions?.userManagement || false,
        pincodeManagement: permissions?.pincodeManagement || false,
        addressForms: permissions?.addressForms || false,
        coloaderRegistration: permissions?.coloaderRegistration || false,
        reports: true, // Always true - default permission
        settings: true // Always true - default permission
      },
      canAssignPermissions: canAssignPermissions || false,
      assignedBy: req.admin._id
    });

    await newAdmin.save();

    console.log(`✅ Admin role assigned by super admin ${req.admin.name}: ${newAdmin.name} (${newAdmin.email})`);

    res.json({
      success: true,
      message: 'Admin role assigned successfully.',
      data: newAdmin
    });

  } catch (error) {
    console.error('Create admin error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.code === 11000) {
      res.status(409).json({
        error: 'Admin with this email already exists.'
      });
    } else {
      res.status(500).json({ error: 'Failed to assign admin role.' });
    }
  }
});

// Update admin permissions
router.put('/admins/:id/permissions', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { permissions, canAssignPermissions } = req.body;
    const adminId = req.params.id;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        error: 'Permissions object is required.'
      });
    }

    // Ensure dashboard, reports, and settings are always true
    const updatedPermissions = {
      ...permissions,
      dashboard: true, // Always true - default permission
      reports: true, // Always true - default permission
      settings: true // Always true - default permission
    };

    const updateData = { permissions: updatedPermissions };
    if (typeof canAssignPermissions === 'boolean') {
      updateData.canAssignPermissions = canAssignPermissions;
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        error: 'Admin not found.'
      });
    }

    console.log(`✅ Admin permissions updated by super admin ${req.admin.name}: ${admin.name} (${admin.email})`);

    res.json({
      success: true,
      message: 'Admin permissions updated successfully.',
      data: admin
    });

  } catch (error) {
    console.error('Update admin permissions error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid admin ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to update admin permissions.'
      });
    }
  }
});

// Remove admin role (convert back to office user)
router.delete('/admins/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        error: 'Admin not found.'
      });
    }

    // Don't allow deleting super admin
    if (admin.role === 'super_admin') {
      return res.status(403).json({
        error: 'Cannot remove super admin role.'
      });
    }

    // Delete the admin record
    await Admin.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Admin role removed by super admin ${req.admin.name}: ${admin.name} (${admin.email})`);

    res.json({
      success: true,
      message: 'Admin role removed successfully.',
      deletedData: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Remove admin role error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid admin ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to remove admin role.'
      });
    }
  }
});

// OFFICE USER MANAGEMENT ROUTES

// Get all office users
router.get('/users', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if admin has user management permission
  if (!req.admin.hasPermission('userManagement')) {
    return res.status(403).json({
      error: 'Access denied. User management permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { department: searchRegex }
        ]
      };
    }

    // Get all admin emails to exclude them from office users list
    // Users who have admin privileges should only appear in Admin Management, not User Management
    const Admin = (await import('../models/Admin.js')).default;
    const adminEmails = await Admin.find({ isActive: true }).select('email').lean();
    const adminEmailList = adminEmails.map(admin => admin.email);

    // Add exclusion for users who are also admins
    query.email = { $nin: adminEmailList };

    const users = await OfficeUser.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch employee designations for users
    const Employee = (await import('../models/Employee.js')).default;
    const userEmails = users.map(user => user.email);
    const employees = await Employee.find({ email: { $in: userEmails } })
      .select('email designation')
      .lean();

    // Create a map of email to designation
    const designationMap = {};
    employees.forEach(emp => {
      designationMap[emp.email.toLowerCase()] = emp.designation;
    });

    // Add designation to each user
    const usersWithDesignation = users.map(user => ({
      ...user,
      designation: designationMap[user.email.toLowerCase()] || null
    }));

    const totalCount = await OfficeUser.countDocuments(query);

    res.json({
      success: true,
      data: usersWithDesignation,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Get office users error:', error);
    res.status(500).json({
      error: 'Failed to get office users.'
    });
  }
});

// Get single office user by ID
router.get('/users/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if admin has user management permission
  if (!req.admin.hasPermission('userManagement')) {
    return res.status(403).json({
      error: 'Access denied. User management permission required.'
    });
  }
  try {
    const user = await OfficeUser.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get office user error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to get user.' });
    }
  }
});

// Update user permissions
router.put('/users/:id/permissions', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if admin has user management permission and can assign permissions
  if (!req.admin.hasPermission('userManagement') || !req.admin.canAssignPermissionsToUsers()) {
    return res.status(403).json({
      error: 'Access denied. User management and permission assignment required.'
    });
  }
  try {
    const { permissions } = req.body;
    const userId = req.params.id;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        error: 'Permissions object is required.'
      });
    }

    const user = await OfficeUser.findByIdAndUpdate(
      userId,
      {
        permissions,
        permissionsUpdatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    console.log(`✅ User permissions updated by admin ${req.admin.name}: ${user.name} (${user.email})`);

    res.json({
      success: true,
      message: 'User permissions updated successfully.',
      data: user
    });

  } catch (error) {
    console.error('Update user permissions error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to update user permissions.'
      });
    }
  }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if admin has user management permission
  if (!req.admin.hasPermission('userManagement')) {
    return res.status(403).json({
      error: 'Access denied. User management permission required.'
    });
  }
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive must be a boolean value.'
      });
    }

    const user = await OfficeUser.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    console.log(`✅ User status updated by admin ${req.admin.name}: ${user.name} (${user.email}) - ${isActive ? 'Activated' : 'Deactivated'}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to update user status.'
      });
    }
  }
});

// Delete office user
router.delete('/users/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if admin has user management permission
  if (!req.admin.hasPermission('userManagement')) {
    return res.status(403).json({
      error: 'Access denied. User management permission required.'
    });
  }
  try {
    const deletedUser = await OfficeUser.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    console.log(`🗑️ Office user deleted by admin ${req.admin.name}: ${deletedUser.name} (${deletedUser.email})`);

    res.json({
      success: true,
      message: 'User deleted successfully.',
      deletedData: {
        id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email
      }
    });

  } catch (error) {
    console.error('Delete office user error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to delete user.'
      });
    }
  }
});

// ==================== COLOADER MANAGEMENT ROUTES ====================

// Get all coloaders with filtering and pagination (Admin)
router.get('/coloaders', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has coloader registration permission
  if (!req.admin.hasPermission('coloaderRegistration')) {
    return res.status(403).json({
      error: 'Access denied. Coloader registration permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};
    const orConditions = [];

    // Add search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      orConditions.push(
        { companyName: searchRegex },
        { concernPerson: searchRegex },
        { email: searchRegex },
        { 'companyAddress.state': searchRegex },
        { 'companyAddress.city': searchRegex }
      );
    }

    // Add origin filter
    if (req.query.origin) {
      const originRegex = new RegExp(req.query.origin, 'i');
      orConditions.push(
        { 'fromLocations.state': originRegex },
        { 'fromLocations.city': originRegex },
        { 'fromLocations.area': originRegex },
        { 'fromLocations.pincode': originRegex },
        { 'companyAddress.state': originRegex },
        { 'companyAddress.city': originRegex },
        { 'companyAddress.area': originRegex },
        { 'companyAddress.pincode': originRegex }
      );
    }

    // Add destination filter
    if (req.query.destination) {
      const destinationRegex = new RegExp(req.query.destination, 'i');
      orConditions.push(
        { 'toLocations.state': destinationRegex },
        { 'toLocations.city': destinationRegex },
        { 'toLocations.area': destinationRegex },
        { 'toLocations.pincode': destinationRegex }
      );
    }

    // Apply OR conditions if any exist
    if (orConditions.length > 0) {
      filters.$or = orConditions;
    }

    // Add other filters based on query parameters
    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.active === 'true') {
      filters.isActive = true;
    } else if (req.query.active === 'false') {
      filters.isActive = false;
    }

    if (req.query.state) {
      filters['companyAddress.state'] = new RegExp(req.query.state, 'i');
    }

    if (req.query.city) {
      filters['companyAddress.city'] = new RegExp(req.query.city, 'i');
    }

    if (req.query.serviceMode) {
      filters.serviceModes = req.query.serviceMode;
    }

    const coloaders = await Coloader.find(filters)
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Coloader.countDocuments(filters);

    res.json({
      success: true,
      data: coloaders,
      count: coloaders.length,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (err) {
    console.error('Error fetching coloader data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update coloader by ID (Admin)
router.put('/coloaders/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has coloader registration permission
  if (!req.admin.hasPermission('coloaderRegistration')) {
    return res.status(403).json({
      error: 'Access denied. Coloader registration permission required.'
    });
  }
  try {
    const { status, rejectionReason, notes, approvedBy, ...coloaderData } = req.body;

    const updateData = { ...coloaderData };

    // Handle status-specific updates
    if (status) {
      updateData.status = status;

      if (status === 'approved') {
        updateData.approvedBy = approvedBy || req.admin._id;
        updateData.approvedAt = new Date();
        updateData.rejectionReason = null;
      } else if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
        updateData.approvedBy = null;
        updateData.approvedAt = null;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedColoader = await Coloader.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedColoader) {
      return res.status(404).json({
        error: 'Coloader registration not found'
      });
    }

    console.log('Coloader data updated successfully:', updatedColoader.coloaderId);
    res.json({
      success: true,
      data: updatedColoader,
      message: 'Coloader data updated successfully!',
      completionPercentage: updatedColoader.getCompletionPercentage()
    });

  } catch (err) {
    console.error('Error updating coloader data:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid coloader ID format' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete coloader by ID (Admin)
router.delete('/coloaders/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has coloader registration permission
  if (!req.admin.hasPermission('coloaderRegistration')) {
    return res.status(403).json({
      error: 'Access denied. Coloader registration permission required.'
    });
  }
  try {
    const deletedColoader = await Coloader.findByIdAndDelete(req.params.id);

    if (!deletedColoader) {
      return res.status(404).json({
        error: 'Coloader registration not found'
      });
    }

    console.log('Coloader registration deleted successfully:', deletedColoader.coloaderId);
    res.json({
      success: true,
      message: 'Coloader registration deleted successfully!',
      deletedData: deletedColoader
    });

  } catch (err) {
    console.error('Error deleting coloader registration:', err);
    if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid coloader ID format' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ==================== ORDER ASSIGNMENT ROUTES ====================

// Assign coloader to order
router.post('/assign-coloader', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has address forms permission (more appropriate for order management)
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms management permission required.'
    });
  }

  try {
    const { consignmentNumber, coloaderId, legNumber = 1, totalLegs = 1, isEditMode = false } = req.body;

    // Validate required fields
    if (!consignmentNumber || !coloaderId) {
      return res.status(400).json({
        error: 'Consignment Number and Coloader ID are required.'
      });
    }

    // Import models
    const Coloader = (await import('../models/Coloader.js')).default;
    const Tracking = (await import('../models/Tracking.js')).default;
    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;

    // Check if coloader exists
    const coloader = await Coloader.findById(coloaderId);
    if (!coloader) {
      return res.status(404).json({
        error: 'Coloader not found.'
      });
    }

    // Check if coloader is active
    if (!coloader.isActive) {
      return res.status(400).json({
        error: 'Cannot assign to inactive coloader.'
      });
    }

    // Try to find in Tracking first
    let tracking = await Tracking.findOne({ consignmentNumber: consignmentNumber });
    let isCustomerBooking = false;
    let customerBooking = null;

    // If not found in Tracking, try CustomerBooking
    if (!tracking) {
      customerBooking = await CustomerBooking.findOne({ consignmentNumber: consignmentNumber });
      if (!customerBooking) {
        return res.status(404).json({
          error: 'Order not found for this consignment number.'
        });
      }
      isCustomerBooking = true;
    }

    // Helper function to add assignment
    const addAssignment = (record, isEditMode, legNumber, totalLegs, coloaderId, coloader, admin) => {
      if (!record.assigned) {
        record.assigned = [];
      }

      if (isEditMode) {
        // In edit mode, update existing assignment for this leg
        const existingIndex = record.assigned.findIndex(a => a.legNumber === legNumber);
        if (existingIndex >= 0) {
          // Update existing leg assignment
          record.assigned[existingIndex] = {
            coloaderId: coloaderId,
            coloaderName: coloader.companyName,
            coloaderPhone: coloader.mobileNumbers?.[0] || '',
            adminId: admin._id,
            adminName: admin.name,
            assignedAt: new Date(),
            legNumber: legNumber,
            totalLegs: totalLegs,
            notes: `Updated assignment to ${coloader.companyName}`,
            currentAssignment: ASSIGNMENT_STATES.ASSIGNED_PATH
          };
        } else {
          // Add new leg assignment
          record.assigned.push({
            coloaderId: coloaderId,
            coloaderName: coloader.companyName,
            coloaderPhone: coloader.mobileNumbers?.[0] || '',
            adminId: admin._id,
            adminName: admin.name,
            assignedAt: new Date(),
            legNumber: legNumber,
            totalLegs: totalLegs,
            notes: `Assigned to ${coloader.companyName}`,
            currentAssignment: ASSIGNMENT_STATES.ASSIGNED_PATH
          });
        }
      } else {
        // Normal assignment - add to assigned array
        record.assigned.push({
          coloaderId: coloaderId,
          coloaderName: coloader.companyName,
          coloaderPhone: coloader.mobileNumbers?.[0] || '',
          adminId: admin._id,
          adminName: admin.name,
          assignedAt: new Date(),
          legNumber: legNumber,
          totalLegs: totalLegs,
          notes: `Assigned to ${coloader.companyName}`,
          currentAssignment: ASSIGNMENT_STATES.ASSIGNED_PATH
        });
      }
    };

    // Add assignment to the appropriate record
    if (isCustomerBooking) {
      addAssignment(customerBooking, isEditMode, legNumber, totalLegs, coloaderId, coloader, req.admin);

      // Update currentStatus to 'assigned' when first leg is assigned
      if (customerBooking.currentStatus === 'received') {
        customerBooking.currentStatus = 'assigned';
      }

      // Initialize statusHistory if it doesn't exist
      if (!customerBooking.statusHistory) {
        customerBooking.statusHistory = [];
      }

      // Add to status history
      customerBooking.statusHistory.push({
        status: 'assigned',
        timestamp: new Date(),
        notes: `Assigned to coloader: ${coloader.companyName} (Leg ${legNumber}/${totalLegs})`
      });

      await customerBooking.save();
      console.log(`✅ CustomerBooking updated: ${consignmentNumber} -> assigned`);

      console.log(`✅ Consignment ${consignmentNumber} assigned to coloader ${coloader.companyName} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'Coloader assigned successfully.',
        data: {
          consignmentNumber: consignmentNumber,
          coloaderName: coloader.companyName,
          assignedAt: new Date(),
          status: customerBooking.currentStatus,
          source: 'customerbooking'
        }
      });
    } else {
      addAssignment(tracking, isEditMode, legNumber, totalLegs, coloaderId, coloader, req.admin);

      // Update currentStatus to 'assigned' when first leg is assigned
      if (tracking.currentStatus === 'received') {
        tracking.currentStatus = 'assigned';
      }

      // Add to status history
      tracking.statusHistory.push({
        status: 'assigned',
        timestamp: new Date(),
        notes: `Assigned to coloader: ${coloader.companyName} (Leg ${legNumber}/${totalLegs})`
      });

      await tracking.save();
      console.log(`✅ Tracking updated: ${consignmentNumber} -> assigned`);

      console.log(`✅ Consignment ${consignmentNumber} assigned to coloader ${coloader.companyName} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'Coloader assigned successfully.',
        data: {
          consignmentNumber: consignmentNumber,
          coloaderName: coloader.companyName,
          assignedAt: new Date(),
          status: tracking.currentStatus,
          source: 'tracking'
        }
      });
    }

  } catch (error) {
    console.error('Assign coloader error:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({
        error: 'Failed to assign coloader.',
        details: error.message
      });
    }
  }
});

// Remove assignment (single leg or specific leg from multi-leg)
router.post('/remove-assignment', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has address forms permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms management permission required.'
    });
  }

  try {
    const { orderId, legNumber } = req.body;

    // Validate required fields
    if (!orderId || !legNumber) {
      return res.status(400).json({
        error: 'Order ID and Leg Number are required.'
      });
    }

    // Import models
    const Tracking = (await import('../models/Tracking.js')).default;
    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;

    // Try to find in Tracking first
    let tracking = await Tracking.findById(orderId);
    let isCustomerBooking = false;
    let customerBooking = null;

    // If not found in Tracking, try CustomerBooking
    if (!tracking) {
      customerBooking = await CustomerBooking.findById(orderId);
      if (!customerBooking) {
        return res.status(404).json({
          error: 'Order not found.'
        });
      }
      isCustomerBooking = true;
    }

    // Helper function to remove assignment
    const removeAssignment = (record) => {
      if (record.assigned && record.assigned.length > 0) {
        record.assigned = record.assigned.filter(a => a.legNumber !== legNumber);

        // Update status if no assignments left
        if (record.assigned.length === 0) {
          record.currentStatus = 'received';

          // Initialize statusHistory if it doesn't exist
          if (!record.statusHistory) {
            record.statusHistory = [];
          }

          // Add status history
          record.statusHistory.push({
            status: 'received',
            timestamp: new Date(),
            notes: `Assignment removed by ${req.admin.name}`
          });
        }
      }
    };

    if (isCustomerBooking) {
      removeAssignment(customerBooking);
      await customerBooking.save();
      console.log(`✅ Assignment removed from customerBooking ${orderId} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'Assignment removed successfully.',
        data: {
          orderId: customerBooking._id,
          remainingAssignments: customerBooking.assigned?.length || 0,
          status: customerBooking.currentStatus,
          source: 'customerbooking'
        }
      });
    } else {
      removeAssignment(tracking);
      await tracking.save();
      console.log(`✅ Assignment removed from tracking ${orderId} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'Assignment removed successfully.',
        data: {
          orderId: tracking._id,
          remainingAssignments: tracking.assigned?.length || 0,
          status: tracking.currentStatus,
          source: 'tracking'
        }
      });
    }

  } catch (error) {
    console.error('Remove assignment error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to remove assignment.' });
    }
  }
});

// Clear all assignments for an order
router.post('/clear-all-assignments', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has address forms permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms management permission required.'
    });
  }

  try {
    const { orderId } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required.'
      });
    }

    // Import models
    const Tracking = (await import('../models/Tracking.js')).default;
    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;

    // Try to find in Tracking first
    let tracking = await Tracking.findById(orderId);
    let isCustomerBooking = false;
    let customerBooking = null;

    // If not found in Tracking, try CustomerBooking
    if (!tracking) {
      customerBooking = await CustomerBooking.findById(orderId);
      if (!customerBooking) {
        return res.status(404).json({
          error: 'Order not found.'
        });
      }
      isCustomerBooking = true;
    }

    // Helper function to clear all assignments
    const clearAllAssignments = (record) => {
      record.assigned = [];
      record.currentStatus = 'received';

      // Initialize statusHistory if it doesn't exist
      if (!record.statusHistory) {
        record.statusHistory = [];
      }

      // Add status history
      record.statusHistory.push({
        status: 'received',
        timestamp: new Date(),
        notes: `All assignments cleared by ${req.admin.name}`
      });
    };

    if (isCustomerBooking) {
      clearAllAssignments(customerBooking);
      await customerBooking.save();
      console.log(`✅ All assignments cleared from customerBooking ${orderId} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'All assignments cleared successfully.',
        data: {
          orderId: customerBooking._id,
          status: customerBooking.currentStatus,
          source: 'customerbooking'
        }
      });
    } else {
      clearAllAssignments(tracking);
      await tracking.save();
      console.log(`✅ All assignments cleared from tracking ${orderId} by admin ${req.admin.name}`);

      res.json({
        success: true,
        message: 'All assignments cleared successfully.',
        data: {
          orderId: tracking._id,
          status: tracking.currentStatus,
          source: 'tracking'
        }
      });
    }

  } catch (error) {
    console.error('Clear all assignments error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to clear assignments.' });
    }
  }
});

// Complete assignment (mark as completed)
router.post('/complete-assignment', authenticateAdminOrOfficeAdmin, async (req, res) => {
  // Check if user has address forms permission
  if (!req.admin.hasPermission('addressForms')) {
    return res.status(403).json({
      error: 'Access denied. Address forms management permission required.'
    });
  }

  try {
    const { orderId, trackingId, consignmentNumber, completedAt } = req.body || {};

    if (!orderId && !trackingId && (consignmentNumber === undefined || consignmentNumber === null)) {
      return res.status(400).json({
        error: 'Tracking ID or consignmentNumber is required.'
      });
    }

    // Import models
    const Tracking = (await import('../models/Tracking.js')).default;
    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;

    let trackingQuery = {};
    if (consignmentNumber !== undefined && consignmentNumber !== null) {
      const numericConsignment = Number(consignmentNumber);
      trackingQuery = Number.isNaN(numericConsignment)
        ? { consignmentNumber: consignmentNumber }
        : {
          $or: [
            { consignmentNumber: numericConsignment },
            { consignmentNumber: consignmentNumber }
          ]
        };
    } else {
      trackingQuery = { _id: trackingId || orderId };
    }

    // Try to find in Tracking first
    let tracking = await Tracking.findOne(trackingQuery);
    let isCustomerBooking = false;
    let customerBooking = null;

    // If not found in Tracking, try CustomerBooking
    if (!tracking) {
      customerBooking = await CustomerBooking.findOne(trackingQuery);
      if (!customerBooking) {
        return res.status(404).json({
          error: 'Order not found.'
        });
      }
      isCustomerBooking = true;
    }

    const record = isCustomerBooking ? customerBooking : tracking;

    if (!record.assigned || record.assigned.length === 0) {
      return res.status(400).json({
        error: 'No coloader assignments found for this consignment.'
      });
    }

    let updatedLegs = 0;
    record.assigned.forEach(assignment => {
      if (assignment.currentAssignment !== ASSIGNMENT_STATES.COMPLETED) {
        assignment.currentAssignment = ASSIGNMENT_STATES.COMPLETED;
        updatedLegs += 1;
      }
    });

    if (updatedLegs === 0) {
      return res.json({
        success: true,
        message: 'Assignment already marked as completed.',
        data: {
          consignmentNumber: record.consignmentNumber,
          updatedLegs,
          source: isCustomerBooking ? 'customerbooking' : 'tracking'
        }
      });
    }

    // Update current status to reached-hub
    record.currentStatus = 'reached-hub';

    // Add to reachedHub array (for both Tracking and CustomerBooking)
    if (!record.reachedHub) {
      record.reachedHub = [];
    }
    record.reachedHub.push({
      adminId: req.admin._id,
      adminName: req.admin.name,
      adminEmail: req.admin.email,
      timestamp: completedAt ? new Date(completedAt) : new Date(),
      notes: `Marked as reached hub by ${req.admin.name}`
    });

    // Initialize statusHistory if it doesn't exist
    if (!record.statusHistory) {
      record.statusHistory = [];
    }

    // Add to status history
    record.statusHistory.push({
      status: 'reached-hub',
      timestamp: completedAt ? new Date(completedAt) : new Date(),
      notes: `Assignment completed and marked as reached-hub by ${req.admin.name}`
    });

    // Also keep the assigned_completed history for backward compatibility/granularity if needed
    record.statusHistory.push({
      status: 'assigned_completed',
      timestamp: completedAt ? new Date(completedAt) : new Date(),
      notes: `Assignment marked as completed by ${req.admin.name}`
    });

    await record.save();

    console.log(`✅ Consignment ${record.consignmentNumber} marked as reached-hub by admin ${req.admin.name} (${isCustomerBooking ? 'CustomerBooking' : 'Tracking'})`);

    res.json({
      success: true,
      message: 'Assignment completed and marked as reached-hub successfully.',
      data: {
        consignmentNumber: record.consignmentNumber,
        updatedLegs,
        status: 'reached-hub',
        source: isCustomerBooking ? 'customerbooking' : 'tracking'
      }
    });

  } catch (error) {
    console.error('Complete assignment error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to complete assignment.' });
    }
  }
});

// ==================== CORPORATE PRICING MANAGEMENT ROUTES ====================

// Test route to verify the endpoint is working
router.get('/corporate-pricing-test', authenticateAdmin, async (req, res) => {
  try {
    console.log('Corporate pricing test endpoint hit');
    res.json({
      success: true,
      message: 'Corporate pricing endpoint is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// Create new corporate pricing
router.post('/corporate-pricing', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      doxPricing,
      nonDoxSurfacePricing,
      nonDoxAirPricing,
      priorityPricing,
      reversePricing,
      fuelChargePercentage,
      clientEmail,
      clientName,
      clientCompany,
      sendEmailApproval
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Pricing name is required.'
      });
    }

    // Check if pricing name already exists
    const existingPricing = await CorporatePricing.findOne({
      name: name.trim(),
      status: { $in: ['pending', 'approved'] }
    });

    if (existingPricing) {
      return res.status(409).json({
        error: 'A pricing list with this name already exists.'
      });
    }

    const newPricing = new CorporatePricing({
      name: name.trim(),
      doxPricing: doxPricing || {},
      nonDoxSurfacePricing: nonDoxSurfacePricing || {},
      nonDoxAirPricing: nonDoxAirPricing || {},
      priorityPricing: priorityPricing || {},
      reversePricing: reversePricing || {},
      fuelChargePercentage: fuelChargePercentage || 15,
      clientEmail: clientEmail || null,
      clientName: clientName || null,
      clientCompany: clientCompany || null,
      createdBy: req.admin._id,
      status: 'pending'
    });

    await newPricing.save();

    // Send email approval if requested and email is provided
    let emailResult = null;
    if (sendEmailApproval && clientEmail) {
      try {
        console.log('📧 Attempting to send pricing approval email...');

        // Import email service with error handling
        let emailService;
        try {
          emailService = (await import('../services/emailService.js')).default;
        } catch (importError) {
          console.error('❌ Failed to import email service:', importError);
          throw new Error('Email service not available');
        }

        // Generate approval token
        const approvalToken = newPricing.generateApprovalToken();
        await newPricing.save();

        // Generate approval URLs
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const approvalUrl = `${baseUrl}/pricing-approval/${approvalToken}/approve`;
        const rejectionUrl = `${baseUrl}/pricing-approval/${approvalToken}/reject`;

        console.log('📧 Sending email to:', clientEmail);

        // Send email
        emailResult = await emailService.sendPricingApprovalEmail(
          newPricing.toObject(),
          approvalUrl,
          rejectionUrl
        );

        // Mark email as sent
        await newPricing.markEmailSent();

        console.log(`✅ Pricing approval email sent to ${clientEmail} for pricing: ${newPricing.name}`);
      } catch (emailError) {
        console.error('❌ Failed to send pricing approval email:', emailError);
        console.error('❌ Email error details:', emailError.message);
        console.error('❌ Email error stack:', emailError.stack);

        // Don't fail the entire request if email fails
        emailResult = {
          error: emailError.message,
          success: false
        };

        // Still log the pricing creation as successful
        console.log(`⚠️ Pricing created successfully but email failed: ${newPricing.name}`);
      }
    }

    console.log(`✅ Corporate pricing created by admin ${req.admin.name}: ${newPricing.name}`);

    res.json({
      success: true,
      message: sendEmailApproval && clientEmail
        ? 'Corporate pricing created and approval email sent successfully!'
        : 'Corporate pricing created successfully. It will be sent to corporate clients for approval.',
      data: newPricing,
      emailResult: emailResult
    });

  } catch (error) {
    console.error('Create corporate pricing error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({ error: 'Failed to create corporate pricing.' });
    }
  }
});

// Get all corporate pricing with pagination and search
router.get('/corporate-pricing', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: searchRegex }
        ]
      };
    }

    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // If requesting approved pricing for registration, exclude already assigned ones
    if (req.query.status === 'approved' && req.query.excludeAssigned === 'true') {
      query.corporateClient = null;
      console.log('🔍 Filtering for unassigned approved pricing:', query);
    }

    const pricing = await CorporatePricing.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('corporateClient', 'companyName corporateId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await CorporatePricing.countDocuments(query);

    // Debug logging for unassigned pricing requests
    if (req.query.status === 'approved' && req.query.excludeAssigned === 'true') {
      console.log(`📊 Found ${pricing.length} unassigned approved pricing records out of ${totalCount} total`);
      pricing.forEach(p => console.log(`  - ${p.name} (ID: ${p._id})`));
    }

    res.json({
      success: true,
      data: pricing,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      },
      search: search
    });

  } catch (error) {
    console.error('Get corporate pricing error:', error);
    res.status(500).json({
      error: 'Failed to get corporate pricing.'
    });
  }
});

// Get single corporate pricing by ID
router.get('/corporate-pricing/:id', authenticateAdmin, async (req, res) => {
  try {
    const pricing = await CorporatePricing.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('corporateClient', 'companyName corporateId')
      .lean();

    if (!pricing) {
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    res.json({
      success: true,
      data: pricing
    });

  } catch (error) {
    console.error('Get corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to get corporate pricing.' });
    }
  }
});

// Update corporate pricing by ID
router.put('/corporate-pricing/:id', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      doxPricing,
      nonDoxSurfacePricing,
      nonDoxAirPricing,
      priorityPricing,
      reversePricing,
      fuelChargePercentage,
      notes
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (doxPricing !== undefined) updateData.doxPricing = doxPricing;
    if (nonDoxSurfacePricing !== undefined) updateData.nonDoxSurfacePricing = nonDoxSurfacePricing;
    if (nonDoxAirPricing !== undefined) updateData.nonDoxAirPricing = nonDoxAirPricing;
    if (priorityPricing !== undefined) updateData.priorityPricing = priorityPricing;
    if (reversePricing !== undefined) updateData.reversePricing = reversePricing;
    if (fuelChargePercentage !== undefined) updateData.fuelChargePercentage = fuelChargePercentage;
    if (notes !== undefined) updateData.notes = notes;

    const updatedPricing = await CorporatePricing.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('corporateClient', 'companyName corporateId');

    if (!updatedPricing) {
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    console.log(`✅ Corporate pricing updated by admin ${req.admin.name}: ${updatedPricing.name}`);

    res.json({
      success: true,
      message: 'Corporate pricing updated successfully.',
      data: updatedPricing
    });

  } catch (error) {
    console.error('Update corporate pricing error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to update corporate pricing.' });
    }
  }
});

// Approve corporate pricing
router.patch('/corporate-pricing/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const pricing = await CorporatePricing.findById(req.params.id);

    if (!pricing) {
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    if (pricing.status === 'approved') {
      return res.status(400).json({
        error: 'This pricing is already approved.'
      });
    }

    await pricing.approve(req.admin._id);

    console.log(`✅ Corporate pricing approved by admin ${req.admin.name}: ${pricing.name}`);

    res.json({
      success: true,
      message: 'Corporate pricing approved successfully.',
      data: pricing
    });

  } catch (error) {
    console.error('Approve corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to approve corporate pricing.' });
    }
  }
});

// Reject corporate pricing
router.patch('/corporate-pricing/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const pricing = await CorporatePricing.findById(req.params.id);

    if (!pricing) {
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    if (pricing.status === 'rejected') {
      return res.status(400).json({
        error: 'This pricing is already rejected.'
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        error: 'Rejection reason is required.'
      });
    }

    await pricing.reject(rejectionReason.trim());

    console.log(`❌ Corporate pricing rejected by admin ${req.admin.name}: ${pricing.name}`);

    res.json({
      success: true,
      message: 'Corporate pricing rejected successfully.',
      data: pricing
    });

  } catch (error) {
    console.error('Reject corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to reject corporate pricing.' });
    }
  }
});

// Connect corporate pricing to corporate client
router.patch('/corporate-pricing/:id/connect', authenticateAdmin, async (req, res) => {
  try {
    const { corporateClientId } = req.body;
    console.log(`🔗 Connecting pricing ${req.params.id} to corporate client ${corporateClientId}`);

    if (!corporateClientId) {
      return res.status(400).json({
        error: 'Corporate client ID is required.'
      });
    }

    const pricing = await CorporatePricing.findById(req.params.id);

    if (!pricing) {
      console.log(`❌ Pricing not found: ${req.params.id}`);
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    console.log(`📋 Found pricing: ${pricing.name}, status: ${pricing.status}`);

    if (pricing.status !== 'approved') {
      console.log(`❌ Pricing not approved: ${pricing.status}`);
      return res.status(400).json({
        error: `Only approved pricing can be connected to corporate clients. Current status: ${pricing.status}`
      });
    }

    // Import CorporateData model
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporateClient = await CorporateData.findByCorporateId(corporateClientId);

    if (!corporateClient) {
      console.log(`❌ Corporate client not found: ${corporateClientId}`);
      return res.status(404).json({
        error: `Corporate client with ID ${corporateClientId} not found.`
      });
    }

    console.log(`🏢 Found corporate client: ${corporateClient.companyName} (${corporateClient.corporateId})`);

    await pricing.connectToCorporate(corporateClient._id);

    console.log(`✅ Corporate pricing connected to client by admin ${req.admin.name}: ${pricing.name} -> ${corporateClient.companyName}`);

    res.json({
      success: true,
      message: 'Corporate pricing connected to client successfully.',
      data: {
        pricing: pricing,
        corporate: {
          id: corporateClient._id,
          corporateId: corporateClient.corporateId,
          companyName: corporateClient.companyName
        }
      }
    });

  } catch (error) {
    console.error('❌ Connect corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: `Failed to connect corporate pricing: ${error.message}` });
    }
  }
});

// Get corporate client with assigned pricing plan
router.get('/corporate/:id/pricing', authenticateAdmin, async (req, res) => {
  try {
    console.log(`🔍 Fetching pricing for corporate client: ${req.params.id}`);

    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporateClient = await CorporateData.findById(req.params.id);

    if (!corporateClient) {
      console.log(`❌ Corporate client not found: ${req.params.id}`);
      return res.status(404).json({
        error: 'Corporate client not found.'
      });
    }

    console.log(`🏢 Found corporate client: ${corporateClient.companyName} (${corporateClient.corporateId})`);

    // Find the pricing plan assigned to this corporate client
    const assignedPricing = await CorporatePricing.findOne({
      corporateClient: req.params.id,
      status: 'approved'
    })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();

    console.log(`📋 Assigned pricing found:`, assignedPricing ? `${assignedPricing.name} (${assignedPricing.status})` : 'None');

    // Also check if there are any pricing plans connected to this client (regardless of status)
    const allConnectedPricing = await CorporatePricing.find({
      corporateClient: req.params.id
    }).select('name status').lean();

    console.log(`📊 All connected pricing plans:`, allConnectedPricing.map(p => `${p.name} (${p.status})`));

    res.json({
      success: true,
      data: {
        corporate: corporateClient,
        assignedPricing: assignedPricing
      }
    });

  } catch (error) {
    console.error('❌ Get corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid corporate ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to get corporate pricing.' });
    }
  }
});

// Public endpoint to get pricing by approval token (for email approval page)
router.get('/public/pricing-approval/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const pricing = await CorporatePricing.findByApprovalToken(token)
      .populate('createdBy', 'name email')
      .lean();

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired approval link.'
      });
    }

    // Check if already processed
    if (pricing.emailApprovedAt || pricing.emailRejectedAt) {
      return res.status(400).json({
        success: false,
        error: 'This pricing proposal has already been processed.',
        status: pricing.status,
        processedAt: pricing.emailApprovedAt || pricing.emailRejectedAt
      });
    }

    res.json({
      success: true,
      data: pricing
    });

  } catch (error) {
    console.error('Get pricing by token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing information.'
    });
  }
});

// Public endpoint to approve pricing via email
router.post('/public/pricing-approval/:token/approve', async (req, res) => {
  try {
    const { token } = req.params;
    const { approvedBy } = req.body;

    const pricing = await CorporatePricing.findByApprovalToken(token);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired approval link.'
      });
    }

    // Check if already processed
    if (pricing.emailApprovedAt || pricing.emailRejectedAt) {
      return res.status(400).json({
        success: false,
        error: 'This pricing proposal has already been processed.',
        status: pricing.status
      });
    }

    // Approve the pricing
    await pricing.approveViaEmail(approvedBy || pricing.clientName || 'Email Approval');

    // Send confirmation email
    try {
      const emailService = (await import('../services/emailService.js')).default;
      await emailService.sendApprovalConfirmationEmail(pricing.toObject(), 'approved');
    } catch (emailError) {
      console.error('Failed to send approval confirmation email:', emailError);
    }

    console.log(`✅ Pricing approved via email: ${pricing.name} by ${approvedBy || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Pricing proposal approved successfully!',
      data: {
        name: pricing.name,
        status: pricing.status,
        approvedAt: pricing.emailApprovedAt
      }
    });

  } catch (error) {
    console.error('Approve pricing via email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve pricing proposal.'
    });
  }
});

// Public endpoint to reject pricing via email
router.post('/public/pricing-approval/:token/reject', async (req, res) => {
  try {
    const { token } = req.params;
    const { rejectionReason, rejectedBy } = req.body;

    const pricing = await CorporatePricing.findByApprovalToken(token);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired approval link.'
      });
    }

    // Check if already processed
    if (pricing.emailApprovedAt || pricing.emailRejectedAt) {
      return res.status(400).json({
        success: false,
        error: 'This pricing proposal has already been processed.',
        status: pricing.status
      });
    }

    // Reject the pricing
    await pricing.rejectViaEmail(
      rejectionReason || 'Rejected via email approval',
      rejectedBy || pricing.clientName || 'Email Rejection'
    );

    // Send confirmation email
    try {
      const emailService = (await import('../services/emailService.js')).default;
      await emailService.sendApprovalConfirmationEmail(pricing.toObject(), 'rejected');
    } catch (emailError) {
      console.error('Failed to send rejection confirmation email:', emailError);
    }

    console.log(`❌ Pricing rejected via email: ${pricing.name} by ${rejectedBy || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Pricing proposal rejected successfully.',
      data: {
        name: pricing.name,
        status: pricing.status,
        rejectedAt: pricing.emailRejectedAt,
        rejectionReason: pricing.emailRejectionReason
      }
    });

  } catch (error) {
    console.error('Reject pricing via email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject pricing proposal.'
    });
  }
});

// Send pricing approval email for existing pricing
router.post('/corporate-pricing/:id/send-approval-email', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientEmail, clientName, clientCompany } = req.body;

    const pricing = await CorporatePricing.findById(id);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Corporate pricing not found.'
      });
    }

    if (pricing.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending pricing can be sent for email approval.'
      });
    }

    // Update client information if provided
    if (clientEmail) pricing.clientEmail = clientEmail;
    if (clientName) pricing.clientName = clientName;
    if (clientCompany) pricing.clientCompany = clientCompany;

    // Generate approval token
    const approvalToken = pricing.generateApprovalToken();
    await pricing.save();

    // Generate approval URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/pricing-approval/${approvalToken}/approve`;
    const rejectionUrl = `${baseUrl}/pricing-approval/${approvalToken}/reject`;

    // Send email
    const emailService = (await import('../services/emailService.js')).default;
    const emailResult = await emailService.sendPricingApprovalEmail(
      pricing.toObject(),
      approvalUrl,
      rejectionUrl
    );

    // Mark email as sent
    await pricing.markEmailSent();

    console.log(`📧 Pricing approval email sent to ${pricing.clientEmail} for pricing: ${pricing.name}`);

    res.json({
      success: true,
      message: 'Approval email sent successfully!',
      data: pricing,
      emailResult: emailResult
    });

  } catch (error) {
    console.error('Send approval email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send approval email.'
    });
  }
});

// Google OAuth setup endpoints for email service
router.get('/email/oauth/setup', authenticateAdmin, async (req, res) => {
  try {
    const emailService = (await import('../services/emailService.js')).default;
    const authUrl = emailService.generateAuthUrl();

    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Visit this URL to authorize Gmail access. After authorization, you will receive a code to complete the setup.'
    });
  } catch (error) {
    console.error('OAuth setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL'
    });
  }
});

router.post('/email/oauth/complete', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const emailService = (await import('../services/emailService.js')).default;
    const tokens = await emailService.getTokensFromCode(code);

    res.json({
      success: true,
      message: 'Gmail OAuth setup completed successfully!',
      refreshToken: tokens.refresh_token,
      instructions: 'Add the refresh token to your .env file as GOOGLE_REFRESH_TOKEN'
    });
  } catch (error) {
    console.error('OAuth completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete OAuth setup: ' + error.message
    });
  }
});

router.get('/email/test', authenticateAdmin, async (req, res) => {
  try {
    console.log('🧪 Testing email service...');

    // Test email service import
    let emailService;
    try {
      emailService = (await import('../services/emailService.js')).default;
      console.log('✅ Email service imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import email service:', importError);
      return res.status(500).json({
        success: false,
        error: 'Failed to import email service: ' + importError.message
      });
    }

    // Test connection
    const isConnected = await emailService.testConnection();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Email service is working correctly' : 'Email service connection failed',
      details: {
        hasTransporter: !!emailService.transporter,
        hasOAuthClient: !!emailService.oauth2Client,
        isInitialized: emailService.isInitialized
      }
    });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Email service test failed: ' + error.message,
      stack: error.stack
    });
  }
});

// Delete corporate pricing by ID
router.delete('/corporate-pricing/:id', authenticateAdmin, async (req, res) => {
  try {
    const deletedPricing = await CorporatePricing.findByIdAndDelete(req.params.id);

    if (!deletedPricing) {
      return res.status(404).json({
        error: 'Corporate pricing not found.'
      });
    }

    console.log(`🗑️ Corporate pricing deleted by admin ${req.admin.name}: ${deletedPricing.name}`);

    res.json({
      success: true,
      message: 'Corporate pricing deleted successfully.',
      deletedData: {
        id: deletedPricing._id,
        name: deletedPricing.name
      }
    });

  } catch (error) {
    console.error('Delete corporate pricing error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid pricing ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to delete corporate pricing.' });
    }
  }
});

// ==================== CONSIGNMENT MANAGEMENT ROUTES ====================

// Get all corporate companies for consignment assignment
router.get('/consignment/corporates', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = { isActive: true };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        ...query,
        $or: [
          { companyName: searchRegex },
          { corporateId: searchRegex },
          { email: searchRegex },
          { contactNumber: searchRegex }
        ]
      };
    }

    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporates = await CorporateData.find(query)
      .select('corporateId companyName email contactNumber registrationDate')
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await CorporateData.countDocuments(query);

    // Get consignment assignments for each corporate
    const corporateIds = corporates.map(c => c._id);
    const assignments = await ConsignmentAssignment.find({
      corporateId: { $in: corporateIds },
      isActive: true
    }).lean();

    // Map assignments to corporates (now supporting multiple assignments per corporate)
    const assignmentMap = {};
    assignments.forEach(assignment => {
      if (!assignmentMap[assignment.corporateId.toString()]) {
        assignmentMap[assignment.corporateId.toString()] = [];
      }
      assignmentMap[assignment.corporateId.toString()].push(assignment);
    });

    const corporatesWithAssignments = corporates.map(corporate => ({
      ...corporate,
      consignmentAssignments: assignmentMap[corporate._id.toString()] || [],
      hasAssignments: (assignmentMap[corporate._id.toString()] || []).length > 0
    }));

    res.json({
      success: true,
      data: corporatesWithAssignments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      },
      search: search
    });

  } catch (error) {
    console.error('Get corporates for consignment error:', error);
    res.status(500).json({
      error: 'Failed to get corporate companies.'
    });
  }
});

// Get courier boys for consignment assignment (Admin)
router.get('/consignment/courier-boys', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const { default: ConsignmentAssignment, ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');

    // Fetch courier boys and their assignments in parallel
    const [courierBoys, assignments] = await Promise.all([
      CourierBoy.find({ status: 'approved' })
        .select('_id fullName email phone area')
        .sort({ fullName: 1 })
        .lean(),
      ConsignmentAssignment.find({
        assignmentType: 'courier_boy',
        isActive: true
      })
        .populate('courierBoyId', 'fullName email phone area')
        .lean()
    ]);

    console.log(`[Admin] Found ${courierBoys.length} approved courier boys`);
    console.log(`[Admin] Found ${assignments.length} courier boy assignments`);

    // Map assignments to courier boys and calculate usage
    const courierBoysWithAssignments = courierBoys.map(async (courier) => {
      const courierAssignments = assignments.filter(assignment => {
        // Handle both populated and unpopulated courierBoyId
        const assignmentCourierId = assignment.courierBoyId?._id || assignment.courierBoyId;
        return String(assignmentCourierId) === String(courier._id);
      }).map(async (assignment) => {
        // Calculate usage for this assignment
        const usedCount = await ConsignmentUsage.countDocuments({
          assignmentType: 'courier_boy',
          entityId: courier._id,
          consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
        });

        const totalNumbers = assignment.totalNumbers;
        const usagePercentage = totalNumbers > 0 ? Math.round((usedCount / totalNumbers) * 100) : 0;

        return {
          ...assignment,
          usedCount,
          availableCount: totalNumbers - usedCount,
          usagePercentage
        };
      });

      // Wait for all usage calculations to complete
      const resolvedAssignments = await Promise.all(courierAssignments);

      return {
        ...courier,
        consignmentAssignments: resolvedAssignments,
        hasAssignments: resolvedAssignments.length > 0
      };
    });

    // Wait for all courier boys to be processed
    const finalCourierBoys = await Promise.all(courierBoysWithAssignments);

    console.log(`[Admin] Returning ${finalCourierBoys.length} courier boys with assignments`);

    res.json({
      success: true,
      data: finalCourierBoys
    });
  } catch (error) {
    console.error('Get courier boys (admin) error:', error);
    res.status(500).json({ error: 'Failed to fetch courier boys.' });
  }
});

// Assign consignment numbers to corporate
router.post('/consignment/assign', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { corporateId, startNumber, endNumber, notes } = req.body;

    // Validate required fields
    if (!corporateId || !startNumber || !endNumber) {
      return res.status(400).json({
        error: 'Corporate ID, start number, and end number are required.'
      });
    }

    // Validate range
    try {
      ConsignmentAssignment.validateRange(parseInt(startNumber), parseInt(endNumber));
    } catch (validationError) {
      return res.status(400).json({
        error: validationError.message
      });
    }

    // Check if corporate exists
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporate = await CorporateData.findById(corporateId);

    if (!corporate) {
      return res.status(404).json({
        error: 'Corporate company not found.'
      });
    }

    // Note: Removed the restriction that prevents multiple assignments per corporate
    // Now corporates can have multiple consignment number ranges assigned

    // Check if range is available
    const isAvailable = await ConsignmentAssignment.isRangeAvailable(
      parseInt(startNumber),
      parseInt(endNumber)
    );

    if (!isAvailable) {
      return res.status(409).json({
        error: 'The specified number range is already assigned to another corporate company.'
      });
    }

    // Create assignment
    const assignment = new ConsignmentAssignment({
      assignmentType: 'corporate',
      corporateId: corporateId,
      companyName: corporate.companyName,
      assignedToName: corporate.companyName,
      assignedToEmail: corporate.email || corporate.username || '',
      startNumber: parseInt(startNumber),
      endNumber: parseInt(endNumber),
      totalNumbers: parseInt(endNumber) - parseInt(startNumber) + 1,
      assignedBy: req.admin._id,
      notes: notes || ''
    });

    await assignment.save();

    console.log(`✅ Consignment numbers assigned by admin ${req.admin.name}: ${corporate.companyName} (${startNumber}-${endNumber})`);

    res.json({
      success: true,
      message: 'Consignment numbers assigned successfully.',
      data: assignment
    });

  } catch (error) {
    console.error('Assign consignment numbers error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to assign consignment numbers.' });
    }
  }
});

// Get all consignment assignments
router.get('/consignment/assignments', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { companyName: searchRegex },
          { assignedToName: searchRegex }
        ]
      };
    }

    // Add assignmentType filter if provided
    if (req.query.assignmentType) {
      query.assignmentType = req.query.assignmentType;
    }

    const assignments = await ConsignmentAssignment.find(query)
      .populate('corporateId', 'corporateId companyName email contactNumber')
      .populate('officeUserId', 'name email role department')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await ConsignmentAssignment.countDocuments(query);

    // Get usage statistics for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        if (assignment.assignmentType === 'office_user') {
          // Handle office user assignments
          if (!assignment.officeUserId || !assignment.officeUserId._id) {
            return {
              ...assignment,
              usedCount: 0,
              availableCount: assignment.totalNumbers,
              usagePercentage: 0,
              officeUserInfo: {
                name: assignment.assignedToName || 'Unknown User',
                email: assignment.assignedToEmail || 'N/A',
                role: 'N/A',
                department: 'N/A'
              }
            };
          }

          // Count usage within this specific assignment range for office user
          const usedCountInRange = await ConsignmentUsage.countDocuments({
            assignmentType: 'office_user',
            officeUserId: assignment.officeUserId._id,
            consignmentNumber: {
              $gte: assignment.startNumber,
              $lte: assignment.endNumber
            }
          });

          return {
            ...assignment,
            usedCount: usedCountInRange,
            availableCount: assignment.totalNumbers - usedCountInRange,
            usagePercentage: Math.round((usedCountInRange / assignment.totalNumbers) * 100),
            officeUserInfo: {
              name: assignment.officeUserId.name,
              email: assignment.officeUserId.email,
              role: assignment.officeUserId.role,
              department: assignment.officeUserId.department
            }
          };
        } else {
          // Handle corporate assignments (existing logic)
          if (!assignment.corporateId || !assignment.corporateId._id) {
            return {
              ...assignment,
              usedCount: 0,
              availableCount: assignment.totalNumbers,
              usagePercentage: 0,
              corporateInfo: {
                corporateId: 'N/A',
                companyName: assignment.companyName || 'Unknown Company',
                email: 'N/A',
                contactNumber: 'N/A'
              }
            };
          }

          // Count usage within this specific assignment range
          const usedCountInRange = await ConsignmentUsage.countDocuments({
            assignmentType: 'corporate',
            corporateId: assignment.corporateId._id,
            consignmentNumber: {
              $gte: assignment.startNumber,
              $lte: assignment.endNumber
            }
          });

          // Get total usage across all assignments for this corporate
          const totalUsedForCorporate = await ConsignmentUsage.countDocuments({
            assignmentType: 'corporate',
            corporateId: assignment.corporateId._id
          });

          // Get total assigned across all assignments for this corporate
          const allAssignmentsForCorporate = await ConsignmentAssignment.find({
            assignmentType: 'corporate',
            corporateId: assignment.corporateId._id,
            isActive: true
          });
          const totalAssignedForCorporate = allAssignmentsForCorporate.reduce(
            (sum, assign) => sum + assign.totalNumbers, 0
          );

          return {
            ...assignment,
            usedCount: usedCountInRange,
            availableCount: assignment.totalNumbers - usedCountInRange,
            usagePercentage: Math.round((usedCountInRange / assignment.totalNumbers) * 100),
            corporateTotalUsed: totalUsedForCorporate,
            corporateTotalAssigned: totalAssignedForCorporate,
            corporateUsagePercentage: totalAssignedForCorporate > 0 ? Math.round((totalUsedForCorporate / totalAssignedForCorporate) * 100) : 0,
            corporateInfo: {
              corporateId: assignment.corporateId.corporateId,
              companyName: assignment.corporateId.companyName,
              email: assignment.corporateId.email,
              contactNumber: assignment.corporateId.contactNumber
            }
          };
        }
      })
    );

    res.json({
      success: true,
      data: assignmentsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      },
      search: search
    });

  } catch (error) {
    console.error('Get consignment assignments error:', error);
    res.status(500).json({
      error: 'Failed to get consignment assignments.'
    });
  }
});

// Clean up orphaned consignment assignments
router.get('/consignment/cleanup', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    // Find assignments with null or invalid corporateId references
    const orphanedAssignments = await ConsignmentAssignment.find({
      $or: [
        { corporateId: null },
        { corporateId: { $exists: false } }
      ]
    }).populate('corporateId');

    // Find assignments where corporateId doesn't exist in CorporateData
    const assignmentsWithInvalidRefs = await ConsignmentAssignment.find({
      corporateId: { $ne: null }
    }).populate('corporateId');

    const invalidRefs = assignmentsWithInvalidRefs.filter(assignment =>
      !assignment.corporateId || !assignment.corporateId._id
    );

    const allOrphaned = [...orphanedAssignments, ...invalidRefs];

    res.json({
      success: true,
      data: {
        orphanedCount: allOrphaned.length,
        orphanedAssignments: allOrphaned.map(assignment => ({
          _id: assignment._id,
          companyName: assignment.companyName,
          startNumber: assignment.startNumber,
          endNumber: assignment.endNumber,
          totalNumbers: assignment.totalNumbers,
          assignedAt: assignment.assignedAt,
          isActive: assignment.isActive,
          corporateId: assignment.corporateId,
          issue: !assignment.corporateId ? 'Null corporateId' : 'Invalid corporateId reference'
        }))
      },
      message: `Found ${allOrphaned.length} orphaned consignment assignments`
    });

  } catch (error) {
    console.error('Cleanup consignment assignments error:', error);
    res.status(500).json({
      error: 'Failed to cleanup consignment assignments.'
    });
  }
});

// Debug endpoint to check consignment usage data
router.get('/consignment/debug', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔍 Debug: Checking ConsignmentUsage data...');

    // Check if there's any usage data
    const usageCount = await ConsignmentUsage.countDocuments();
    console.log('📊 Total ConsignmentUsage records:', usageCount);

    let usageData = [];
    if (usageCount > 0) {
      usageData = await ConsignmentUsage.find().lean();
      console.log('📋 Found usage records:', usageData.length);
    }

    // Check assignments
    const assignmentCount = await ConsignmentAssignment.countDocuments();
    console.log('📊 Total ConsignmentAssignment records:', assignmentCount);

    let assignments = [];
    if (assignmentCount > 0) {
      assignments = await ConsignmentAssignment.find().populate('corporateId').lean();
      console.log('📋 Found assignments:', assignments.length);
    }

    res.json({
      success: true,
      data: {
        usageCount,
        usageData: usageData.map(usage => ({
          _id: usage._id,
          corporateId: usage.corporateId,
          consignmentNumber: usage.consignmentNumber,
          bookingReference: usage.bookingReference,
          status: usage.status,
          paymentStatus: usage.paymentStatus,
          usedAt: usage.usedAt
        })),
        assignmentCount,
        assignments: assignments.map(assignment => ({
          _id: assignment._id,
          companyName: assignment.companyName,
          corporateId: assignment.corporateId?._id || 'NULL',
          corporateInfo: assignment.corporateId,
          startNumber: assignment.startNumber,
          endNumber: assignment.endNumber,
          totalNumbers: assignment.totalNumbers,
          isActive: assignment.isActive
        }))
      }
    });

  } catch (error) {
    console.error('Debug consignment data error:', error);
    res.status(500).json({
      error: 'Failed to debug consignment data.'
    });
  }
});

// Get consignment usage for a specific corporate
router.get('/consignment/usage/:corporateId', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { corporateId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get assignment details
    const assignment = await ConsignmentAssignment.findOne({
      corporateId: corporateId,
      isActive: true
    }).populate('corporateId', 'corporateId companyName');

    if (!assignment) {
      return res.status(404).json({
        error: 'No consignment assignment found for this corporate company.'
      });
    }

    // Get usage details
    const usage = await ConsignmentUsage.find({
      corporateId: corporateId,
      consignmentNumber: {
        $gte: assignment.startNumber,
        $lte: assignment.endNumber
      }
    })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsage = await ConsignmentUsage.countDocuments({
      corporateId: corporateId,
      consignmentNumber: {
        $gte: assignment.startNumber,
        $lte: assignment.endNumber
      }
    });

    res.json({
      success: true,
      data: {
        assignment: assignment,
        usage: usage,
        statistics: {
          totalAssigned: assignment.totalNumbers,
          totalUsed: totalUsage,
          available: assignment.totalNumbers - totalUsage,
          usagePercentage: Math.round((totalUsage / assignment.totalNumbers) * 100)
        }
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsage / limit),
        totalCount: totalUsage,
        hasNext: page * limit < totalUsage,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Get consignment usage error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid corporate ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to get consignment usage.' });
    }
  }
});

// Get highest assigned consignment number
router.get('/consignment/highest', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const summary = await getGlobalConsignmentSummary();

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get highest consignment number error:', error);
    res.status(500).json({
      error: 'Failed to get highest consignment number.'
    });
  }
});

// Get next available consignment number for corporate booking
router.get('/consignment/next/:corporateId', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { corporateId } = req.params;

    const nextNumber = await ConsignmentAssignment.getNextConsignmentNumber(corporateId);

    res.json({
      success: true,
      data: {
        consignmentNumber: nextNumber,
        corporateId: corporateId
      }
    });

  } catch (error) {
    console.error('Get next consignment number error:', error);
    res.status(400).json({
      error: error.message
    });
  }
});

// Record consignment usage (called when booking is completed)
router.post('/consignment/use', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { corporateId, consignmentNumber, bookingReference, bookingData } = req.body;

    // Validate required fields
    if (!corporateId || !consignmentNumber || !bookingReference || !bookingData) {
      return res.status(400).json({
        error: 'Corporate ID, consignment number, booking reference, and booking data are required.'
      });
    }

    // Check if number is already used
    const existingUsage = await ConsignmentUsage.findOne({
      corporateId: corporateId,
      consignmentNumber: parseInt(consignmentNumber)
    });

    if (existingUsage) {
      return res.status(409).json({
        error: 'This consignment number is already in use.'
      });
    }

    // Verify the number is within assigned range
    const assignment = await ConsignmentAssignment.findOne({
      corporateId: corporateId,
      isActive: true,
      startNumber: { $lte: parseInt(consignmentNumber) },
      endNumber: { $gte: parseInt(consignmentNumber) }
    });

    if (!assignment) {
      return res.status(400).json({
        error: 'This consignment number is not within the assigned range for this corporate company.'
      });
    }

    // Record usage
    // Set both assignmentType/entityId and corporateId for consistency
    const usage = new ConsignmentUsage({
      assignmentType: 'corporate',
      entityId: corporateId,
      corporateId: corporateId,
      consignmentNumber: parseInt(consignmentNumber),
      bookingReference: bookingReference,
      bookingData: bookingData
    });

    await usage.save();

    console.log(`✅ Consignment number ${consignmentNumber} used for booking ${bookingReference} by corporate ${corporateId}`);

    res.json({
      success: true,
      message: 'Consignment number usage recorded successfully.',
      data: usage
    });

  } catch (error) {
    console.error('Record consignment usage error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to record consignment usage.' });
    }
  }
});

// Get courier requests for admin
router.get('/courier-requests', authenticateAdmin, async (req, res) => {
  try {
    const CourierRequest = (await import('../models/CourierRequest.js')).default;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const urgency = req.query.urgency;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (urgency && urgency !== 'all') {
      query['requestData.urgency'] = urgency;
    }

    // Fetch courier requests from database
    const [requests, totalCount] = await Promise.all([
      CourierRequest.find(query)
        .populate({
          path: 'corporateId',
          select: 'corporateId companyName email contactNumber',
          options: { strictPopulate: false } // Allow null corporateId for customer requests
        })
        .populate('assignedCourier.courierBoyId', 'fullName email phone')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourierRequest.countDocuments(query)
    ]);

    // Format requests to match frontend interface
    const formattedRequests = requests.map(request => ({
      id: `CR-${request._id}`,
      _id: request._id,
      requestType: request.requestType || 'corporate',
      corporateId: request.corporateId?._id || request.corporateInfo?.corporateId || null,
      corporateInfo: request.requestType === 'customer' ? null : {
        corporateId: request.corporateId?.corporateId || request.corporateInfo?.corporateId,
        companyName: request.corporateId?.companyName || request.corporateInfo?.companyName,
        email: request.corporateId?.email || request.corporateInfo?.email,
        contactNumber: request.corporateId?.contactNumber || request.corporateInfo?.contactNumber
      },
      requestData: request.requestData,
      status: request.status,
      requestedAt: request.requestedAt || request.createdAt,
      estimatedResponseTime: request.estimatedResponseTime,
      assignedCourier: request.assignedCourier?.courierBoyId ? {
        id: request.assignedCourier.courierBoyId._id,
        name: request.assignedCourier.courierBoyId.fullName || request.assignedCourier.name,
        phone: request.assignedCourier.courierBoyId.phone || request.assignedCourier.phone
      } : request.assignedCourier ? {
        id: request.assignedCourier.courierBoyId,
        name: request.assignedCourier.name,
        phone: request.assignedCourier.phone
      } : undefined,
      assignedAt: request.assignedAt,
      completedAt: request.completedAt
    }));

    res.json({
      success: true,
      requests: formattedRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Get courier requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courier requests'
    });
  }
});

// Update courier request status
router.put('/courier-requests/:requestId/status', authenticateAdmin, async (req, res) => {
  try {
    const CourierRequest = (await import('../models/CourierRequest.js')).default;
    const { requestId } = req.params;
    const { status } = req.body;

    // Extract MongoDB _id from requestId (format: CR-{_id})
    const dbId = requestId.startsWith('CR-') ? requestId.substring(3) : requestId;

    const courierRequest = await CourierRequest.findById(dbId);
    if (!courierRequest) {
      return res.status(404).json({
        success: false,
        error: 'Courier request not found'
      });
    }

    await courierRequest.updateStatus(status);

    console.log(`🚚 Admin updating courier request ${requestId} to status: ${status}`, {
      updatedBy: req.admin.username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Courier request status updated successfully',
      requestId,
      status
    });

  } catch (error) {
    console.error('Update courier request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update courier request status'
    });
  }
});

// Create customer courier request (manual entry by admin)
router.post('/courier-requests/customer', authenticateAdmin, async (req, res) => {
  try {
    const CourierRequest = (await import('../models/CourierRequest.js')).default;
    const { location, name, phoneNumber, packageCount, weight, specialInstructions } = req.body;

    // Validate required fields
    if (!location || !name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: location, name, phoneNumber'
      });
    }

    // Validate package count and weight
    const parsedPackageCount = parseInt(packageCount) || 1;
    const parsedWeight = parseFloat(weight) || 0.1;

    // Create customer courier request
    const courierRequest = new CourierRequest({
      requestType: 'customer',
      requestData: {
        pickupAddress: location.trim(),
        contactPerson: name.trim(),
        contactPhone: phoneNumber.trim(),
        urgency: 'normal',
        specialInstructions: specialInstructions || '',
        packageCount: parsedPackageCount,
        weight: parsedWeight
      },
      status: 'pending',
      estimatedResponseTime: '10-15 minutes'
    });

    await courierRequest.save();

    // Generate request ID for frontend compatibility
    const requestId = `CR-${courierRequest._id}`;

    console.log('🚚 NEW CUSTOMER COURIER REQUEST (Manual Entry):', {
      timestamp: new Date().toISOString(),
      requestId: requestId,
      dbId: courierRequest._id,
      location,
      name,
      phoneNumber,
      packageCount: parsedPackageCount,
      weight: parsedWeight,
      specialInstructions,
      createdBy: req.admin.username
    });

    res.json({
      success: true,
      message: 'Customer courier request created successfully',
      request: {
        id: requestId,
        _id: courierRequest._id,
        requestType: 'customer',
        requestData: courierRequest.requestData,
        status: courierRequest.status,
        requestedAt: courierRequest.requestedAt
      }
    });

  } catch (error) {
    console.error('Create customer courier request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer courier request'
    });
  }
});

// Assign courier boy to courier request
router.put('/courier-requests/:requestId/assign', authenticateAdmin, async (req, res) => {
  try {
    const CourierRequest = (await import('../models/CourierRequest.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const { requestId } = req.params;
    const { courierBoyId } = req.body;

    if (!courierBoyId) {
      return res.status(400).json({
        success: false,
        error: 'Courier boy ID is required'
      });
    }

    // Extract MongoDB _id from requestId (format: CR-{_id})
    const dbId = requestId.startsWith('CR-') ? requestId.substring(3) : requestId;

    // Find courier request
    const courierRequest = await CourierRequest.findById(dbId);
    if (!courierRequest) {
      return res.status(404).json({
        success: false,
        error: 'Courier request not found'
      });
    }

    // Find courier boy
    const courierBoy = await CourierBoy.findById(courierBoyId);
    if (!courierBoy) {
      return res.status(404).json({
        success: false,
        error: 'Courier boy not found'
      });
    }

    // Check if courier boy is approved
    if (courierBoy.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved courier boys can be assigned'
      });
    }

    // Assign courier boy
    await courierRequest.assignCourier(courierBoy);

    console.log(`🚚 Admin assigned courier boy to request ${requestId}`, {
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      updatedBy: req.admin.username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Courier boy assigned successfully',
      requestId,
      assignedCourier: {
        id: courierBoy._id,
        name: courierBoy.fullName,
        phone: courierBoy.phone
      }
    });

  } catch (error) {
    console.error('Assign courier boy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign courier boy'
    });
  }
});

// ==================== SHIPMENT COURIER ASSIGNMENT ROUTES ====================

// Get all corporate shipments grouped by corporate (for courier assignment)
router.get('/shipments/grouped-by-corporate', authenticateAdmin, async (req, res) => {
  try {
    const { ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    // Get all corporate shipments - query by corporateId (required for corporate bookings)
    // Also include shipments with assignmentType: 'corporate' to catch any edge cases
    const query = {
      $or: [
        { corporateId: { $exists: true, $ne: null } },
        {
          assignmentType: 'corporate',
          entityId: { $exists: true, $ne: null }
        }
      ]
    };

    const shipments = await ConsignmentUsage.find(query)
      .populate('corporateId', 'corporateId companyName email contactNumber')
      .populate('assignedCourierBoyId', 'fullName email phone')
      .sort({ usedAt: -1 })
      .lean();

    console.log(`📦 Found ${shipments.length} total corporate shipments in database`);

    // Group shipments by corporate
    const groupedShipments = {};

    // Fetch corporate data for shipments that only have entityId
    const entityIdsToFetch = shipments
      .filter(s => !s.corporateId && s.assignmentType === 'corporate' && s.entityId)
      .map(s => s.entityId.toString());

    const corporateDataMap = {};
    if (entityIdsToFetch.length > 0) {
      const corporates = await CorporateData.find({ _id: { $in: entityIdsToFetch } })
        .select('corporateId companyName email contactNumber')
        .lean();
      corporates.forEach(corp => {
        corporateDataMap[corp._id.toString()] = corp;
      });
    }

    shipments.forEach(shipment => {
      // Get corporateId - prioritize populated corporateId field
      let corporateId = shipment.corporateId?._id?.toString() || shipment.corporateId?.toString();
      let corporateInfo = shipment.corporateId;

      // If corporateId is not populated but entityId exists and assignmentType is corporate, use entityId
      if (!corporateId && shipment.assignmentType === 'corporate' && shipment.entityId) {
        const entityIdStr = shipment.entityId.toString();
        corporateId = entityIdStr;
        corporateInfo = corporateDataMap[entityIdStr] || null;
      }

      if (!corporateId) {
        console.log('⚠️ Skipping shipment without corporateId:', shipment._id, {
          hasCorporateId: !!shipment.corporateId,
          hasEntityId: !!shipment.entityId,
          assignmentType: shipment.assignmentType
        });
        return; // Skip if no corporate ID
      }

      if (!groupedShipments[corporateId]) {
        groupedShipments[corporateId] = {
          corporate: {
            _id: corporateInfo?._id || corporateId,
            corporateId: corporateInfo?.corporateId || 'N/A',
            companyName: corporateInfo?.companyName || 'Unknown Company',
            email: corporateInfo?.email || '',
            contactNumber: corporateInfo?.contactNumber || ''
          },
          shipments: []
        };
      }

      // Transform shipment data to match frontend structure
      const bookingData = shipment.bookingData || {};
      groupedShipments[corporateId].shipments.push({
        _id: shipment._id,
        bookingReference: shipment.bookingReference,
        consignmentNumber: shipment.consignmentNumber,
        originData: bookingData.originData || {},
        destinationData: bookingData.destinationData || {},
        shipmentData: bookingData.shipmentData || {},
        invoiceData: bookingData.invoiceData || {},
        status: 'booked', // Default status
        paymentStatus: shipment.paymentStatus || 'unpaid',
        paymentType: shipment.paymentType || 'FP',
        bookingDate: shipment.usedAt,
        assignedCourierBoy: shipment.assignedCourierBoyId ? {
          _id: shipment.assignedCourierBoyId._id,
          fullName: shipment.assignedCourierBoyId.fullName,
          email: shipment.assignedCourierBoyId.email,
          phone: shipment.assignedCourierBoyId.phone
        } : null,
        assignedCourierBoyAt: shipment.assignedCourierBoyAt || null
      });
    });

    // Convert to array and sort by company name
    const result = Object.values(groupedShipments).sort((a, b) =>
      a.corporate.companyName.localeCompare(b.corporate.companyName)
    );

    console.log(`📊 Grouped into ${result.length} corporate groups`);
    console.log(`📈 Total shipments: ${shipments.length}`);

    res.json({
      success: true,
      data: result,
      totalShipments: shipments.length,
      totalCorporates: result.length
    });

  } catch (error) {
    console.error('Get shipments grouped by corporate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipments',
      details: error.message
    });
  }
});

// Get all corporate bookings grouped by corporate (for admin panel)
router.get('/corporate-bookings', authenticateAdmin, async (req, res) => {
  try {
    const { ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const Tracking = (await import('../models/Tracking.js')).default;

    // Get all corporate bookings - query by corporateId (required for corporate bookings)
    // Also include bookings with assignmentType: 'corporate' to catch any edge cases
    const query = {
      $or: [
        { corporateId: { $exists: true, $ne: null } },
        {
          assignmentType: 'corporate',
          entityId: { $exists: true, $ne: null }
        }
      ]
    };

    const bookings = await ConsignmentUsage.find(query)
      .populate('corporateId', 'corporateId companyName email contactNumber')
      .sort({ usedAt: -1 })
      .lean();

    console.log(`📦 Found ${bookings.length} total corporate bookings in database`);

    // Fetch currentStatus from Tracking table for each booking
    const consignmentNumbers = bookings
      .map(b => b.consignmentNumber)
      .filter(Boolean);
    
    const trackingRecords = await Tracking.find({
      consignmentNumber: { $in: consignmentNumbers }
    })
    .select('consignmentNumber currentStatus booked')
    .lean();
    
    // Create a map of consignmentNumber -> currentStatus
    const statusMap = new Map();
    // Create a map of consignmentNumber -> paymentStatus from trackings.booked[0].paymentStatus
    const paymentStatusMap = new Map();
    
    trackingRecords.forEach(tracking => {
      statusMap.set(tracking.consignmentNumber, tracking.currentStatus);
      // Get paymentStatus from trackings.booked[0].paymentStatus
      if (tracking.booked && Array.isArray(tracking.booked) && tracking.booked.length > 0) {
        const paymentStatus = tracking.booked[0].paymentStatus || null;
        paymentStatusMap.set(tracking.consignmentNumber, paymentStatus);
      }
    });
    
    console.log(`📊 Fetched status for ${trackingRecords.length} bookings from Tracking table`);
    console.log(`💳 Fetched payment status for ${paymentStatusMap.size} bookings from Tracking table`);

    // Group bookings by corporate
    const groupedBookings = {};

    // Fetch corporate data for bookings that only have entityId
    const entityIdsToFetch = bookings
      .filter(b => !b.corporateId && b.assignmentType === 'corporate' && b.entityId)
      .map(b => b.entityId.toString());

    const corporateDataMap = {};
    if (entityIdsToFetch.length > 0) {
      const corporates = await CorporateData.find({ _id: { $in: entityIdsToFetch } })
        .select('corporateId companyName email contactNumber')
        .lean();
      corporates.forEach(corp => {
        corporateDataMap[corp._id.toString()] = corp;
      });
    }

    bookings.forEach(booking => {
      // Get corporateId - prioritize populated corporateId field
      let corporateId = booking.corporateId?._id?.toString() || booking.corporateId?.toString();
      let corporateInfo = booking.corporateId;

      // If corporateId is not populated but entityId exists and assignmentType is corporate, use entityId
      if (!corporateId && booking.assignmentType === 'corporate' && booking.entityId) {
        const entityIdStr = booking.entityId.toString();
        corporateId = entityIdStr;
        corporateInfo = corporateDataMap[entityIdStr] || null;
      }

      if (!corporateId) {
        console.log('⚠️ Skipping booking without corporateId:', booking._id);
        return; // Skip if no corporate ID
      }

      if (!groupedBookings[corporateId]) {
        groupedBookings[corporateId] = {
          corporate: {
            _id: corporateInfo?._id || corporateId,
            corporateId: corporateInfo?.corporateId || 'N/A',
            companyName: corporateInfo?.companyName || 'Unknown Company',
            email: corporateInfo?.email || '',
            contactNumber: corporateInfo?.contactNumber || ''
          },
          bookings: []
        };
      }

      // Transform booking data to match the expected format (same as corporate endpoint)
      const bookingData = booking.bookingData || {};
      // Get status from Tracking table, fallback to 'booked' if not found
      const currentStatus = statusMap.get(booking.consignmentNumber) || 'booked';
      // Get paymentStatus from Tracking table (trackings.booked[0].paymentStatus), fallback to booking.paymentStatus or 'unpaid'
      const trackingPaymentStatus = paymentStatusMap.get(booking.consignmentNumber);
      const finalPaymentStatus = trackingPaymentStatus !== null && trackingPaymentStatus !== undefined 
        ? trackingPaymentStatus 
        : (booking.paymentStatus || 'unpaid');
      
      groupedBookings[corporateId].bookings.push({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber,
        originData: bookingData.originData || {},
        destinationData: bookingData.destinationData || {},
        shipmentData: bookingData.shipmentData || {},
        invoiceData: bookingData.invoiceData || {},
        status: currentStatus, // Get from Tracking.currentStatus
        currentStatus: currentStatus, // Also include as currentStatus for consistency
        paymentStatus: finalPaymentStatus, // Get from Tracking.booked[0].paymentStatus
        paymentType: booking.paymentType || 'FP',
        bookingDate: booking.usedAt || booking.createdAt,
        trackingUpdates: [
          {
            status: currentStatus,
            location: bookingData.originData?.city || 'Unknown',
            timestamp: booking.usedAt || booking.createdAt,
            description: 'Shipment booked and ready for pickup'
          }
        ]
      });
    });

    // Convert to array and sort by company name
    const result = Object.values(groupedBookings).sort((a, b) =>
      a.corporate.companyName.localeCompare(b.corporate.companyName)
    );

    console.log(`📊 Grouped into ${result.length} corporate groups`);
    console.log(`📈 Total bookings: ${bookings.length}`);

    res.json({
      success: true,
      data: result,
      totalBookings: bookings.length,
      totalCorporates: result.length
    });

  } catch (error) {
    console.error('Get corporate bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch corporate bookings',
      details: error.message
    });
  }
});

// Get all customer bookings (for admin panel)
router.get('/customer-bookings', authenticateAdmin, async (req, res) => {
  try {
    // Get all customer bookings
    const bookings = await CustomerBooking.find({})
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📦 Found ${bookings.length} total customer bookings in database`);

    // Fetch currentStatus from Tracking table for each booking
    const consignmentNumbers = bookings
      .map(b => b.consignmentNumber)
      .filter(Boolean);
    
    const trackingRecords = await Tracking.find({
      consignmentNumber: { $in: consignmentNumbers }
    })
    .select('consignmentNumber currentStatus booked')
    .lean();
    
    // Create a map of consignmentNumber -> currentStatus
    const statusMap = new Map();
    const paymentStatusMap = new Map();
    
    trackingRecords.forEach(tracking => {
      statusMap.set(tracking.consignmentNumber, tracking.currentStatus);
      if (tracking.booked && Array.isArray(tracking.booked) && tracking.booked.length > 0) {
        const paymentStatus = tracking.booked[0].paymentStatus || null;
        paymentStatusMap.set(tracking.consignmentNumber, paymentStatus);
      }
    });
    
    console.log(`📊 Fetched status for ${trackingRecords.length} bookings from Tracking table`);

    // Transform bookings to match expected format
    const transformedBookings = bookings.map(booking => {
      // Get status from Tracking table, fallback to booking.currentStatus or 'booked'
      const currentStatus = statusMap.get(booking.consignmentNumber) || booking.currentStatus || 'booked';
      const trackingPaymentStatus = paymentStatusMap.get(booking.consignmentNumber);
      const finalPaymentStatus = trackingPaymentStatus !== null && trackingPaymentStatus !== undefined 
        ? trackingPaymentStatus 
        : (booking.paymentStatus || 'unpaid');
      
      return {
        _id: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber,
        origin: booking.origin || {},
        destination: booking.destination || {},
        shipment: booking.shipment || {},
        packageImages: booking.packageImages || [],
        serviceType: booking.serviceType,
        calculatedPrice: booking.calculatedPrice || 0,
        basePrice: booking.basePrice || 0,
        gstAmount: booking.gstAmount || 0,
        pickupCharge: booking.pickupCharge || 0,
        totalAmount: booking.totalAmount || 0,
        actualWeight: booking.actualWeight,
        chargeableWeight: booking.chargeableWeight,
        status: currentStatus,
        currentStatus: currentStatus,
        paymentStatus: finalPaymentStatus,
        paymentMethod: booking.paymentMethod || 'cod',
        bookingDate: booking.BookedAt || booking.createdAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        onlineCustomerId: booking.onlineCustomerId
      };
    });

    console.log(`📈 Total bookings: ${transformedBookings.length}`);

    res.json({
      success: true,
      data: transformedBookings,
      totalBookings: transformedBookings.length
    });

  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer bookings',
      details: error.message
    });
  }
});

// Assign courier boy to shipment
router.put('/shipments/:shipmentId/assign-courier', authenticateAdmin, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { courierBoyId } = req.body;

    if (!courierBoyId) {
      return res.status(400).json({
        success: false,
        error: 'Courier boy ID is required'
      });
    }

    const { ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    // Find shipment
    const shipment = await ConsignmentUsage.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    // Find courier boy
    const courierBoy = await CourierBoy.findById(courierBoyId);
    if (!courierBoy) {
      return res.status(404).json({
        success: false,
        error: 'Courier boy not found'
      });
    }

    // Check if courier boy is approved
    if (courierBoy.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved courier boys can be assigned'
      });
    }

    // Ensure entityId is set (required by model) - use corporateId if entityId is missing
    if (!shipment.entityId && shipment.corporateId) {
      shipment.entityId = shipment.corporateId;
    } else if (!shipment.entityId) {
      // If no corporateId either, we can't assign - this shouldn't happen for corporate shipments
      return res.status(400).json({
        success: false,
        error: 'Shipment is missing required corporate information'
      });
    }

    // Ensure assignmentType is set (required by model)
    if (!shipment.assignmentType && shipment.corporateId) {
      shipment.assignmentType = 'corporate';
    }

    // Get corporate data for AssignedCourier record
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporate = await CorporateData.findById(shipment.corporateId).lean();

    if (!corporate) {
      return res.status(404).json({
        success: false,
        error: 'Corporate account not found'
      });
    }

    // Prepare order data for AssignedCourier
    const bookingData = shipment.bookingData || {};
    const orderData = {
      shipmentId: shipment._id,
      consignmentNumber: shipment.consignmentNumber,
      bookingReference: shipment.bookingReference,
      originData: bookingData.originData || {},
      destinationData: bookingData.destinationData || {},
      shipmentData: bookingData.shipmentData || {},
      invoiceData: bookingData.invoiceData || {}
    };

    // Create or update AssignedCourier record
    const AssignedCourier = (await import('../models/AssignedCourier.js')).default;

    // Check if there's an existing AssignedCourier record for this corporate and courier
    // Use findOneAndUpdate with upsert to handle race conditions better
    let assignedCourierRecord = await AssignedCourier.findOneAndUpdate(
      {
        corporateId: shipment.corporateId,
        'assignedCourier.courierBoyId': courierBoy._id,
        status: { $in: ['pending', 'assigned', 'in_progress'] },
        work: 'pickup',
        type: 'corporate'
      },
      {
        $setOnInsert: {
          corporateId: shipment.corporateId,
          corporateInfo: {
            corporateId: corporate.corporateId || 'N/A',
            companyName: corporate.companyName || 'Unknown Company',
            email: corporate.email || '',
            contactNumber: corporate.contactNumber || ''
          },
          type: 'corporate',
          work: 'pickup',
          status: 'assigned',
          assignedCourier: {
            courierBoyId: courierBoy._id,
            name: courierBoy.fullName,
            phone: courierBoy.phone,
            email: courierBoy.email || '',
            area: courierBoy.area || ''
          },
          assignedBy: req.admin._id,
          assignedAt: new Date()
        },
        $addToSet: {
          orders: orderData
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Refresh the record to get updated data
    assignedCourierRecord = await AssignedCourier.findById(assignedCourierRecord._id);

    // Check if order was added, if not add it manually (in case $addToSet didn't work with complex object)
    const orderExists = assignedCourierRecord.orders.some(
      o => o.shipmentId && o.shipmentId.toString() === shipment._id.toString()
    );

    if (!orderExists) {
      assignedCourierRecord.orders.push(orderData);
      await assignedCourierRecord.save();
    }

    // Assign courier boy to shipment (keep existing functionality)
    shipment.assignedCourierBoyId = courierBoy._id;
    shipment.assignedCourierBoyAt = new Date();

    try {
      await shipment.save();
    } catch (saveError) {
      console.error('Error saving shipment after courier assignment:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save courier assignment',
        details: saveError.message
      });
    }

    console.log(`🚚 Admin assigned courier boy to shipment ${shipmentId}`, {
      shipmentId: shipment._id,
      consignmentNumber: shipment.consignmentNumber,
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      corporateId: shipment.corporateId,
      assignedCourierRecordId: assignedCourierRecord._id,
      updatedBy: req.admin.username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Courier boy assigned successfully',
      shipment: {
        _id: shipment._id,
        consignmentNumber: shipment.consignmentNumber,
        bookingReference: shipment.bookingReference
      },
      assignedCourier: {
        id: courierBoy._id,
        name: courierBoy.fullName,
        phone: courierBoy.phone,
        email: courierBoy.email
      },
      assignedCourierRecord: {
        _id: assignedCourierRecord._id,
        ordersCount: assignedCourierRecord.orders.length,
        type: assignedCourierRecord.type,
        work: assignedCourierRecord.work
      }
    });

  } catch (error) {
    console.error('Assign courier boy to shipment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign courier boy'
    });
  }
});

// ==================== ASSIGNED COURIER ROUTES ====================

// Get all assigned courier records
router.get('/assigned-couriers', authenticateAdmin, async (req, res) => {
  try {
    const AssignedCourier = (await import('../models/AssignedCourier.js')).default;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const work = req.query.work;
    const courierBoyId = req.query.courierBoyId;
    const corporateId = req.query.corporateId;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    if (work && work !== 'all') {
      query.work = work;
    }
    if (courierBoyId) {
      query['assignedCourier.courierBoyId'] = courierBoyId;
    }
    if (corporateId) {
      query.corporateId = corporateId;
    }

    const [assignedCouriers, totalCount] = await Promise.all([
      AssignedCourier.find(query)
        .populate('corporateId', 'corporateId companyName email contactNumber')
        .populate('assignedCourier.courierBoyId', 'fullName email phone area')
        .populate('assignedBy', 'username email')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AssignedCourier.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: assignedCouriers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get assigned couriers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned courier records'
    });
  }
});

// Get assigned courier by ID
router.get('/assigned-couriers/:id', authenticateAdmin, async (req, res) => {
  try {
    const AssignedCourier = (await import('../models/AssignedCourier.js')).default;
    const assignedCourier = await AssignedCourier.findById(req.params.id)
      .populate('corporateId', 'corporateId companyName email contactNumber')
      .populate('assignedCourier.courierBoyId', 'fullName email phone area')
      .populate('assignedBy', 'username email')
      .lean();

    if (!assignedCourier) {
      return res.status(404).json({
        success: false,
        error: 'Assigned courier record not found'
      });
    }

    res.json({
      success: true,
      data: assignedCourier
    });

  } catch (error) {
    console.error('Get assigned courier by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned courier record'
    });
  }
});

// Update assigned courier status
router.put('/assigned-couriers/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const AssignedCourier = (await import('../models/AssignedCourier.js')).default;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const assignedCourier = await AssignedCourier.findById(req.params.id);
    if (!assignedCourier) {
      return res.status(404).json({
        success: false,
        error: 'Assigned courier record not found'
      });
    }

    await assignedCourier.updateStatus(status);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: assignedCourier
    });

  } catch (error) {
    console.error('Update assigned courier status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// ==================== INVOICE MANAGEMENT ROUTES ====================

// Get all corporates for admin (for invoice management)
router.get('/corporates', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { companyName: searchRegex },
          { corporateId: searchRegex },
          { email: searchRegex },
          { contactNumber: searchRegex }
        ]
      };
    }

    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporates = await CorporateData.find(query)
      .select('corporateId companyName email contactNumber registrationDate isActive companyAddress gstNumber state')
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await CorporateData.countDocuments(query);

    res.json({
      success: true,
      corporates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Get corporates for admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch corporates'
    });
  }
});

// Update invoice (Admin only)
router.put('/invoices/:invoiceId', authenticateAdmin, async (req, res) => {
  try {
    const { status, paymentMethod, paymentReference, remarks } = req.body;

    const Invoice = (await import('../models/Invoice.js')).default;
    const invoice = await Invoice.findById(req.params.invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Update fields
    if (status) invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paymentReference) invoice.paymentReference = paymentReference;
    if (remarks) invoice.remarks = remarks;

    // Set payment date if status is changed to paid
    if (status === 'paid' && !invoice.paymentDate) {
      invoice.paymentDate = new Date();
    }

    // Update last modified by
    invoice.lastModifiedBy = req.admin._id;

    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
});

// Get all address forms (bookings) with pagination and filters
// NEW: Get consignments for coloader assignment (using tracking data)
router.get('/addressforms', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      currentStatus // Filter by tracking status: 'received', 'assigned', etc.
    } = req.query;

    const Tracking = (await import('../models/Tracking.js')).default;
    const FormData = (await import('../models/FormData.js')).default;

    // Build tracking query
    const trackingQuery = {};
    if (currentStatus) {
      trackingQuery.currentStatus = currentStatus;
    }

    // Find tracking records first
    const trackingRecords = await Tracking.find(trackingQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Extract consignment numbers
    const consignmentNumbers = trackingRecords.map(t => t.consignmentNumber);

    // Build FormData query
    const formQuery = {
      consignmentNumber: { $in: consignmentNumbers }
    };

    // Add search filter
    if (search) {
      formQuery.$or = [
        { 'originData.name': { $regex: search, $options: 'i' } },
        { 'destinationData.name': { $regex: search, $options: 'i' } },
        { 'senderName': { $regex: search, $options: 'i' } },
        { 'receiverName': { $regex: search, $options: 'i' } },
        { 'originData.city': { $regex: search, $options: 'i' } },
        { 'destinationData.city': { $regex: search, $options: 'i' } },
        { 'senderCity': { $regex: search, $options: 'i' } },
        { 'receiverCity': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch forms matching the consignment numbers
    const addressForms = await FormData.find(formQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich forms with tracking data
    const enrichedForms = addressForms.map(form => {
      const tracking = trackingRecords.find(t => t.consignmentNumber === form.consignmentNumber);
      return {
        ...form,
        trackingData: tracking ? {
          currentStatus: tracking.currentStatus,
          assigned: tracking.assigned || [],
          statusHistory: tracking.statusHistory || []
        } : null
      };
    });

    const totalCount = await FormData.countDocuments(formQuery);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: enrichedForms,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching consignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consignments'
    });
  }
});

// Legacy address-forms endpoint (kept for backward compatibility)
router.get('/address-forms', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      fromDate,
      toDate,
      originPincode,
      destinationPincode,
      formCompleted
    } = req.query;

    const query = {};

    // Form completion filter
    if (formCompleted && formCompleted !== 'all') {
      query.formCompleted = formCompleted === 'true';
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // Location filters
    if (originPincode) {
      query.$or = [
        { 'originData.pincode': originPincode },
        { 'senderPincode': originPincode }
      ];
    }
    if (destinationPincode) {
      query.$or = [
        { 'destinationData.pincode': destinationPincode },
        { 'receiverPincode': destinationPincode }
      ];
    }

    // Search filter
    if (search) {
      query.$or = [
        { 'originData.name': { $regex: search, $options: 'i' } },
        { 'destinationData.name': { $regex: search, $options: 'i' } },
        { 'senderName': { $regex: search, $options: 'i' } },
        { 'receiverName': { $regex: search, $options: 'i' } },
        { 'originData.city': { $regex: search, $options: 'i' } },
        { 'destinationData.city': { $regex: search, $options: 'i' } },
        { 'senderCity': { $regex: search, $options: 'i' } },
        { 'receiverCity': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const addressForms = await FormData.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await FormData.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        addressForms,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching address forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch address forms'
    });
  }
});

// Assign consignment numbers to office user
router.post('/consignment/assign-office-user', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { officeUserId, startNumber, endNumber, notes } = req.body;

    // Validate required fields
    if (!officeUserId || !startNumber || !endNumber) {
      return res.status(400).json({
        error: 'Office User ID, start number, and end number are required.'
      });
    }

    // Validate range
    try {
      ConsignmentAssignment.validateRange(parseInt(startNumber), parseInt(endNumber));
    } catch (validationError) {
      return res.status(400).json({
        error: validationError.message
      });
    }

    // Check if office user exists
    const OfficeUser = (await import('../models/OfficeUser.js')).default;
    const officeUser = await OfficeUser.findById(officeUserId);

    if (!officeUser) {
      return res.status(404).json({
        error: 'Office user not found.'
      });
    }

    // Check if range is available
    const isAvailable = await ConsignmentAssignment.isRangeAvailable(
      parseInt(startNumber),
      parseInt(endNumber)
    );

    if (!isAvailable) {
      return res.status(409).json({
        error: 'The specified number range is already assigned to another user.'
      });
    }

    // Create assignment
    const assignment = new ConsignmentAssignment({
      assignmentType: 'office_user',
      officeUserId: officeUserId,
      assignedToName: officeUser.name,
      assignedToEmail: officeUser.email,
      startNumber: parseInt(startNumber),
      endNumber: parseInt(endNumber),
      totalNumbers: parseInt(endNumber) - parseInt(startNumber) + 1,
      assignedBy: req.admin._id,
      notes: notes || ''
    });

    await assignment.save();

    console.log(`✅ Consignment numbers assigned by admin ${req.admin.name}: Office User ${officeUser.name} (${startNumber}-${endNumber})`);

    res.json({
      success: true,
      message: 'Consignment numbers assigned successfully to office user.',
      data: assignment
    });

  } catch (error) {
    console.error('Assign consignment numbers to office user error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format.' });
    } else {
      res.status(500).json({ error: 'Failed to assign consignment numbers to office user.' });
    }
  }
});

// Assign consignment numbers to courier boy (admin)
router.post('/consignment/assign-courier-boy', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { courierBoyId, startNumber, endNumber, notes } = req.body;

    // Validate required fields
    if (!courierBoyId || !startNumber || !endNumber) {
      return res.status(400).json({
        error: 'Courier Boy ID, start number, and end number are required.'
      });
    }

    // Validate range
    try {
      ConsignmentAssignment.validateRange(parseInt(startNumber), parseInt(endNumber));
    } catch (validationError) {
      return res.status(400).json({
        error: validationError.message
      });
    }

    // Check if courier boy exists
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const courierBoy = await CourierBoy.findById(courierBoyId);

    if (!courierBoy) {
      return res.status(404).json({
        error: 'Courier boy not found.'
      });
    }

    // Check if range is available
    const isAvailable = await ConsignmentAssignment.isRangeAvailable(
      parseInt(startNumber),
      parseInt(endNumber)
    );

    if (!isAvailable) {
      return res.status(409).json({
        error: 'The specified number range is already assigned to another entity.'
      });
    }

    // Create assignment
    const assignment = new ConsignmentAssignment({
      assignmentType: 'courier_boy',
      courierBoyId: courierBoyId,
      assignedToName: courierBoy.fullName,
      assignedToEmail: courierBoy.email,
      startNumber: parseInt(startNumber),
      endNumber: parseInt(endNumber),
      totalNumbers: parseInt(endNumber) - parseInt(startNumber) + 1,
      assignedBy: req.admin._id,
      notes: notes || ''
    });

    await assignment.save();

    res.json({
      success: true,
      message: `Successfully assigned consignment numbers ${startNumber}-${endNumber} to ${courierBoy.fullName}`,
      data: assignment
    });
  } catch (error) {
    console.error('Assign consignment numbers to courier boy error (admin):', error);
    res.status(500).json({
      error: 'Failed to assign consignment numbers to courier boy.'
    });
  }
});

// Assign consignment numbers to medicine user (admin)
router.post('/consignment/assign-medicine-user', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { medicineUserId, startNumber, endNumber, notes } = req.body;

    // Validate required fields
    if (!medicineUserId || !startNumber || !endNumber) {
      return res.status(400).json({
        error: 'Medicine User ID, start number, and end number are required.'
      });
    }

    // Validate range
    try {
      ConsignmentAssignment.validateRange(parseInt(startNumber), parseInt(endNumber));
    } catch (validationError) {
      return res.status(400).json({
        error: validationError.message
      });
    }

    // Check if medicine user exists
    const MedicineUser = (await import('../models/MedicineUser.js')).default;
    const medicineUser = await MedicineUser.findById(medicineUserId);

    if (!medicineUser) {
      return res.status(404).json({
        error: 'Medicine user not found.'
      });
    }

    // Check if range is available
    const isAvailable = await ConsignmentAssignment.isRangeAvailable(
      parseInt(startNumber),
      parseInt(endNumber)
    );

    if (!isAvailable) {
      return res.status(409).json({
        error: 'The specified number range is already assigned to another entity.'
      });
    }

    // Create assignment
    const assignment = new ConsignmentAssignment({
      assignmentType: 'medicine',
      medicineUserId: medicineUserId,
      assignedToName: medicineUser.name,
      assignedToEmail: medicineUser.email,
      startNumber: parseInt(startNumber),
      endNumber: parseInt(endNumber),
      totalNumbers: parseInt(endNumber) - parseInt(startNumber) + 1,
      assignedBy: req.admin._id,
      notes: notes || ''
    });

    await assignment.save();

    res.json({
      success: true,
      message: `Successfully assigned consignment numbers ${startNumber}-${endNumber} to ${medicineUser.name}`,
      data: assignment
    });
  } catch (error) {
    console.error('Assign consignment numbers to medicine user error (admin):', error);
    res.status(500).json({
      error: 'Failed to assign consignment numbers to medicine user.'
    });
  }
});

// Get consignment usage for a specific medicine user (admin)
router.get('/consignment/usage/medicine-user/:medicineUserId', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { medicineUserId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { default: ConsignmentAssignment, ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    const MedicineUser = (await import('../models/MedicineUser.js')).default;

    // Get an active assignment for this medicine user (latest)
    const assignment = await ConsignmentAssignment.findOne({
      assignmentType: 'medicine',
      medicineUserId: medicineUserId,
      isActive: true
    })
      .sort({ assignedAt: -1 })
      .populate('medicineUserId', 'name email');

    if (!assignment) {
      const user = await MedicineUser.findById(medicineUserId).select('name email');
      if (!user) {
        return res.status(404).json({ error: 'Medicine user not found.' });
      }

      const allAssignments = await ConsignmentAssignment.find({
        assignmentType: 'medicine',
        medicineUserId: medicineUserId,
        isActive: true
      }).lean();

      const totalAssigned = allAssignments.reduce((sum, a) => sum + a.totalNumbers, 0);
      const totalUsed = await ConsignmentUsage.countDocuments({ assignmentType: 'medicine', entityId: medicineUserId });

      return res.json({
        success: true,
        data: {
          assignment: {
            assignmentType: 'medicine',
            assignedToName: user.name,
            assignedToEmail: user.email,
            medicineUser: user,
            startNumber: allAssignments.length ? Math.min(...allAssignments.map(a => a.startNumber)) : 0,
            endNumber: allAssignments.length ? Math.max(...allAssignments.map(a => a.endNumber)) : 0,
            totalNumbers: totalAssigned
          },
          usage: [],
          statistics: {
            totalAssigned,
            totalUsed,
            available: totalAssigned - totalUsed,
            usagePercentage: totalAssigned > 0 ? Math.round((totalUsed / totalAssigned) * 100) : 0
          },
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalUsage: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Get usage within this assignment range
    const usage = await ConsignmentUsage.find({
      assignmentType: 'medicine',
      entityId: medicineUserId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsage = await ConsignmentUsage.countDocuments({
      assignmentType: 'medicine',
      entityId: medicineUserId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    });

    const fullUsed = await ConsignmentUsage.countDocuments({
      assignmentType: 'medicine',
      entityId: medicineUserId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    });

    res.json({
      success: true,
      data: {
        assignment: {
          _id: assignment._id,
          assignmentType: 'medicine',
          assignedToName: assignment.assignedToName,
          assignedToEmail: assignment.assignedToEmail,
          startNumber: assignment.startNumber,
          endNumber: assignment.endNumber,
          totalNumbers: assignment.totalNumbers,
          assignedAt: assignment.assignedAt,
          notes: assignment.notes,
          medicineUser: assignment.medicineUserId
        },
        usage,
        statistics: {
          totalAssigned: assignment.totalNumbers,
          totalUsed: fullUsed,
          available: assignment.totalNumbers - fullUsed,
          usagePercentage: assignment.totalNumbers > 0 ? Math.round((fullUsed / assignment.totalNumbers) * 100) : 0
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsage / limit),
          totalUsage,
          hasNextPage: page < Math.ceil(totalUsage / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get medicine user consignment usage error:', error);
    res.status(500).json({ error: 'Failed to get medicine user consignment usage.' });
  }
});

// Get consignment usage for a specific courier boy (admin)
router.get('/consignment/usage/courier-boy/:courierBoyId', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const { courierBoyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { default: ConsignmentAssignment, ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    // Get an active assignment for this courier boy (latest)
    const assignment = await ConsignmentAssignment.findOne({
      assignmentType: 'courier_boy',
      courierBoyId: courierBoyId,
      isActive: true
    })
      .sort({ assignedAt: -1 })
      .populate('courierBoyId', 'fullName email phone area');

    if (!assignment) {
      const courier = await CourierBoy.findById(courierBoyId).select('fullName email phone area');
      if (!courier) {
        return res.status(404).json({ error: 'Courier boy not found.' });
      }

      const allAssignments = await ConsignmentAssignment.find({
        assignmentType: 'courier_boy',
        courierBoyId: courierBoyId,
        isActive: true
      }).lean();

      const totalAssigned = allAssignments.reduce((sum, a) => sum + a.totalNumbers, 0);
      const totalUsed = await ConsignmentUsage.countDocuments({ assignmentType: 'courier_boy', entityId: courierBoyId });

      return res.json({
        success: true,
        data: {
          assignment: {
            assignmentType: 'courier_boy',
            assignedToName: courier.fullName,
            assignedToEmail: courier.email,
            courierBoy: courier,
            startNumber: allAssignments.length ? Math.min(...allAssignments.map(a => a.startNumber)) : 0,
            endNumber: allAssignments.length ? Math.max(...allAssignments.map(a => a.endNumber)) : 0,
            totalNumbers: totalAssigned
          },
          usage: [],
          statistics: {
            totalAssigned,
            totalUsed,
            available: totalAssigned - totalUsed,
            usagePercentage: totalAssigned > 0 ? Math.round((totalUsed / totalAssigned) * 100) : 0
          },
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalUsage: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Get usage within this assignment range
    const usage = await ConsignmentUsage.find({
      assignmentType: 'courier_boy',
      entityId: courierBoyId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsage = await ConsignmentUsage.countDocuments({
      assignmentType: 'courier_boy',
      entityId: courierBoyId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    });

    const fullUsed = await ConsignmentUsage.countDocuments({
      assignmentType: 'courier_boy',
      entityId: courierBoyId,
      consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
    });

    res.json({
      success: true,
      data: {
        assignment: {
          _id: assignment._id,
          assignmentType: 'courier_boy',
          assignedToName: assignment.assignedToName,
          assignedToEmail: assignment.assignedToEmail,
          startNumber: assignment.startNumber,
          endNumber: assignment.endNumber,
          totalNumbers: assignment.totalNumbers,
          assignedAt: assignment.assignedAt,
          notes: assignment.notes,
          courierBoy: assignment.courierBoyId
        },
        usage,
        statistics: {
          totalAssigned: assignment.totalNumbers,
          totalUsed: fullUsed,
          available: assignment.totalNumbers - fullUsed,
          usagePercentage: assignment.totalNumbers > 0 ? Math.round((fullUsed / assignment.totalNumbers) * 100) : 0
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsage / limit),
          totalUsage,
          hasNextPage: page < Math.ceil(totalUsage / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get courier boy consignment usage error:', error);
    res.status(500).json({ error: 'Failed to get courier boy consignment usage.' });
  }
});


// Get office users for consignment assignment
router.get('/consignment/office-users', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const OfficeUser = (await import('../models/OfficeUser.js')).default;
    const officeUsers = await OfficeUser.find({ isActive: true })
      .select('_id name email role department')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: officeUsers
    });

  } catch (error) {
    console.error('Get office users error:', error);
    res.status(500).json({ error: 'Failed to fetch office users.' });
  }
});

// Get medicine users for consignment assignment
router.get('/consignment/medicine-users', authenticateAdmin, async (req, res) => {
  // Check if admin has consignment management permission
  if (!req.admin.hasPermission('consignmentManagement')) {
    return res.status(403).json({
      error: 'Access denied. Consignment management permission required.'
    });
  }
  try {
    const MedicineUser = (await import('../models/MedicineUser.js')).default;
    const { default: ConsignmentAssignment, ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');

    // Fetch medicine users and their assignments in parallel
    const [medicineUsers, assignments] = await Promise.all([
      MedicineUser.find({ isActive: true })
        .select('_id name email')
        .sort({ name: 1 })
        .lean(),
      ConsignmentAssignment.find({
        assignmentType: 'medicine',
        isActive: true
      })
        .populate('medicineUserId', 'name email')
        .lean()
    ]);

    // Map assignments to medicine users and calculate usage
    const medicineUsersWithAssignments = medicineUsers.map(async (user) => {
      const userAssignments = assignments.filter(assignment =>
        assignment.medicineUserId && String(assignment.medicineUserId._id) === String(user._id)
      ).map(async (assignment) => {
        // Calculate usage for this assignment
        const usedCount = await ConsignmentUsage.countDocuments({
          assignmentType: 'medicine',
          entityId: user._id,
          consignmentNumber: { $gte: assignment.startNumber, $lte: assignment.endNumber }
        });

        const totalNumbers = assignment.totalNumbers;
        const usagePercentage = totalNumbers > 0 ? Math.round((usedCount / totalNumbers) * 100) : 0;

        return {
          ...assignment,
          usedCount,
          availableCount: totalNumbers - usedCount,
          usagePercentage
        };
      });

      // Wait for all usage calculations to complete
      const resolvedAssignments = await Promise.all(userAssignments);

      return {
        ...user,
        consignmentAssignments: resolvedAssignments,
        hasAssignments: resolvedAssignments.length > 0
      };
    });

    // Wait for all medicine users to be processed
    const finalMedicineUsers = await Promise.all(medicineUsersWithAssignments);

    res.json({
      success: true,
      data: finalMedicineUsers
    });

  } catch (error) {
    console.error('Get medicine users error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine users.' });
  }
});

// Send manifest PDF via email
router.post('/send-manifest', authenticateAdmin, async (req, res) => {
  try {
    const { email, route, rows, sentAt } = req.body;
    if (!email || !route || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'Missing email, route or rows' });
    }

    const emailService = (await import('../services/emailService.js')).default;

    // Build HTML for PDF
    const title = 'Manifest';
    const dateStr = sentAt || new Date().toISOString();
    const dateOnly = new Date(dateStr).toLocaleDateString();
    const tableRows = rows.map((r, idx) => `
      <tr>
        <td style="border:1px solid #D1D5DB;padding:8px;">${idx + 1}</td>
        <td style="border:1px solid #D1D5DB;padding:8px;">${r.consignment || ''}</td>
        <td style="border:1px solid #D1D5DB;padding:8px;">${r.weight ?? ''}</td>
        <td style="border:1px solid #D1D5DB;padding:8px;">${typeof r.units === 'number' ? r.units : 1}</td>
      </tr>
    `).join('');
    const totalWeightValue = rows.reduce((s, r) => s + (typeof r.weight === 'number' ? r.weight : 0), 0);
    const totalUnitsValue = rows.reduce((s, r) => s + (typeof r.units === 'number' ? r.units : 1), 0);

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
            .meta { color:#6B7280; font-size:12px; }
            table { width:100%; border-collapse:collapse; }
            th { background:#F9FAFB; text-align:left; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">Manifest</h2>
          </div>
          <div class="meta">Route: <strong>${route}</strong> | Total Consignments: <strong>${rows.length}</strong></div>
          <table style="margin-top:12px;">
            <thead>
              <tr>
                <th style="border:1px solid #D1D5DB;padding:8px;">S/N</th>
                <th style="border:1px solid #D1D5DB;padding:8px;">Consignment No</th>
                <th style="border:1px solid #D1D5DB;padding:8px;">Weight (kg)</th>
                <th style="border:1px solid #D1D5DB;padding:8px;">Units</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <td style=\"border:1px solid #D1D5DB;padding:8px;\"></td>
                <td style=\"border:1px solid #D1D5DB;padding:8px;text-align:right;font-weight:600;\">Total</td>
                <td style=\"border:1px solid #D1D5DB;padding:8px;font-weight:600;\">${totalWeightValue}</td>
                <td style=\"border:1px solid #D1D5DB;padding:8px;font-weight:600;\">${totalUnitsValue}</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:14px; font-size:12px; color:#374151;">Date: <strong>${dateOnly}</strong></div>
        </body>
      </html>
    `;

    let pdfBuffer;
    try {
      const puppeteer = (await import('puppeteer')).default;
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' } });
      await browser.close();
    } catch (puppeteerErr) {
      console.warn('Puppeteer failed, falling back to html-pdf:', puppeteerErr?.message);
      const pdfModule = await import('html-pdf');
      const pdfCreate = pdfModule.default?.create || pdfModule.create;
      pdfBuffer = await new Promise((resolve, reject) => {
        try {
          pdfCreate(html, { format: 'A4', border: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' } }).toBuffer((err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    const subject = `Bag Manifest - ${route}`;
    const emailHtml = `<p>Please find attached the manifest sent on ${dateOnly}.</p>`;
    const text = `Manifest attached. Sent on ${dateOnly}`;

    await emailService.sendEmailWithPdfAttachment({
      to: email,
      subject,
      html: emailHtml,
      text,
      pdfBuffer,
      filename: `manifest_${Date.now()}.pdf`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('send-manifest error', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate and send quotation PDF
router.post('/generate-quotation', authenticateAdmin, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      weight,
      ratePerKg,
      gstRate,
      additionalCharges
    } = req.body;

    // Validation
    if (!customerName || !customerEmail || !origin || !destination || !weight) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerName, customerEmail, origin, destination, weight'
      });
    }

    const emailService = (await import('../services/emailService.js')).default;

    // Calculate amounts
    const weightNum = parseFloat(weight);
    const ratePerKgNum = parseFloat(ratePerKg) || 45;
    const gstRateNum = parseFloat(gstRate) || 18;

    const baseAmount = weightNum * ratePerKgNum;
    const additionalChargesTotal = (additionalCharges || []).reduce((sum, charge) => {
      return sum + (parseFloat(charge.amount) || 0);
    }, 0);

    const subtotal = baseAmount + additionalChargesTotal;
    const gstAmount = (subtotal * gstRateNum) / 100;
    const totalAmount = subtotal + gstAmount;

    // Generate current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Generate valid until date (7 days from now)
    const validUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Build HTML for quotation PDF - Exact Replica of Reference
    const pathModule = await import('path');
    const fsModule = await import('fs');
    const path = pathModule.default || pathModule;
    const fs = fsModule.default || fsModule;
    const logoPath = path.join(process.cwd(), 'Frontend', 'public', 'ocl-logo.png');
    let logoBase64 = '';
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.warn('Logo file not found, using placeholder');
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quotation - ${customerName}</title>
          <style>
            @page {
              margin: 10mm 30mm;
              size: A4;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background: white;
              color: #000;
              line-height: 1.5;
              font-size: 12px;
            }
            .document {
              background: white;
              max-width: 100%;
              margin: 0 auto;
              padding: 0 50px;
            }
            .header {
              background:rgb(142, 142, 143);
              padding: 15px 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin: 0 -30px;
              width: calc(100% + 60px);
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
              flex: 0 0 auto;
            }
            .logo-img {
              height: 50px;
              width: auto;
            }
            .header-center {
              text-align: center;
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .company-name {
              font-size: 18px;
              font-weight: 600;
              color: #fff;
              margin: 0;
            }
            .company-tagline {
              font-size: 11px;
              color: #fff;
              margin: 3px 0 0 0;
            }
            .quotation-box {
              background:rgb(76, 77, 78);
              padding: 12px 30px;
              border-radius: 6px;
              margin: 10px 0 0 0;
              display: inline-block;
              width: auto;
            }
            .quotation-title {
              font-size: 18px;
              font-weight: 600;
              color: #fff;
              margin: 0;
            }
            .header-right {
              text-align: right;
              flex: 0 0 auto;
            }
            .quotation-date {
              font-size: 12px;
              color: #fff;
              margin: 2px 0;
            }
            .header-line {
              height: 1px;
              background: #000;
              width: 100%;
              margin: 15px 0 20px 0;
            }
            .two-column-section {
              display: table;
              width: 100%;
              margin: 25px 0 20px 0;
            }
            .column-left {
              display: table-cell;
              width: 50%;
              vertical-align: top;
              padding: 0 15px 0 0;
            }
            .column-right {
              display: table-cell;
              width: 50%;
              vertical-align: top;
              padding: 0 0 0 15px;
            }
            .column-separator {
              width: 1px;
              background: #000;
              display: table-cell;
            }
            .section-title {
              font-size: 13px;
              font-weight: 600;
              color: #000;
              margin-bottom: 10px;
            }
            .info-item {
              margin-bottom: 8px;
              font-size: 13px;
            }
            .info-label {
              color: #000;
              display: inline;
              font-weight: normal;
            }
            .info-value {
              color: #000;
              font-weight: normal;
              display: inline;
            }
            .pricing-section {
              margin: 20px 0;
            }
            .pricing-title {
              font-size: 13px;
              font-weight: 600;
              color: #000;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .pricing-table th {
              background: #1e40af;
              color: white;
              padding: 10px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
            }
            .pricing-table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
              color: #000;
            }
            .pricing-table tr:nth-child(even) {
              background: #f9fafb;
            }
            .total-row {
              font-weight: 700;
              font-style: italic;
            }
            .total-row td {
              border-bottom: none;
              padding-top: 15px;
            }
            .terms-section {
              margin: 20px 0;
              background: #f9fafb;
              padding: 15px;
            }
            .terms-title {
              font-size: 13px;
              font-weight: 600;
              color: #000;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .terms-list {
              list-style: decimal;
              padding-left: 25px;
              color: #000;
              font-size: 11px;
              line-height: 1.6;
            }
            .terms-list li {
              margin-bottom: 6px;
            }
            .footer-line {
              height: 1px;
              background: #000;
              width: 100%;
              margin: 20px 0 15px 0;
            }
            .approval-text {
              color: #000;
              font-size: 11px;
              line-height: 1.5;
              margin: 0 0 15px 0;
              text-align: center;
            }
            .footer {
              background: white;
              padding: 10px 0;
              text-align: center;
            }
            .footer-company {
              font-size: 12px;
              font-weight: 600;
              color: #000;
              margin-bottom: 8px;
            }
            .footer-contact {
              font-size: 11px;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <div class="header-left">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" alt="OCL Logo" />` : ''}
              </div>
              <div class="header-center">
                <h1 class="company-name">Our Courier & Logistics</h1>
                <p class="company-tagline">Reliable • Fast • Secure</p>
                <div class="quotation-box">
                  <div class="quotation-title">Quotation</div>
                </div>
              </div>
              <div class="header-right">
                <div class="quotation-date">Date: ${formattedDate}</div>
                <div class="quotation-date">Valid Until: ${validUntilDate}</div>
              </div>
            </div>
            
            <div class="two-column-section">
              <div class="column-left">
                <div class="section-title">Customer Details:</div>
                <div class="info-item">
                  <span class="info-label">Name: </span>
                  <span class="info-value">${customerName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email Address: </span>
                  <span class="info-value">${customerEmail}</span>
                </div>
                ${customerPhone ? `
                <div class="info-item">
                  <span class="info-label">Phone Number: </span>
                  <span class="info-value">${customerPhone}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Quotation Date: </span>
                  <span class="info-value">${formattedDate}</span>
                </div>
              </div>
              <div class="column-separator"></div>
              <div class="column-right">
                <div class="info-item">
                  <span class="info-label">Route: </span>
                  <span class="info-value">${origin} → ${destination}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Weight: </span>
                  <span class="info-value">${weight} kg</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rate per kg: </span>
                  <span class="info-value">₹${ratePerKgNum} Express</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Service Type: </span>
                  <span class="info-value">Delivery</span>
                </div>
              </div>
            </div>

            <div class="pricing-section">
              <div class="pricing-title">Pricing Breakdown:</div>
              <table class="pricing-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Base Shipping Cost</td>
                    <td>${weight} kg</td>
                    <td>₹${ratePerKgNum}/kg</td>
                    <td>₹${baseAmount.toFixed(2)}</td>
                  </tr>
                  ${additionalCharges && additionalCharges.length > 0 ? additionalCharges.map(charge => `
                  <tr>
                    <td>${charge.description || 'Additional Charge'}</td>
                    <td>1</td>
                    <td>₹${parseFloat(charge.amount || 0).toFixed(2)}</td>
                    <td>₹${parseFloat(charge.amount || 0).toFixed(2)}</td>
                  </tr>
                  `).join('') : ''}
                  ${additionalCharges && additionalCharges.length > 0 ? `
                  <tr>
                    <td colspan="3"><strong>Subtotal</strong></td>
                    <td><strong>₹${subtotal.toFixed(2)}</strong></td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td>GST (${gstRateNum}%)</td>
                    <td>-</td>
                    <td>${gstRateNum}%</td>
                    <td>₹${gstAmount.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3"><strong>TOTAL AMOUNT</strong></td>
                    <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="terms-section">
              <div class="terms-title">Terms & Conditions</div>
              <ol class="terms-list">
                <li>This quotation is valid for 7 working days from the date of issue</li>
                <li>Payment terms: 50% advance payment required, balance on delivery</li>
                <li>Estimated delivery time: 3-5 working days for domestic shipments</li>
                <li>Insurance coverage up to ₹50,000 included in the quoted price</li>
                <li>Real-time tracking number will be provided after dispatch</li>
                <li>Any additional charges will be communicated and approved before dispatch</li>
                <li>All prices are inclusive of GST and applicable taxes</li>
                <li>Delivery confirmation required upon receipt of goods</li>
              </ol>
            </div>

            <div class="footer-line"></div>
            
            <div class="approval-text">
              This quotation is subject to your approval and acceptance of the above terms and conditions.<br>
              Please sign and return this document to confirm your order.
            </div>

            <div class="footer">
              <div class="footer-company">Our Courier & Logistics</div>
              <div class="footer-contact">info@oclcourier.com +91 9876543210 www.oclcourier.com</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF
    let pdfBuffer;
    try {
      const puppeteer = (await import('puppeteer')).default;
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
      });
      await browser.close();
    } catch (puppeteerErr) {
      console.warn('Puppeteer failed, falling back to html-pdf:', puppeteerErr?.message);
      const pdfModule = await import('html-pdf');
      const pdfCreate = pdfModule.default?.create || pdfModule.create;
      pdfBuffer = await new Promise((resolve, reject) => {
        try {
          pdfCreate(html, {
            format: 'A4',
            border: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
          }).toBuffer((err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    // Send email with PDF attachment
    const subject = `Quotation for Courier Service - ${origin} to ${destination}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Quotation Request</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your interest in our courier and logistics services. Please find attached the detailed quotation for your service from ${origin} to ${destination}.</p>
        <p><strong>Service Details:</strong></p>
        <ul>
          <li>Route: ${origin} to ${destination}</li>
          <li>Weight: ${weight} kg</li>
          <li>Base Amount: ₹${baseAmount.toFixed(2)}</li>
          ${additionalCharges && additionalCharges.length > 0 ? `
          <li>Additional Charges: ₹${additionalChargesTotal.toFixed(2)}</li>
          <li>Subtotal: ₹${subtotal.toFixed(2)}</li>
          ` : ''}
          <li>GST (${gstRateNum}%): ₹${gstAmount.toFixed(2)}</li>
          <li><strong>Total Amount: ₹${totalAmount.toFixed(2)}</strong></li>
        </ul>
        <p>This quotation is valid until ${validUntilDate}. Please feel free to contact us if you have any questions or need any clarification.</p>
        <p>We look forward to serving you.</p>
        <p>Best regards,<br>Our Courier & Logistics Team</p>
      </div>
    `;
    const text = `Quotation for courier service from ${origin} to ${destination}. Total amount: ₹${totalAmount.toFixed(2)}. Valid until ${validUntilDate}.`;

    await emailService.sendEmailWithPdfAttachment({
      to: customerEmail,
      subject,
      html: emailHtml,
      text,
      pdfBuffer,
      filename: `quotation_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    });

    res.json({
      success: true,
      message: 'Quotation PDF generated and sent successfully',
      totalAmount: totalAmount.toFixed(2)
    });
  } catch (error) {
    console.error('generate-quotation error', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/medicine/bookings - Get all medicine bookings (admin access)
router.get('/medicine/bookings', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 50, page = 1, medicineUserId } = req.query;

    const query = {};
    if (medicineUserId) {
      query.medicineUserId = medicineUserId;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await MedicineBooking.find(query)
      .populate('coloaderId', 'phoneNumber busNumber')
      .populate('assignedCourierBoyId', 'fullName email phone area')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await MedicineBooking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching medicine bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch medicine bookings',
      message: error.message
    });
  }
});

// PATCH /api/admin/medicine/bookings/:id/status - Update medicine booking status (admin access)
router.patch('/medicine/bookings/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        message: 'Please provide a status to update'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'in_transit', 'arrived', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await MedicineBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'The requested booking does not exist'
      });
    }

    // If status is being updated to "arrived", set the permanent scan timestamp (only if not already set)
    if (status === 'arrived' && !booking.arrivedMedicineScannedAt) {
      booking.arrivedMedicineScannedAt = new Date();
    }

    // Update status using the model method
    await booking.updateStatus(status);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference,
        arrivedMedicineScannedAt: booking.arrivedMedicineScannedAt
      }
    });
  } catch (error) {
    console.error('Error updating medicine booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      message: error.message
    });
  }
});

// PUT /api/admin/medicine/bookings/:id/assign-delivery-courier - Assign courier boy to medicine booking for delivery
router.put('/medicine/bookings/:id/assign-delivery-courier', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { courierBoyId } = req.body;

    if (!courierBoyId) {
      return res.status(400).json({
        success: false,
        error: 'Courier boy ID is required'
      });
    }

    const MedicineBooking = (await import('../models/MedicineBooking.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const MedicineUser = (await import('../models/MedicineUser.js')).default;

    // Find medicine booking
    const booking = await MedicineBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Medicine booking not found'
      });
    }

    // Check if booking status is 'arrived'
    if (booking.status !== 'arrived') {
      return res.status(400).json({
        success: false,
        error: 'Only arrived bookings can be assigned for delivery',
        message: `Booking status is ${booking.status}, must be 'arrived'`
      });
    }

    // Find courier boy
    const courierBoy = await CourierBoy.findById(courierBoyId);
    if (!courierBoy) {
      return res.status(404).json({
        success: false,
        error: 'Courier boy not found'
      });
    }

    // Check if courier boy is approved
    if (courierBoy.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved courier boys can be assigned'
      });
    }

    // Prepare order data for AssignedCourier with complete origin and destination details
    const orderData = {
      medicineBookingId: booking._id,
      consignmentNumber: booking.consignmentNumber || 0,
      bookingReference: booking.bookingReference || '',
      originData: {
        name: booking.origin.name || '',
        mobileNumber: booking.origin.mobileNumber || '',
        email: booking.origin.email || '',
        companyName: booking.origin.companyName || '',
        flatBuilding: booking.origin.flatBuilding || '',
        locality: booking.origin.locality || '',
        landmark: booking.origin.landmark || '',
        pincode: booking.origin.pincode || '',
        city: booking.origin.city || '',
        district: booking.origin.district || '',
        state: booking.origin.state || '',
        gstNumber: booking.origin.gstNumber || '',
        addressType: booking.origin.addressType || 'Home'
      },
      destinationData: {
        name: booking.destination.name || '',
        mobileNumber: booking.destination.mobileNumber || '',
        email: booking.destination.email || '',
        companyName: booking.destination.companyName || '',
        flatBuilding: booking.destination.flatBuilding || '',
        locality: booking.destination.locality || '',
        landmark: booking.destination.landmark || '',
        pincode: booking.destination.pincode || '',
        city: booking.destination.city || '',
        district: booking.destination.district || '',
        state: booking.destination.state || '',
        gstNumber: booking.destination.gstNumber || '',
        addressType: booking.destination.addressType || 'Home'
      },
      shipmentData: {
        natureOfConsignment: booking.shipment.natureOfConsignment,
        actualWeight: booking.shipment.actualWeight,
        totalPackages: booking.package.totalPackages
      },
      invoiceData: {
        invoiceValue: booking.invoice.invoiceValue,
        invoiceNumber: booking.invoice.invoiceNumber
      },
      chargesData: {
        grandTotal: booking.charges?.grandTotal || ''
      }
    };

    // Get destination company name for grouping
    const destinationCompanyName = booking.destination.companyName || '';

    // Create or update AssignedCourier record
    const AssignedCourier = (await import('../models/AssignedCourier.js')).default;

    // Find existing AssignedCourier record with same courier, work type, and destination company name
    // Find records where all orders have the same destination company name as the new order
    // First, find all potential records
    const potentialRecords = await AssignedCourier.find({
      'assignedCourier.courierBoyId': courierBoy._id,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
      work: 'delivery',
      type: 'medicine'
    });

    // Filter to find a record where all orders have the same destination company name
    let assignedCourierRecord = potentialRecords.find(record => {
      if (record.orders.length === 0) return false;
      // Check if all orders in this record have the same destination company name as the new order
      return record.orders.every(order =>
        (order.destinationData?.companyName || '') === destinationCompanyName
      );
    });

    // If no record found with matching destination company name, create a new one
    if (!assignedCourierRecord) {
      assignedCourierRecord = await AssignedCourier.create({
        medicineUserId: booking.medicineUserId || null,
        type: 'medicine',
        work: 'delivery',
        status: 'assigned',
        assignedCourier: {
          courierBoyId: courierBoy._id,
          name: courierBoy.fullName,
          phone: courierBoy.phone,
          email: courierBoy.email || '',
          area: courierBoy.area || ''
        },
        assignedBy: req.admin._id,
        assignedAt: new Date(),
        orders: [orderData]
      });
    } else {
      // Check if order already exists
      const orderExists = assignedCourierRecord.orders.some(
        o => o.medicineBookingId && o.medicineBookingId.toString() === booking._id.toString()
      );

      if (!orderExists) {
        assignedCourierRecord.orders.push(orderData);
        await assignedCourierRecord.save();
      }
    }

    // Assign courier boy to medicine booking
    booking.assignedCourierBoyId = courierBoy._id;
    booking.assignedCourierBoyAt = new Date();
    booking.status = 'out_for_delivery'; // Update status from 'arrived' to 'out_for_delivery'

    try {
      await booking.save();
    } catch (saveError) {
      console.error('Error saving medicine booking after courier assignment:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save courier assignment',
        details: saveError.message
      });
    }

    console.log(`🚚 Admin assigned courier boy to medicine booking ${id} for delivery`, {
      bookingId: booking._id,
      consignmentNumber: booking.consignmentNumber,
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      medicineUserId: booking.medicineUserId,
      assignedCourierRecordId: assignedCourierRecord._id,
      updatedBy: req.admin.username,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Courier boy assigned successfully for delivery',
      booking: {
        _id: booking._id,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference
      },
      assignedCourier: {
        id: courierBoy._id,
        name: courierBoy.fullName,
        phone: courierBoy.phone,
        email: courierBoy.email
      },
      assignedCourierRecord: {
        _id: assignedCourierRecord._id,
        ordersCount: assignedCourierRecord.orders.length,
        type: assignedCourierRecord.type,
        work: assignedCourierRecord.work
      }
    });

  } catch (error) {
    console.error('Assign courier boy to medicine booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign courier boy',
      message: error.message
    });
  }
});

// ==================== Courier Complaints Management ====================

// Get all courier complaints (admin)
router.get('/courier-complaints', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { consignmentNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'corporateInfo.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await CourierComplaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('respondedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('corporateId', 'companyName email contactNumber')
      .lean();

    const totalCount = await CourierComplaint.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get courier complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courier complaints'
    });
  }
});

// Get courier complaint statistics (admin)
router.get('/courier-complaints/stats', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const stats = await CourierComplaint.getStats();

    const formattedStats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      const statusKey = stat._id.toLowerCase().replace(' ', '');
      if (formattedStats.hasOwnProperty(statusKey)) {
        formattedStats[statusKey] = stat.count;
      }
    });

    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get courier complaint stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaint statistics'
    });
  }
});

// Get a specific courier complaint (admin)
router.get('/courier-complaints/:id', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const complaint = await CourierComplaint.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('corporateId', 'companyName email contactNumber')
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
    console.error('Get courier complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaint'
    });
  }
});

// Update courier complaint (admin - can update status and response)
router.put('/courier-complaints/:id', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const { status, response, assignedTo } = req.body;
    const adminId = req.admin._id;

    const complaint = await CourierComplaint.findById(req.params.id);

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

    // Update response if provided (for backward compatibility)
    if (response) {
      complaint.response = response.trim();
      complaint.responseDate = new Date();
      complaint.respondedBy = adminId;
    }

    // Update assigned to if provided
    if (assignedTo) {
      complaint.assignedTo = assignedTo;
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const updatedComplaint = await CourierComplaint.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('corporateId', 'companyName email contactNumber')
      .lean();

    console.log(`✅ Admin updated courier complaint ${req.params.id}`, {
      updatedBy: req.admin.username,
      status: complaint.status,
      hasResponse: !!complaint.response,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: updatedComplaint
    });
  } catch (error) {
    console.error('Update courier complaint error:', error);
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

// Add message to complaint chat (admin)
router.post('/courier-complaints/:id/messages', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const { message, status } = req.body;
    const adminId = req.admin._id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const complaint = await CourierComplaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Add message to chat
    complaint.messages = complaint.messages || [];
    complaint.messages.push({
      message: message.trim(),
      senderType: 'admin',
      senderId: adminId,
      senderName: req.admin.name || req.admin.username
    });

    // Update status if provided
    if (status) {
      const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (validStatuses.includes(status)) {
        complaint.status = status;
      }
    } else if (complaint.status === 'Open') {
      // Auto-update to In Progress when admin responds
      complaint.status = 'In Progress';
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const updatedComplaint = await CourierComplaint.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('corporateId', 'companyName email contactNumber')
      .lean();

    res.json({
      success: true,
      message: 'Message added successfully',
      data: updatedComplaint
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message'
    });
  }
});

// Get complaint with messages (admin)
router.get('/courier-complaints/:id/messages', authenticateAdmin, async (req, res) => {
  try {
    const CourierComplaint = (await import('../models/CourierComplaint.js')).default;
    const complaint = await CourierComplaint.findById(req.params.id)
      .populate('respondedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('corporateId', 'companyName email contactNumber')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: complaint._id,
        messages: complaint.messages || [],
        status: complaint.status
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Get list of approved courier boys for assignment
router.get('/courier-boys/list', authenticateAdmin, async (req, res) => {
  try {
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const courierBoys = await CourierBoy.find({ status: 'approved' })
      .select('_id fullName email phone area pincode locality building')
      .sort({ fullName: 1 })
      .lean();

    res.json({
      success: true,
      data: courierBoys
    });
  } catch (error) {
    console.error('Get courier boys list error:', error);
    res.status(500).json({ error: 'Failed to fetch courier boys list.' });
  }
});

// Get courier boy payment data (amounts from paid orders)
router.get('/courier-boys/payments', authenticateAdmin, async (req, res) => {
  try {
    const Tracking = (await import('../models/Tracking.js')).default;
    
    // Find all trackings with OFD courierBoyId
    const trackings = await Tracking.find({
      'OFD.0': { $exists: true }
    })
      .select('OFD booked consignmentNumber bookingReference')
      .lean();

    // Group by courierBoyId and calculate totals
    const paymentMap = new Map();
    
    trackings.forEach(tracking => {
      if (!tracking.OFD || !Array.isArray(tracking.OFD) || tracking.OFD.length === 0) return;
      if (!tracking.booked || !Array.isArray(tracking.booked) || tracking.booked.length === 0) return;
      
      const ofdEntry = tracking.OFD[0];
      const bookedEntry = tracking.booked[0];
      
      // Check if paymentStatus is 'paid'
      if (!bookedEntry || bookedEntry.paymentStatus !== 'paid') return;
      
      // Get courierBoyId from OFD entry
      const courierBoyId = ofdEntry?.courierBoyId;
      if (!courierBoyId) return;
      
      const courierBoyIdStr = courierBoyId.toString();
      const amount = bookedEntry?.invoiceData?.finalPrice || 0;
      
      if (amount <= 0) return; // Skip if no amount
      
      if (!paymentMap.has(courierBoyIdStr)) {
        paymentMap.set(courierBoyIdStr, {
          courierBoyId: courierBoyIdStr,
          totalAmount: 0,
          orders: []
        });
      }
      
      const paymentData = paymentMap.get(courierBoyIdStr);
      paymentData.totalAmount += amount;
      paymentData.orders.push({
        consignmentNumber: tracking.consignmentNumber,
        bookingReference: tracking.bookingReference,
        amount: amount,
        receiverName: bookedEntry?.destinationData?.name || 'N/A',
        receiverPhone: bookedEntry?.destinationData?.mobileNumber || 'N/A',
        route: `${bookedEntry?.originData?.city || 'N/A'} → ${bookedEntry?.destinationData?.city || 'N/A'}`,
        bookingDate: bookedEntry?.bookingDate || tracking.createdAt
      });
    });

    res.json({
      success: true,
      data: Array.from(paymentMap.values())
    });
  } catch (error) {
    console.error('Get courier boy payments error:', error);
    res.status(500).json({ error: 'Failed to fetch courier boy payments.' });
  }
});

// Assign courier boy for delivery (OFP)
router.post('/tracking/delivery/assign-courier-boy', authenticateAdmin, async (req, res) => {
  try {
    const { trackingId, courierBoyId } = req.body;

    if (!trackingId || !courierBoyId) {
      return res.status(400).json({ error: 'Tracking ID and Courier Boy ID are required.' });
    }

    const Tracking = (await import('../models/Tracking.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    const tracking = await Tracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found.' });
    }

    const courierBoy = await CourierBoy.findById(courierBoyId).lean();
    if (!courierBoy) {
      return res.status(404).json({ error: 'Courier boy not found.' });
    }

    // Update status
    tracking.currentStatus = 'OFP';

    // Create OFD entry
    const ofdEntry = {
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      courierBoyPhone: courierBoy.phone,
      assignedAt: new Date(),
      assignedBy: req.admin._id,
      assignedByName: req.admin.name,
      consignmentNumber: tracking.consignmentNumber,
      receiverName: tracking.booked?.[0]?.destinationData?.name || tracking.booked?.[0]?.receiverName,
      destination: tracking.booked?.[0]?.destinationData,
      paymentStatus: tracking.booked?.[0]?.paymentData?.paymentStatus,
      finalPrice: tracking.booked?.[0]?.invoiceData?.finalPrice,
      paymentType: tracking.booked?.[0]?.paymentData?.paymentType
    };

    if (!tracking.OFD) {
      tracking.OFD = [];
    }
    tracking.OFD.push(ofdEntry);

    // Update history
    tracking.statusHistory.push({
      status: 'OFP',
      timestamp: new Date(),
      notes: `Assigned to courier boy ${courierBoy.fullName} for delivery`
    });

    await tracking.save();

    res.json({
      success: true,
      message: 'Courier boy assigned successfully.',
      data: tracking
    });

  } catch (error) {
    console.error('Assign courier boy error:', error);
    res.status(500).json({ error: 'Failed to assign courier boy.' });
  }
});

// Assign courier boy to customer booking
router.put('/customer-booking/:bookingId/assign-pickup-courier', authenticateAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { courierBoyId } = req.body;

    if (!courierBoyId) {
      return res.status(400).json({
        success: false,
        error: 'Courier boy ID is required'
      });
    }

    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const CustomerCourierBoy = (await import('../models/CustomerCourierBoy.js')).default;

    // Find customer booking
    const booking = await CustomerBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Customer booking not found'
      });
    }

    // Find courier boy
    const courierBoy = await CourierBoy.findById(courierBoyId);
    if (!courierBoy) {
      return res.status(404).json({
        success: false,
        error: 'Courier boy not found'
      });
    }

    // Check if courier boy is approved
    if (courierBoy.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved courier boys can be assigned'
      });
    }

    // Check if booking already has a courier assigned
    const existingAssignment = await CustomerCourierBoy.findOne({
      customerBookingId: booking._id,
      status: { $in: ['assigned', 'picked'] }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'This booking already has a courier boy assigned'
      });
    }

    // Prepare order details
    const orderDetails = {
      origin: booking.origin || {},
      destination: booking.destination || {},
      shipment: booking.shipment || {},
      shippingMode: booking.shippingMode || '',
      serviceType: booking.serviceType || '',
      calculatedPrice: booking.calculatedPrice || null,
      totalAmount: booking.totalAmount || null,
      actualWeight: booking.actualWeight || null,
      volumetricWeight: booking.volumetricWeight || null,
      chargeableWeight: booking.chargeableWeight || null,
      paymentStatus: booking.paymentStatus || 'pending',
      paymentMethod: booking.paymentMethod || ''
    };

    // Create CustomerCourierBoy record
    const assignedAt = new Date();
    const customerCourierAssignment = new CustomerCourierBoy({
      customerBookingId: booking._id,
      consignmentNumber: booking.consignmentNumber,
      bookingReference: booking.bookingReference || booking.consignmentNumber?.toString(),
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      courierBoyEmail: courierBoy.email || '',
      courierBoyPhone: courierBoy.phone,
      courierBoyArea: courierBoy.area || '',
      orderDetails: orderDetails,
      assignedBy: req.admin._id,
      adminName: req.admin.name || req.admin.email || 'Admin',
      adminEmail: req.admin.email || '',
      AssignedCourierBoyAt: assignedAt,
      status: 'assigned',
      workType: 'pickup'
    });

    await customerCourierAssignment.save();

    // Update CustomerBooking
    booking.currentStatus = 'pickup'; // Change from "booked" to "pickup" (status for pickup assigned)
    
    // Only set assignedCourierBoy if it doesn't exist or is empty
    if (!booking.assignedCourierBoy || !booking.assignedCourierBoy.courierBoyId) {
      booking.assignedCourierBoy = {
        courierBoyId: courierBoy._id,
        fullName: courierBoy.fullName,
        email: courierBoy.email || '',
        phone: courierBoy.phone
      };
    } else {
      // Update existing assignment
      booking.assignedCourierBoy.courierBoyId = courierBoy._id;
      booking.assignedCourierBoy.fullName = courierBoy.fullName;
      booking.assignedCourierBoy.email = courierBoy.email || '';
      booking.assignedCourierBoy.phone = courierBoy.phone;
    }
    
    booking.assignedCourierBoyAt = assignedAt;

    await booking.save();

    console.log(`✅ Courier boy assigned to customer booking: ${booking.consignmentNumber} - Courier: ${courierBoy.fullName}`);

    res.json({
      success: true,
      message: 'Courier boy assigned successfully',
      data: {
        assignmentId: customerCourierAssignment._id,
        bookingId: booking._id,
        consignmentNumber: booking.consignmentNumber,
        courierBoyName: courierBoy.fullName,
        assignedAt: assignedAt
      }
    });

  } catch (error) {
    console.error('❌ Error assigning courier boy to customer booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign courier boy',
      message: error.message || 'An error occurred while assigning courier boy'
    });
  }
});

// Assign courier boy for reserve orders (reassign from reserve status)
router.post('/tracking/reserve/assign-courier-boy', authenticateAdmin, async (req, res) => {
  try {
    const { trackingId, courierBoyId } = req.body;

    if (!trackingId || !courierBoyId) {
      return res.status(400).json({ error: 'Tracking ID and Courier Boy ID are required.' });
    }

    const Tracking = (await import('../models/Tracking.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    const tracking = await Tracking.findById(trackingId);
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found.' });
    }

    // Verify that the tracking is in "reserve" status
    if (tracking.currentStatus !== 'reserve') {
      return res.status(400).json({ 
        error: `Cannot assign courier boy. Order status is "${tracking.currentStatus}", expected "reserve".` 
      });
    }

    const courierBoy = await CourierBoy.findById(courierBoyId).lean();
    if (!courierBoy) {
      return res.status(404).json({ error: 'Courier boy not found.' });
    }

    // Update status from "reserve" to "OFP"
    tracking.currentStatus = 'OFP';

    // Create new OFD entry (this will replace/add to existing OFD array)
    const ofdEntry = {
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      courierBoyPhone: courierBoy.phone,
      assignedAt: new Date(),
      assignedBy: req.admin._id,
      assignedByName: req.admin.name,
      consignmentNumber: tracking.consignmentNumber,
      receiverName: tracking.booked?.[0]?.destinationData?.name || tracking.booked?.[0]?.receiverName,
      destination: tracking.booked?.[0]?.destinationData,
      paymentStatus: tracking.booked?.[0]?.paymentData?.paymentStatus,
      finalPrice: tracking.booked?.[0]?.invoiceData?.finalPrice,
      paymentType: tracking.booked?.[0]?.paymentData?.paymentType
    };

    // Replace the entire OFD array with the new assignment
    // This ensures the courier boy app sees the correct courier boy assignment
    // (whether it queries OFD[0] or the last entry)
    // Use set to explicitly replace the array, not add to it
    tracking.set('OFD', [ofdEntry]);
    tracking.markModified('OFD');

    // Update history
    if (!tracking.statusHistory) {
      tracking.statusHistory = [];
    }
    tracking.statusHistory.push({
      status: 'OFP',
      timestamp: new Date(),
      notes: `Reassigned to courier boy ${courierBoy.fullName} for delivery from reserve status`
    });

    await tracking.save();

    console.log(`✅ Courier boy reassigned from reserve by admin ${req.admin.name}: ${tracking.consignmentNumber} to ${courierBoy.fullName}`);

    res.json({
      success: true,
      message: 'Courier boy assigned successfully from reserve status.',
      data: tracking
    });

  } catch (error) {
    console.error('Assign courier boy from reserve error:', error);
    res.status(500).json({ error: 'Failed to assign courier boy from reserve.' });
  }
});

// Assign courier boy for delivery (Out For Delivery) - Customer Bookings
router.post('/customer-booking/delivery/assign-courier-boy', authenticateAdmin, async (req, res) => {
  try {
    const { bookingId, courierBoyId } = req.body;

    if (!bookingId || !courierBoyId) {
      return res.status(400).json({ error: 'Booking ID and Courier Boy ID are required.' });
    }

    const CustomerBooking = (await import('../models/CustomerBooking.js')).default;
    const CourierBoy = (await import('../models/CourierBoy.js')).default;

    const booking = await CustomerBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Customer booking not found.' });
    }

    // Verify that the booking is in "reached-hub" status
    if (booking.currentStatus !== 'reached-hub') {
      return res.status(400).json({ 
        error: `Cannot assign courier boy. Order status is "${booking.currentStatus}", expected "reached-hub".` 
      });
    }

    const courierBoy = await CourierBoy.findById(courierBoyId).lean();
    if (!courierBoy) {
      return res.status(404).json({ error: 'Courier boy not found.' });
    }

    // Update status from "reached-hub" to "out_for_delivery"
    booking.currentStatus = 'out_for_delivery';

    // Create OutForDelivery entry
    const outForDeliveryEntry = {
      courierBoyId: courierBoy._id,
      courierBoyName: courierBoy.fullName,
      courierBoyPhone: courierBoy.phone,
      courierBoyEmail: courierBoy.email || '',
      assignedAt: new Date(),
      assignedBy: req.admin._id,
      assignedByName: req.admin.name || req.admin.email || 'Admin',
      assignedByEmail: req.admin.email || '',
      consignmentNumber: booking.consignmentNumber,
      receiverName: booking.destination?.name || '',
      destination: booking.destination || {},
      paymentStatus: booking.paymentStatus || 'pending',
      finalPrice: booking.totalAmount || booking.calculatedPrice || 0,
      paymentType: booking.paymentMethod || '',
      notes: `Assigned to courier boy ${courierBoy.fullName} for delivery`
    };

    if (!booking.OutForDelivery) {
      booking.OutForDelivery = [];
    }
    booking.OutForDelivery.push(outForDeliveryEntry);

    // Update history
    booking.statusHistory.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      notes: `Assigned to courier boy ${courierBoy.fullName} for delivery`
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Courier boy assigned for delivery successfully.',
      data: booking
    });

  } catch (error) {
    console.error('Assign courier boy for delivery error:', error);
    res.status(500).json({ error: 'Failed to assign courier boy for delivery.' });
  }
});

export default router;