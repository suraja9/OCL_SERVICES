import express from 'express';
import mongoose from 'mongoose';
import MedicineUser from '../models/MedicineUser.js';
import MedicineBooking from '../models/MedicineBooking.js';
import MedicineManifest from '../models/MedicineManifest.js';
import MedicineColoader from '../models/MedicineColoader.js';
import MedicineSettlement from '../models/MedicineSettlement.js';
import MedicineOclCharge from '../models/MedicineOclCharge.js';
import MedicineCourierBoyAssigned from '../models/MedicineCourierBoyAssigned.js';
import { generateToken, validateLoginInput, authenticateMedicine } from '../middleware/auth.js';
import { uploadPackageImages, uploadInvoiceImages, uploadScreenshots, handleUploadError } from '../middleware/upload.js';
import S3Service from '../services/s3Service.js';
import ConsignmentAssignment from '../models/ConsignmentAssignment.js';
import { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import googleSheetsService from '../services/googleSheetsService.js';

const router = express.Router();

// POST /api/medicine/login
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginId = (email || username || '').toLowerCase().trim();

    const user = await MedicineUser.findOne({ email: loginId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await user.updateLoginInfo();
    const token = generateToken(user._id, 'medicine');
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Medicine login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/medicine/profile
router.get('/profile', authenticateMedicine, async (req, res) => {
  try {
    res.json({ success: true, user: req.medicine });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// POST /api/medicine/bookings - Create a new medicine booking
router.post('/bookings', async (req, res) => {
  try {
    console.log('Received medicine booking request:', req.body);
    
    const {
      medicineUserId,
      origin,
      destination,
      shipment,
      package: packageData,
      invoice,
      billing,
      charges,
      payment
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !shipment || !packageData || !invoice || !billing) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required booking information'
      });
    }

    // Validate billing.partyType is required
    if (!billing.partyType || !['sender', 'recipient'].includes(billing.partyType)) {
      return res.status(400).json({
        error: 'Invalid billing information',
        message: 'Please select who will pay (sender or recipient)'
      });
    }

    // Check if medicineUserId is provided (required for consignment number assignment)
    if (!medicineUserId) {
      return res.status(400).json({
        error: 'Medicine user ID required',
        message: 'You must be logged in to create a booking. Consignment numbers are assigned to medicine users.'
      });
    }

    // Check consignment availability first
    const assignments = await ConsignmentAssignment.find({
      assignmentType: 'medicine',
      medicineUserId: medicineUserId,
      isActive: true
    });
    
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No consignment numbers assigned',
        message: 'No consignment numbers assigned to your account. Please contact admin to get consignment numbers assigned.'
      });
    }

    // Check if any consignment numbers are available across all assignments
    const usedCount = await ConsignmentUsage.countDocuments({
      assignmentType: 'medicine',
      entityId: medicineUserId
    });
    
    const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.totalNumbers, 0);
    const availableCount = totalAssigned - usedCount;
    
    if (availableCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No consignment numbers available',
        message: 'All consignment numbers have been used. Please contact admin to get more consignment numbers assigned.'
      });
    }

    // Get next available consignment number for this medicine user
    let consignmentNumber;
    try {
      consignmentNumber = await ConsignmentAssignment.getNextConsignmentNumber('medicine', medicineUserId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'No consignment numbers available',
        message: error.message || 'No consignment numbers assigned to your account. Please contact admin.'
      });
    }

    // Helper function to sanitize empty strings to undefined
    const sanitizeString = (value) => {
      if (typeof value === 'string' && value.trim() === '') {
        return undefined;
      }
      return value && typeof value === 'string' ? value.trim() : value;
    };

    // Sanitize origin and destination fields - keep all fields but trim strings
    const sanitizedOrigin = {
      ...origin,
      name: origin.name ? origin.name.trim() : origin.name,
      mobileNumber: origin.mobileNumber ? origin.mobileNumber.trim() : origin.mobileNumber,
      email: origin.email ? origin.email.trim() : origin.email,
      locality: origin.locality ? origin.locality.trim() : origin.locality,
      pincode: origin.pincode ? origin.pincode.trim() : origin.pincode,
      city: origin.city ? origin.city.trim() : origin.city,
      district: origin.district ? origin.district.trim() : origin.district,
      state: origin.state ? origin.state.trim() : origin.state
    };

    const sanitizedDestination = {
      ...destination,
      name: destination.name ? destination.name.trim() : destination.name,
      mobileNumber: destination.mobileNumber ? destination.mobileNumber.trim() : destination.mobileNumber,
      email: destination.email ? destination.email.trim() : destination.email,
      locality: destination.locality ? destination.locality.trim() : destination.locality,
      pincode: destination.pincode ? destination.pincode.trim() : destination.pincode,
      city: destination.city ? destination.city.trim() : destination.city,
      district: destination.district ? destination.district.trim() : destination.district,
      state: destination.state ? destination.state.trim() : destination.state
    };

    // Validate required fields before creating payload
    const requiredFields = {
      'package.totalPackages': packageData?.totalPackages,
      'invoice.invoiceNumber': invoice?.invoiceNumber,
      'invoice.invoiceValue': invoice?.invoiceValue
    };

    console.log('Validating required fields:', {
      totalPackages: packageData?.totalPackages,
      invoiceNumber: invoice?.invoiceNumber,
      invoiceValue: invoice?.invoiceValue
    });

    const missingFields = [];
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        message: `Please provide the following required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    console.log('✅ All required fields validated successfully');

    // Create booking payload with sanitized data
    // Note: packageImages and invoiceImages should already be AWS S3 URLs from the upload endpoint
    const bookingPayload = {
      medicineUserId: medicineUserId,
      origin: sanitizedOrigin,
      destination: sanitizedDestination,
      shipment,
      package: {
        ...packageData,
        // Ensure totalPackages is a valid non-empty string
        totalPackages: packageData.totalPackages.trim(),
        // packageImages should be array of AWS S3 URLs (already uploaded)
        packageImages: Array.isArray(packageData.packageImages) ? packageData.packageImages : []
      },
      invoice: {
        ...invoice,
        // Ensure invoice fields are valid non-empty strings
        invoiceNumber: invoice.invoiceNumber.trim(),
        invoiceValue: invoice.invoiceValue.trim(),
        // invoiceImages should be array of AWS S3 URLs (already uploaded)
        invoiceImages: Array.isArray(invoice.invoiceImages) ? invoice.invoiceImages : [],
        // panCard and declarationForm should be AWS S3 URLs (already uploaded)
        panCard: invoice.panCard || null,
        declarationForm: invoice.declarationForm || null
      },
      billing,
      charges: charges || {},
      payment: payment || {}
    };

    console.log('📦 Booking payload prepared with AWS S3 URLs:', {
      packageImagesCount: bookingPayload.package.packageImages.length,
      invoiceImagesCount: bookingPayload.invoice.invoiceImages.length,
      hasPanCard: !!bookingPayload.invoice.panCard,
      hasDeclarationForm: !!bookingPayload.invoice.declarationForm
    });

    // Create new booking with consignment number as bookingReference
    const booking = new MedicineBooking({
      ...bookingPayload,
      consignmentNumber: consignmentNumber,
      bookingReference: consignmentNumber.toString(), // Use consignment number as booking reference
      status: 'Booked' // Explicitly set status to Booked for first booking
    });

    console.log('Before saving booking:', booking.status);
    console.log('Booking payload validation:', {
      totalPackages: booking.package?.totalPackages,
      invoiceNumber: booking.invoice?.invoiceNumber,
      invoiceValue: booking.invoice?.invoiceValue
    });
    
    await booking.save();
    console.log('After saving booking:', booking.status);

    // Record consignment usage
    const usage = new ConsignmentUsage({
      assignmentType: 'medicine',
      entityId: medicineUserId,
      medicineUserId: medicineUserId,
      consignmentNumber: consignmentNumber,
      bookingReference: consignmentNumber.toString(),
      bookingData: bookingPayload,
      freightCharges: charges?.grandTotal ? parseFloat(charges.grandTotal) : 0,
      totalAmount: charges?.grandTotal ? parseFloat(charges.grandTotal) : 0,
      paymentType: payment?.mode === 'TP' ? 'TP' : 'FP'
    });

    await usage.save();

    console.log(`✅ Medicine booking created: Medicine User ${medicineUserId} - Consignment: ${consignmentNumber}`);

    // Auto-sync to Google Sheets after booking creation
    try {
      // Fetch all bookings for this medicine user that have been dispatched (have consignment numbers)
      const allBookings = await MedicineBooking.find({
        medicineUserId: medicineUserId,
        consignmentNumber: { $exists: true, $ne: null }
      })
        .populate('coloaderId', 'name phoneNumber busNumber')
        .populate('manifestId', 'manifestNumber createdAt coloaderDocketNo')
        .sort({ createdAt: -1 })
        .lean();

      if (allBookings && allBookings.length > 0) {
        await googleSheetsService.syncMedicineBookings(allBookings);
        console.log(`✅ Auto-synced ${allBookings.length} bookings to Google Sheets after new booking creation`);
      }
    } catch (syncError) {
      console.error('Auto-sync to Google Sheets failed after booking creation:', syncError.message);
      // Don't fail the request if sync fails, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating medicine booking:', error);
    
    // Provide more detailed error messages for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors || {}).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check the following fields and try again',
        validationErrors: validationErrors,
        details: Object.keys(error.errors || {}).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value
        }))
      });
    }
    
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message || 'An unexpected error occurred. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// POST /api/medicine/bookings/upload-images - Upload package and invoice images to AWS S3
router.post('/bookings/upload-images', uploadScreenshots, handleUploadError, async (req, res) => {
  try {
    const result = {
      packageImages: [],
      invoiceImages: [],
      panCard: null,
      declarationForm: null
    };

    // Upload package images to S3
    if (req.files && req.files.packageImages) {
      const packageUploadResult = await S3Service.uploadMultipleFiles(
        req.files.packageImages,
        'uploads/medicine-bookings/package-images'
      );
      if (packageUploadResult.success) {
        result.packageImages = packageUploadResult.files;
        console.log(`✅ Uploaded ${result.packageImages.length} package image(s) to S3`);
      }
    }

    // Upload invoice images to S3
    if (req.files && req.files.invoiceImages) {
      const invoiceUploadResult = await S3Service.uploadMultipleFiles(
        req.files.invoiceImages,
        'uploads/medicine-bookings/invoice-images'
      );
      if (invoiceUploadResult.success) {
        result.invoiceImages = invoiceUploadResult.files;
        console.log(`✅ Uploaded ${result.invoiceImages.length} invoice image(s) to S3`);
      }
    }

    // Upload panCard to S3 (single file)
    if (req.files && req.files.panCard && req.files.panCard.length > 0) {
      const panCardUploadResult = await S3Service.uploadFile(
        req.files.panCard[0],
        'uploads/medicine-bookings/documents'
      );
      if (panCardUploadResult.success) {
        result.panCard = panCardUploadResult.url;
        console.log(`✅ Uploaded panCard to S3: ${panCardUploadResult.url}`);
      }
    }

    // Upload declarationForm to S3 (single file)
    if (req.files && req.files.declarationForm && req.files.declarationForm.length > 0) {
      const declarationUploadResult = await S3Service.uploadFile(
        req.files.declarationForm[0],
        'uploads/medicine-bookings/documents'
      );
      if (declarationUploadResult.success) {
        result.declarationForm = declarationUploadResult.url;
        console.log(`✅ Uploaded declarationForm to S3: ${declarationUploadResult.url}`);
      }
    }

    const totalFiles = result.packageImages.length + result.invoiceImages.length + 
                      (result.panCard ? 1 : 0) + (result.declarationForm ? 1 : 0);

    if (totalFiles === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    console.log(`✅ Total ${totalFiles} file(s) uploaded to S3 successfully`);

    res.json({
      success: true,
      message: `${totalFiles} file(s) uploaded successfully to AWS S3`,
      data: result
    });
  } catch (error) {
    console.error('Error uploading images to S3:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload files to AWS S3: ' + error.message
    });
  }
});

// GET /api/medicine/bookings - Get all bookings (optional: filter by medicineUserId)
router.get('/bookings', authenticateMedicine, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const medicineUserId = req.medicine?._id;

    const query = {};
    if (medicineUserId) {
      query.medicineUserId = medicineUserId;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await MedicineBooking.find(query)
      .populate('coloaderId', 'name phoneNumber busNumber')
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
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// GET /api/medicine/bookings/lookup - Lookup past addresses by phone number or company name
// IMPORTANT: This must be defined BEFORE '/bookings/:id' to avoid route conflicts
// Query: ?phone=XXXXXXXXXX&role=origin|destination OR ?companyName=XXX&role=origin|destination
router.get('/bookings/lookup', async (req, res) => {
  try {
    const { phone, companyName, role } = req.query;

    console.log('[MedicineBooking Lookup] Request received:', { phone, companyName, role });

    // Determine lookup type
    const isPhoneLookup = phone && !companyName;
    const isCompanyLookup = companyName && !phone;

    if (!isPhoneLookup && !isCompanyLookup) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Either phone or companyName must be provided'
      });
    }

    let query;

    if (isPhoneLookup) {
      const mobileNumber = (phone || '').toString().trim();
      if (!/^[0-9]{10}$/.test(mobileNumber)) {
        console.log('[MedicineBooking Lookup] Invalid phone number format:', mobileNumber);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number',
          message: 'Phone must be a 10 digit number'
        });
      }

      // Build query based on role for phone lookup
      if (role === 'origin') {
        query = { 'origin.mobileNumber': mobileNumber };
      } else if (role === 'destination') {
        query = { 'destination.mobileNumber': mobileNumber };
      } else {
        query = {
          $or: [
            { 'origin.mobileNumber': mobileNumber },
            { 'destination.mobileNumber': mobileNumber }
          ]
        };
      }
    } else {
      // Company name lookup
      const company = (companyName || '').toString().trim();
      if (!company || company.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company name',
          message: 'Company name cannot be empty'
        });
      }

      // Build query based on role for company lookup
      if (role === 'origin') {
        query = { 'origin.companyName': { $regex: company, $options: 'i' } };
      } else if (role === 'destination') {
        query = { 'destination.companyName': { $regex: company, $options: 'i' } };
      } else {
        query = {
          $or: [
            { 'origin.companyName': { $regex: company, $options: 'i' } },
            { 'destination.companyName': { $regex: company, $options: 'i' } }
          ]
        };
      }
    }

    console.log('[MedicineBooking Lookup] Query:', JSON.stringify(query));

    // Fetch recent bookings, limit to avoid large payloads
    const bookings = await MedicineBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const lookupValue = isPhoneLookup ? phone : companyName;
    console.log(`[MedicineBooking Lookup] Found ${bookings.length} booking(s) for ${isPhoneLookup ? 'phone' : 'company'}: ${lookupValue}`);

    // Deduplicate addresses by a signature of key fields
    const makeSignature = (addr) => [
      addr?.name || '',
      addr?.mobileNumber || '',
      addr?.email || '',
      addr?.companyName || '',
      addr?.flatBuilding || '',
      addr?.locality || '',
      addr?.landmark || '',
      addr?.pincode || '',
      addr?.city || '',
      addr?.district || '',
      addr?.state || '',
      addr?.gstNumber || '',
      addr?.addressType || ''
    ].join('|').toLowerCase();

    const addressesMap = new Map();

    for (const b of bookings) {
      if (role !== 'destination') {
        const o = b.origin || {};
        let shouldInclude = false;
        
        if (isPhoneLookup) {
          shouldInclude = o.mobileNumber === phone;
        } else {
          // Company name lookup - case insensitive match
          const oCompany = (o.companyName || '').toString().trim();
          shouldInclude = oCompany.toLowerCase() === companyName.toLowerCase();
        }
        
        if (shouldInclude) {
          const sig = makeSignature(o);
          if (!addressesMap.has(sig)) {
            addressesMap.set(sig, {
              id: `origin-${b._id.toString()}`,
              role: 'origin',
              name: o.name || '',
              mobileNumber: o.mobileNumber || '',
              email: o.email || '',
              companyName: o.companyName || '',
              flatBuilding: o.flatBuilding || '',
              locality: o.locality || '',
              landmark: o.landmark || '',
              pincode: o.pincode || '',
              city: o.city || '',
              district: o.district || '',
              state: o.state || '',
              gstNumber: o.gstNumber || '',
              addressType: o.addressType || 'Home'
            });
          }
        }
      }

      if (role !== 'origin') {
        const d = b.destination || {};
        let shouldInclude = false;
        
        if (isPhoneLookup) {
          shouldInclude = d.mobileNumber === phone;
        } else {
          // Company name lookup - case insensitive match
          const dCompany = (d.companyName || '').toString().trim();
          shouldInclude = dCompany.toLowerCase() === companyName.toLowerCase();
        }
        
        if (shouldInclude) {
          const sig = makeSignature(d);
          if (!addressesMap.has(sig)) {
            addressesMap.set(sig, {
              id: `destination-${b._id.toString()}`,
              role: 'destination',
              name: d.name || '',
              mobileNumber: d.mobileNumber || '',
              email: d.email || '',
              companyName: d.companyName || '',
              flatBuilding: d.flatBuilding || '',
              locality: d.locality || '',
              landmark: d.landmark || '',
              pincode: d.pincode || '',
              city: d.city || '',
              district: d.district || '',
              state: d.state || '',
              gstNumber: d.gstNumber || '',
              addressType: d.addressType || 'Home'
            });
          }
        }
      }
    }

    const addresses = Array.from(addressesMap.values());

    console.log(`[MedicineBooking Lookup] Returning ${addresses.length} unique address(es)`);

    return res.json({
      success: true,
      count: addresses.length,
      addresses
    });
  } catch (error) {
    console.error('[MedicineBooking Lookup] Error during lookup:', error);
    res.status(500).json({
      success: false,
      error: 'Lookup failed',
      message: error.message
    });
  }
});

// GET /api/medicine/bookings/company-names - Get list of unique company names
// Query: ?role=origin|destination
router.get('/bookings/company-names', async (req, res) => {
  try {
    const { role } = req.query;

    console.log('[MedicineBooking Company Names] Request received:', { role });

    // Build query based on role
    let field;
    if (role === 'origin') {
      field = 'origin.companyName';
    } else if (role === 'destination') {
      field = 'destination.companyName';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: 'Role must be either "origin" or "destination"'
      });
    }

    // Fetch all bookings and extract unique company names
    const bookings = await MedicineBooking.find({
      [field]: { $exists: true, $ne: '', $ne: null }
    })
      .select(field)
      .lean();

    // Extract unique company names
    const companyNamesSet = new Set();
    bookings.forEach(booking => {
      const companyName = role === 'origin' 
        ? booking.origin?.companyName 
        : booking.destination?.companyName;
      
      if (companyName && companyName.trim() !== '') {
        companyNamesSet.add(companyName.trim());
      }
    });

    const companyNames = Array.from(companyNamesSet).sort();

    console.log(`[MedicineBooking Company Names] Found ${companyNames.length} unique company name(s) for ${role}`);

    return res.json({
      success: true,
      count: companyNames.length,
      companyNames
    });
  } catch (error) {
    console.error('[MedicineBooking Company Names] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company names',
      message: error.message
    });
  }
});

// GET /api/medicine/bookings/:id - Get a specific booking by ID
router.get('/bookings/:id', authenticateMedicine, async (req, res) => {
  try {
    const booking = await MedicineBooking.findById(req.params.id).lean();

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The requested booking does not exist'
      });
    }

    // Check if user has permission (optional - can be removed if all medicine users should see all bookings)
    if (req.medicine?._id && booking.medicineUserId && 
        booking.medicineUserId.toString() !== req.medicine._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

// GET /api/medicine/bookings/reference/:reference - Get booking by reference number
router.get('/bookings/reference/:reference', async (req, res) => {
  try {
    const booking = await MedicineBooking.findByReference(req.params.reference).lean();

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'No booking found with this reference number'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking by reference:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

// (moved above '/bookings/:id')

// GET /api/medicine/bookings/consignment/:consignmentNumber - Get booking by consignment number
router.get('/bookings/consignment/:consignmentNumber', authenticateMedicine, async (req, res) => {
  try {
    const consignmentNumber = parseInt(req.params.consignmentNumber);
    
    if (isNaN(consignmentNumber)) {
      return res.status(400).json({
        error: 'Invalid consignment number',
        message: 'Consignment number must be a valid number'
      });
    }

    // Find booking by consignment number only (consignment numbers are unique)
    // This allows scanning of bookings created from both web and mobile app
    const booking = await MedicineBooking.findOne({
      consignmentNumber: consignmentNumber
    }).lean();

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: `No booking found with consignment number ${consignmentNumber}`
      });
    }

    // Verify it's a medicine booking (has medicineUserId)
    if (!booking.medicineUserId) {
      return res.status(404).json({
        error: 'Booking not found',
        message: `No medicine booking found with consignment number ${consignmentNumber}`
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking by consignment number:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

// POST /api/medicine/manifests - Create a manifest from scanned consignments
router.post('/manifests', authenticateMedicine, async (req, res) => {
  try {
    const { consignmentNumbers, notes, path } = req.body || {};

    if (!Array.isArray(consignmentNumbers) || consignmentNumbers.length === 0) {
      return res.status(400).json({
        error: 'No consignments provided',
        message: 'Provide an array of consignment numbers to create a manifest'
      });
    }

    if (!path) {
      return res.status(400).json({
        error: 'Path is required',
        message: 'Please provide a path for the manifest'
      });
    }

    // Fetch bookings belonging to this user and not already dispatched/delivered
    const bookings = await MedicineBooking.find({
      consignmentNumber: { $in: consignmentNumbers.map((n) => parseInt(n, 10)) },
      medicineUserId: req.medicine._id,
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        error: 'No bookings found',
        message: 'No valid bookings found for the provided consignments'
      });
    }

    // Parse path to extract origin and destination details
    // Path format: "OriginCity, OriginState → DestinationCity, DestinationState"
    let originCity = '';
    let originState = '';
    let destinationCity = '';
    let destinationState = '';

    if (path) {
      const pathMatch = path.match(/^(.+?),\s*(.+?)\s*→\s*(.+?),\s*(.+)$/);
      if (pathMatch) {
        originCity = pathMatch[1].trim();
        originState = pathMatch[2].trim();
        destinationCity = pathMatch[3].trim();
        destinationState = pathMatch[4].trim();
      }
    }

    // Build manifest document
    const manifestNumber = MedicineManifest.generateManifestNumber();
    const consignments = bookings.map((b) => ({
      bookingId: b._id,
      consignmentNumber: b.consignmentNumber
    }));

    const manifest = new MedicineManifest({
      medicineUserId: req.medicine._id,
      manifestNumber,
      consignments,
      totalCount: consignments.length,
      notes: notes || '',
      path: path,
      originCity: originCity,
      originState: originState,
      destinationCity: destinationCity,
      destinationState: destinationState,
      status: 'submitted'
    });
    await manifest.save();

    // Update the bookings: set status to in_transit if not already delivered/cancelled and link manifestId
    const updatableStatuses = ['pending', 'confirmed'];
    const bookingIds = bookings.map((b) => b._id);
    await MedicineBooking.updateMany(
      { _id: { $in: bookingIds }, status: { $in: updatableStatuses } },
      { $set: { status: 'in_transit', manifestId: manifest._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Manifest created successfully',
      manifest: {
        id: manifest._id,
        manifestNumber: manifest.manifestNumber,
        totalCount: manifest.totalCount,
        createdAt: manifest.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating medicine manifest:', error);
    res.status(500).json({
      error: 'Failed to create manifest',
      message: error.message
    });
  }
});

// PATCH /api/medicine/bookings/:id/status - Update booking status
router.patch('/bookings/:id/status', authenticateMedicine, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Booked', 'pending', 'confirmed', 'in_transit', 'arrived', 'Arrived at Hub', 'Ready to Dispatch', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Please provide a valid status'
      });
    }

    const booking = await MedicineBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The requested booking does not exist'
      });
    }

    // If status is being updated to "Arrived at Hub", set the scan timestamp
    if (status === 'Arrived at Hub') {
      booking.arrivedAtHubScanAt = new Date();
    }

    await booking.updateStatus(status);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        arrivedAtHubScanAt: booking.arrivedAtHubScanAt
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Failed to update booking status',
      message: error.message
    });
  }
});

// GET /api/medicine/consignment/assignments - Get consignment assignments for medicine user (authenticated)
router.get('/consignment/assignments', authenticateMedicine, async (req, res) => {
  try {
    const ConsignmentAssignment = (await import('../models/ConsignmentAssignment.js')).default;
    const ConsignmentUsage = (await import('../models/ConsignmentAssignment.js')).ConsignmentUsage;
    
    // Get assignments for this medicine user (from authenticated session)
    const medicineUserId = req.medicine._id;
    const assignments = await ConsignmentAssignment.find({
      assignmentType: 'medicine',
      medicineUserId: medicineUserId,
      isActive: true
    }).sort({ startNumber: 1 });
    
    if (!assignments || assignments.length === 0) {
      return res.json({
        success: true,
        hasAssignment: false,
        message: 'No consignment numbers assigned to your account. Please contact admin to get consignment numbers assigned.'
      });
    }
    
    // Get usage statistics
    const usedCount = await ConsignmentUsage.countDocuments({
      assignmentType: 'medicine',
      entityId: medicineUserId
    });
    
    const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.totalNumbers, 0);
    const availableCount = totalAssigned - usedCount;
    
    res.json({
      success: true,
      hasAssignment: true,
      assignments: assignments.map(assignment => ({
        _id: assignment._id,
        startNumber: assignment.startNumber,
        endNumber: assignment.endNumber,
        totalNumbers: assignment.totalNumbers,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes
      })),
      summary: {
        totalAssigned: totalAssigned,
        usedCount: usedCount,
        availableCount: availableCount,
        usagePercentage: Math.round((usedCount / totalAssigned) * 100)
      },
      message: `You have ${availableCount} consignment numbers available for booking across ${assignments.length} assignment(s).`
    });
    
  } catch (error) {
    console.error('Get consignment assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consignment assignments'
    });
  }
});

// GET /api/medicine/consignment/assignments/by-user - Get consignment assignments by medicineUserId (for courier boys)
router.get('/consignment/assignments/by-user', async (req, res) => {
  try {
    const ConsignmentAssignment = (await import('../models/ConsignmentAssignment.js')).default;
    const ConsignmentUsage = (await import('../models/ConsignmentAssignment.js')).ConsignmentUsage;
    
    const { medicineUserId } = req.query;
    
    if (!medicineUserId) {
      return res.status(400).json({
        success: false,
        error: 'Medicine user ID required',
        message: 'Please provide medicineUserId query parameter.'
      });
    }
    
    // Get assignments for this medicine user
    const assignments = await ConsignmentAssignment.find({
      assignmentType: 'medicine',
      medicineUserId: medicineUserId,
      isActive: true
    }).sort({ startNumber: 1 });
    
    if (!assignments || assignments.length === 0) {
      return res.json({
        success: true,
        hasAssignment: false,
        message: 'No consignment numbers assigned to this account. Please contact admin to get consignment numbers assigned.'
      });
    }
    
    // Get usage statistics
    const usedCount = await ConsignmentUsage.countDocuments({
      assignmentType: 'medicine',
      entityId: medicineUserId
    });
    
    const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.totalNumbers, 0);
    const availableCount = totalAssigned - usedCount;
    
    res.json({
      success: true,
      hasAssignment: true,
      assignments: assignments.map(assignment => ({
        _id: assignment._id,
        startNumber: assignment.startNumber,
        endNumber: assignment.endNumber,
        totalNumbers: assignment.totalNumbers,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes
      })),
      summary: {
        totalAssigned: totalAssigned,
        usedCount: usedCount,
        availableCount: availableCount,
        usagePercentage: Math.round((usedCount / totalAssigned) * 100)
      },
      message: `You have ${availableCount} consignment numbers available for booking across ${assignments.length} assignment(s).`
    });
    
  } catch (error) {
    console.error('Get consignment assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consignment assignments'
    });
  }
});

// GET /api/medicine/assignments/courier-boy/:courierBoyId - Get assigned medicine user ID for courier boy
router.get('/assignments/courier-boy/:courierBoyId', async (req, res) => {
  try {
    const { courierBoyId } = req.params;
    
    // Validate and convert courierBoyId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(courierBoyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid courier boy ID',
        message: 'Invalid courier boy ID format.'
      });
    }
    
    const courierBoyObjectId = new mongoose.Types.ObjectId(courierBoyId);
    
    // Find the most recent active assignment for this courier boy
    const assignment = await MedicineCourierBoyAssigned.findOne({
      courierBoyId: courierBoyObjectId,
      status: 'assigned'
    })
      .sort({ assignedAt: -1 })
      .lean();
    
    if (!assignment || !assignment.medicineUserId) {
      return res.status(404).json({
        success: false,
        error: 'No assignment found',
        message: 'No medicine user assignment found for this courier boy. Please contact admin to get assigned to a medicine user.'
      });
    }
    
    res.json({
      success: true,
      data: {
        medicineUserId: assignment.medicineUserId,
        assignmentId: assignment._id,
        assignedAt: assignment.assignedAt
      }
    });
    
  } catch (error) {
    console.error('Get courier boy assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get courier boy assignment',
      message: error.message
    });
  }
});

// GET /api/medicine/paths/pending - Get all paths with pending orders (city-wise)
router.get('/paths/pending', authenticateMedicine, async (req, res) => {
  try {
    const medicineUserId = req.medicine?._id;
    
    // Fetch all pending bookings for this medicine user
    const bookings = await MedicineBooking.find({
      medicineUserId: medicineUserId,
      status: 'pending'
    }).lean();
    
    // Group by path (city-wise: origin city, state → destination city, state)
    const pathGroups = {};
    
    bookings.forEach(booking => {
      const originCity = booking.origin?.city || 'N/A';
      const originState = booking.origin?.state || 'N/A';
      const destinationCity = booking.destination?.city || 'N/A';
      const destinationState = booking.destination?.state || 'N/A';
      
      const path = `${originCity}, ${originState} → ${destinationCity}, ${destinationState}`;
      
      if (!pathGroups[path]) {
        pathGroups[path] = {
          path,
          count: 0,
          originCity,
          originState,
          destinationCity,
          destinationState
        };
      }
      
      pathGroups[path].count += 1;
    });
    
    // Convert to array and sort by count (descending)
    const paths = Object.values(pathGroups).sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      paths,
      total: paths.length
    });
    
  } catch (error) {
    console.error('Error fetching paths with pending orders:', error);
    res.status(500).json({
      error: 'Failed to fetch paths',
      message: error.message
    });
  }
});

// GET /api/medicine/coloaders - Get all coloaders
router.get('/coloaders', authenticateMedicine, async (req, res) => {
  try {
    const coloaders = await MedicineColoader.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('medicineUserId', 'name email');
    
    res.status(200).json({
      success: true,
      data: coloaders,
      count: coloaders.length
    });
  } catch (error) {
    console.error('Error fetching coloaders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coloaders',
      message: error.message
    });
  }
});

// POST /api/medicine/coloaders/register - Register new coloader (full registration)
router.post('/coloaders/register', authenticateMedicine, async (req, res) => {
  try {
    console.log('Received medicine coloader registration data:', req.body);
    
    const {
      companyName,
      serviceModes,
      concernPerson,
      mobileNumbers,
      email,
      website,
      companyAddress,
      fromLocations,
      toLocations,
      vehicleDetails
    } = req.body;
    
    // Validate required fields
    const requiredFields = [
      'companyName', 'serviceModes', 'concernPerson', 
      'mobileNumbers', 'email', 'companyAddress', 
      'fromLocations', 'toLocations'
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate service modes
    if (!Array.isArray(serviceModes) || serviceModes.length === 0) {
      return res.status(400).json({ 
        error: 'At least one service mode is required' 
      });
    }

    // Validate mobile numbers
    if (!Array.isArray(mobileNumbers) || mobileNumbers.length === 0) {
      return res.status(400).json({ 
        error: 'At least one mobile number is required' 
      });
    }

    // Validate locations
    if (!Array.isArray(fromLocations) || fromLocations.length === 0) {
      return res.status(400).json({ 
        error: 'At least one FROM location is required' 
      });
    }

    if (!Array.isArray(toLocations) || toLocations.length === 0) {
      return res.status(400).json({ 
        error: 'At least one TO location is required' 
      });
    }

    // Check if company with same email already exists
    const existingColoader = await MedicineColoader.findOne({
      email: email.toLowerCase()
    });

    if (existingColoader) {
      return res.status(409).json({ 
        error: 'A coloader with this email already exists' 
      });
    }

    // Check if company with same name already exists
    const existingCompany = await MedicineColoader.findOne({
      companyName: companyName.trim()
    });

    if (existingCompany) {
      return res.status(409).json({ 
        error: 'A coloader with this company name already exists' 
      });
    }

    // Get medicine user ID from token
    const medicineUserId = req.user?.id || null;

    // Create new coloader registration
    const coloaderData = new MedicineColoader({
      medicineUserId,
      companyName: companyName.trim(),
      serviceModes: serviceModes,
      concernPerson: concernPerson.trim(),
      mobileNumbers: mobileNumbers.map(num => num.trim()),
      email: email.toLowerCase().trim(),
      website: website?.trim() || '',
      companyAddress: {
        pincode: companyAddress.pincode.trim(),
        state: companyAddress.state.trim(),
        city: companyAddress.city.trim(),
        area: companyAddress.area.trim(),
        address: companyAddress.address.trim(),
        flatNo: companyAddress.flatNo.trim(),
        landmark: companyAddress.landmark?.trim() || '',
        gst: companyAddress.gst.trim().toUpperCase()
      },
      vehicleDetails: Array.isArray(vehicleDetails)
        ? vehicleDetails
            .filter(detail => 
              (detail.vehicleName && detail.vehicleName.trim()) ||
              (detail.vehicleNumber && detail.vehicleNumber.trim()) ||
              (detail.driverName && detail.driverName.trim()) ||
              (detail.driverNumber && detail.driverNumber.trim())
            )
            .map(detail => ({
              vehicleName: detail.vehicleName?.trim() || '',
              vehicleNumber: detail.vehicleNumber?.trim().toUpperCase() || '',
              driverName: detail.driverName?.trim() || '',
              driverNumber: detail.driverNumber?.trim() || ''
            }))
        : [],
      fromLocations: fromLocations.map(location => ({
        concernPerson: location.concernPerson.trim(),
        mobile: location.mobile.trim(),
        email: location.email.toLowerCase().trim(),
        pincode: location.pincode.trim(),
        state: location.state.trim(),
        city: location.city.trim(),
        area: location.area.trim(),
        address: location.address.trim(),
        flatNo: location.flatNo.trim(),
        landmark: location.landmark?.trim() || '',
        gst: location.gst.trim().toUpperCase(),
        vehicleDetails: Array.isArray(location.vehicleDetails)
          ? location.vehicleDetails
              .filter(detail =>
                (detail.vehicleName && detail.vehicleName.trim()) ||
                (detail.vehicleNumber && detail.vehicleNumber.trim()) ||
                (detail.driverName && detail.driverName.trim()) ||
                (detail.driverNumber && detail.driverNumber.trim())
              )
              .map(detail => ({
                vehicleName: detail.vehicleName?.trim() || '',
                vehicleNumber: detail.vehicleNumber?.trim().toUpperCase() || '',
                driverName: detail.driverName?.trim() || '',
                driverNumber: detail.driverNumber?.trim() || ''
              }))
          : []
      })),
      toLocations: toLocations.map(location => ({
        concernPerson: location.concernPerson.trim(),
        mobile: location.mobile.trim(),
        email: location.email.toLowerCase().trim(),
        pincode: location.pincode.trim(),
        state: location.state.trim(),
        city: location.city.trim(),
        area: location.area.trim(),
        address: location.address.trim(),
        flatNo: location.flatNo.trim(),
        landmark: location.landmark?.trim() || '',
        gst: location.gst.trim().toUpperCase(),
        vehicleDetails: Array.isArray(location.vehicleDetails)
          ? location.vehicleDetails
              .filter(detail =>
                (detail.vehicleName && detail.vehicleName.trim()) ||
                (detail.vehicleNumber && detail.vehicleNumber.trim()) ||
                (detail.driverName && detail.driverName.trim()) ||
                (detail.driverNumber && detail.driverNumber.trim())
              )
              .map(detail => ({
                vehicleName: detail.vehicleName?.trim() || '',
                vehicleNumber: detail.vehicleNumber?.trim().toUpperCase() || '',
                driverName: detail.driverName?.trim() || '',
                driverNumber: detail.driverNumber?.trim() || ''
              }))
          : []
      })),
      status: 'approved' // Automatically approve upon registration completion
    });

    await coloaderData.save();
    
    console.log('Medicine coloader registration successful:', coloaderData.coloaderId);
    
    res.json({ 
      success: true, 
      message: 'Coloader registration completed and approved successfully!',
      coloaderId: coloaderData.coloaderId,
      data: {
        coloaderId: coloaderData.coloaderId,
        companyName: coloaderData.companyName,
        email: coloaderData.email,
        status: coloaderData.status,
        registrationDate: coloaderData.registrationDate,
        completionPercentage: coloaderData.getCompletionPercentage()
      }
    });
    
  } catch (err) {
    console.error('Error in medicine coloader registration:', err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    } else if (err.code === 11000) {
      res.status(409).json({ 
        error: 'Duplicate entry detected',
        details: 'A coloader with this information already exists'
      });
    } else {
      res.status(500).json({ 
        error: err.message || 'Internal server error'
      });
    }
  }
});

// POST /api/medicine/coloaders - Create a new coloader (simple version for backward compatibility)
router.post('/coloaders', authenticateMedicine, async (req, res) => {
  try {
    const { name, phoneNumber, busNumber } = req.body;
    
    // Validate required fields
    if (!name || !phoneNumber || !busNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, phone number and bus number are required'
      });
    }
    
    // Validate phone number format
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number must be exactly 10 digits'
      });
    }
    
    // Check if coloader with same phone number and bus number already exists
    const existingColoader = await MedicineColoader.findOne({
      phoneNumber,
      busNumber,
      isActive: true
    });
    
    if (existingColoader) {
      // If we find an existing coloader with the same phone and bus number,
      // update its name if it doesn't have one
      if (!existingColoader.name && name) {
        existingColoader.name = name;
        await existingColoader.save();
        console.log(`Updated coloader ${existingColoader._id} with name: ${name}`);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Duplicate coloader',
        message: 'A coloader with this phone number and bus number already exists'
      });
    }
    
    // Get medicine user ID from token
    const medicineUserId = req.user?.id || null;
    
    // Create new coloader
    const coloader = new MedicineColoader({
      medicineUserId,
      name,
      phoneNumber,
      busNumber,
      isActive: true
    });
    
    await coloader.save();
    
    // Populate medicine user info
    await coloader.populate('medicineUserId', 'name email');
    
    console.log(`✅ Medicine coloader created: ${name} - ${phoneNumber} - ${busNumber}`);
    
    res.status(201).json({
      success: true,
      message: 'Coloader created successfully',
      data: coloader
    });
  } catch (error) {
    console.error('Error creating coloader:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coloader',
      message: error.message
    });
  }
});

// DELETE /api/medicine/coloaders/:id - Soft delete a coloader
router.delete('/coloaders/:id', authenticateMedicine, async (req, res) => {
  try {
    const { id } = req.params;
    
    const coloader = await MedicineColoader.findById(id);
    
    if (!coloader) {
      return res.status(404).json({
        success: false,
        error: 'Coloader not found'
      });
    }
    
    // Soft delete by setting isActive to false
    coloader.isActive = false;
    await coloader.save();
    
    res.status(200).json({
      success: true,
      message: 'Coloader deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coloader:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coloader',
      message: error.message
    });
  }
});

// GET /api/medicine/manifests - Get all submitted manifests (for dispatch)
router.get('/manifests', authenticateMedicine, async (req, res) => {
  try {
    const manifests = await MedicineManifest.find({
      medicineUserId: req.medicine._id,
      status: 'submitted'
    })
      .sort({ createdAt: -1 })
      .populate('coloaderId', 'name phoneNumber busNumber')
      .populate('consignments.bookingId', 'consignmentNumber origin destination shipment package createdAt');
    
    res.status(200).json({
      success: true,
      data: manifests,
      count: manifests.length
    });
  } catch (error) {
    console.error('Error fetching manifests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch manifests',
      message: error.message
    });
  }
});

// GET /api/medicine/manifests/all - Get all manifests with year filtering (for viewing)
router.get('/manifests/all', authenticateMedicine, async (req, res) => {
  try {
    const { year, month, startDate: startDateParam, endDate: endDateParam } = req.query;
    
    // Default to current financial year if not provided
    let financialYear = year ? parseInt(year) : null;
    
    if (!financialYear) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      // Financial year starts from April (month 4)
      if (currentMonth >= 4) {
        financialYear = now.getFullYear();
      } else {
        financialYear = now.getFullYear() - 1;
      }
    }
    
    // Financial year runs from April 1 to March 31
    let startDate, endDate;
    
    // If date range is provided, use it instead of financial year/month
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      const m = month ? parseInt(month) : null;
      if (m && !isNaN(m) && m >= 1 && m <= 12) {
        // Specific month within the selected financial year
        const monthYear = m >= 4 ? financialYear : financialYear + 1;
        startDate = new Date(monthYear, m - 1, 1);
        endDate = new Date(monthYear, m, 0, 23, 59, 59, 999); // last day of the month
      } else {
        startDate = new Date(financialYear, 3, 1); // April 1 (month 3 = April)
        endDate = new Date(financialYear + 1, 2, 31, 23, 59, 59, 999); // March 31
      }
    }
    
    const manifests = await MedicineManifest.find({
      medicineUserId: req.medicine._id,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort({ createdAt: -1 })
      .populate('coloaderId', 'name phoneNumber busNumber')
      .populate('consignments.bookingId', 'consignmentNumber origin destination shipment package createdAt');
    
    res.status(200).json({
      success: true,
      data: manifests,
      count: manifests.length,
      financialYear: financialYear,
      startDate: startDate,
      endDate: endDate
    });
  } catch (error) {
    console.error('Error fetching all manifests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch manifests',
      message: error.message
    });
  }
});

// POST /api/medicine/manifests/:id/dispatch - Dispatch manifest with coloader assignment
router.post('/manifests/:id/dispatch', authenticateMedicine, async (req, res) => {
  try {
    const { id } = req.params;
    const { coloaderId, contentDescription, coloaderDocketNo } = req.body;
    
    if (!coloaderId) {
      return res.status(400).json({
        success: false,
        error: 'Coloader is required',
        message: 'Please select a coloader to dispatch'
      });
    }
    
    // Find the manifest
    const manifest = await MedicineManifest.findById(id);
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found'
      });
    }
    
    // Check if manifest belongs to the user
    if (manifest.medicineUserId.toString() !== req.medicine._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to dispatch this manifest'
      });
    }
    
    // Check if manifest is already dispatched
    if (manifest.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        error: 'Manifest already dispatched',
        message: 'This manifest has already been dispatched'
      });
    }
    
    // Verify coloader exists
    const coloader = await MedicineColoader.findById(coloaderId);
    if (!coloader || !coloader.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Coloader not found',
        message: 'The selected coloader does not exist or is inactive'
      });
    }
    
    // Get all booking IDs from manifest
    const bookingIds = manifest.consignments.map(c => c.bookingId);
    
    // Update manifest
    manifest.status = 'dispatched';
    manifest.coloaderId = coloaderId;
    manifest.contentDescription = contentDescription || '';
    manifest.coloaderDocketNo = coloaderDocketNo || '';
    // Set dispatchedAt timestamp only if not already set (to preserve original dispatch time)
    if (!manifest.dispatchedAt) {
      manifest.dispatchedAt = new Date();
    }
    await manifest.save();
    
    // Update all bookings in the manifest with coloader assignment
    await MedicineBooking.updateMany(
      { _id: { $in: bookingIds } },
      { 
        $set: { 
          coloaderId: coloaderId,
          status: 'in_transit'
        } 
      }
    );
    
    console.log(`✅ Manifest ${manifest.manifestNumber} dispatched with coloader ${coloader.name || coloader.busNumber}`);
    
    // Auto-sync to Google Sheets after manifest dispatch
    try {
      // Fetch all bookings for this medicine user that have been dispatched (have consignment numbers)
      const allBookings = await MedicineBooking.find({
        medicineUserId: req.medicine._id,
        consignmentNumber: { $exists: true, $ne: null }
      })
        .populate('coloaderId', 'name phoneNumber busNumber')
        .populate('manifestId', 'manifestNumber createdAt coloaderDocketNo')
        .sort({ createdAt: -1 })
        .lean();

      if (allBookings && allBookings.length > 0) {
        await googleSheetsService.syncMedicineBookings(allBookings);
        console.log(`✅ Auto-synced ${allBookings.length} bookings to Google Sheets after manifest dispatch`);
      }
    } catch (syncError) {
      console.error('Auto-sync to Google Sheets failed after manifest dispatch:', syncError.message);
      // Don't fail the request if sync fails, just log it
    }
    
    res.status(200).json({
      success: true,
      message: 'Manifest dispatched successfully',
      data: {
        manifestId: manifest._id,
        manifestNumber: manifest.manifestNumber,
        coloaderId: coloader._id,
        coloaderBusNumber: coloader.busNumber,
        bookingsCount: bookingIds.length
      }
    });
  } catch (error) {
    console.error('Error dispatching manifest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch manifest',
      message: error.message
    });
  }
});

// GET /api/medicine/sync-bookings - Sync all dispatched bookings to Google Sheets
router.get('/sync-bookings', authenticateMedicine, async (req, res) => {
  try {
    // Fetch all bookings for this medicine user that have been dispatched (have consignment numbers)
    const bookings = await MedicineBooking.find({
      medicineUserId: req.medicine._id,
      consignmentNumber: { $exists: true, $ne: null }
    })
      .populate('coloaderId', 'name phoneNumber busNumber')
      .populate('manifestId', 'manifestNumber createdAt coloaderDocketNo')
      .sort({ createdAt: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found to sync'
      });
    }

    // Sync to Google Sheets
    const result = await googleSheetsService.syncMedicineBookings(bookings);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        sheetName: result.sheetName,
        totalBookings: bookings.length,
        rowsAdded: result.rowsAdded
      }
    });
  } catch (error) {
    console.error('Error syncing bookings to Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync bookings to Google Sheets',
      message: error.message
    });
  }
});

// GET /api/medicine/dashboard-summary - Get dashboard summary data
router.get('/dashboard-summary', authenticateMedicine, async (req, res) => {
  try {
    const medicineUserId = req.medicine._id;
    const { startDate, endDate } = req.query;

    let queryStartDate;
    let queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
      if (Number.isFinite(queryEndDate.getTime())) {
        queryEndDate.setHours(23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      queryStartDate = new Date(currentYear, currentMonth, 1);
      queryEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    }

    if (Number.isNaN(queryStartDate?.getTime()) || Number.isNaN(queryEndDate?.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Please provide valid startDate and endDate values'
      });
    }

    const bookingDateFilter = { $gte: queryStartDate, $lte: queryEndDate };

    const [
      totalBookings,
      bookedBookings,
      pendingBookings,
      readyToDispatchBookings,
      inTransitBookings,
      deliveredBookings,
      cancelledBookings,
      arrivedAtHubBookings,
      allBookings,
      totalManifests,
      submittedManifests,
      dispatchedManifests,
      deliveredManifests
    ] = await Promise.all([
      MedicineBooking.countDocuments({ medicineUserId, createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'Booked', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'pending', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'Ready to Dispatch', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'in_transit', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'delivered', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'cancelled', createdAt: bookingDateFilter }),
      MedicineBooking.countDocuments({ medicineUserId, status: 'Arrived at Hub', createdAt: bookingDateFilter }),
      MedicineBooking.find({ medicineUserId, createdAt: bookingDateFilter }, { billing: 1 }),
      MedicineManifest.countDocuments({ medicineUserId, createdAt: bookingDateFilter }),
      MedicineManifest.countDocuments({ medicineUserId, status: 'submitted', createdAt: bookingDateFilter }),
      MedicineManifest.countDocuments({ medicineUserId, status: 'dispatched', createdAt: bookingDateFilter }),
      MedicineManifest.countDocuments({ medicineUserId, status: 'delivered', createdAt: bookingDateFilter })
    ]);

    let paidCount = 0;
    let willPayCount = 0;
    let notPaidCount = 0;

    allBookings.forEach((booking) => {
      const partyType = booking.billing?.partyType;
      if (partyType === 'sender') {
        paidCount += 1;
      } else if (partyType === 'recipient') {
        willPayCount += 1;
      } else {
        notPaidCount += 1;
      }
    });

    let settlements = [];
    let oclCharge = 0;

    if (startDate && endDate) {
      const userBookings = allBookings.map((booking) => booking._id);

      if (userBookings.length > 0) {
        settlements = await MedicineSettlement.find({
          medicineBookingId: { $in: userBookings }
        });
      }
    } else {
      const queryMonth = queryStartDate.getMonth() + 1;
      const queryYear = queryStartDate.getFullYear();

      const userBookings = await MedicineBooking.find(
        {
          medicineUserId,
          createdAt: bookingDateFilter
        },
        { _id: 1 }
      );

      const userBookingIds = userBookings.map((booking) => booking._id);

      if (userBookingIds.length > 0) {
        settlements = await MedicineSettlement.find({
          medicineBookingId: { $in: userBookingIds },
          settlementMonth: queryMonth,
          settlementYear: queryYear
        });
      }

      const oclChargeRecord = await MedicineOclCharge.findOne({
        month: queryMonth,
        year: queryYear
      });
      oclCharge = oclChargeRecord ? oclChargeRecord.amount : 0;
    }

    const totalTransactions = settlements.length;
    const totalWeight = settlements.reduce((sum, settlement) => sum + (settlement.weight || 0), 0);
    const totalCost = settlements.reduce((sum, settlement) => sum + (settlement.cost || 0), 0);
    const remainingBalance = totalCost - oclCharge;

    res.json({
      success: true,
      data: {
        bookings: {
          total: totalBookings,
          booked: bookedBookings,
          pending: pendingBookings,
          readyToDispatch: readyToDispatchBookings,
          inTransit: inTransitBookings,
          delivered: deliveredBookings,
          cancelled: cancelledBookings,
          arrivedAtHub: arrivedAtHubBookings
        },
        payments: {
          paid: paidCount,
          willPay: willPayCount,
          notPaid: notPaidCount
        },
        manifests: {
          total: totalManifests,
          submitted: submittedManifests,
          dispatched: dispatchedManifests,
          delivered: deliveredManifests
        },
        settlements: {
          totalTransactions,
          totalWeight,
          oclCharge,
          remainingBalance,
          totalCost
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
});

// GET /api/medicine/courier-boys - Get all approved courier boys with type Medicine
router.get('/courier-boys', authenticateMedicine, async (req, res) => {
  try {
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    
    const courierBoys = await CourierBoy.find({ 
      type: 'Medicine',
      status: 'approved' 
    })
      .select('_id fullName email phone area pincode locality building vehicleType licenseNumber profilePhotoUrl')
      .sort({ fullName: 1 })
      .lean();

    res.json({
      success: true,
      data: courierBoys
    });
  } catch (error) {
    console.error('Error fetching medicine courier boys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courier boys',
      message: error.message
    });
  }
});

// POST /api/medicine/courier-boys/assign - Assign pickup to courier boy
router.post('/courier-boys/assign', authenticateMedicine, async (req, res) => {
  try {
    const { courierBoyId, customerDetails } = req.body;
    const medicineUserId = req.medicine._id;

    // Validate required fields
    if (!courierBoyId) {
      return res.status(400).json({
        success: false,
        error: 'Courier boy ID is required',
        message: 'Please select a courier boy to assign'
      });
    }

    if (!customerDetails) {
      return res.status(400).json({
        success: false,
        error: 'Customer details are required',
        message: 'Please provide customer details'
      });
    }

    const { customerName, phoneNumber, bookingAddress, numberOfPackages, approxWeight, specialInstruction } = customerDetails;

    // Validate customer details
    if (!customerName || !phoneNumber || !bookingAddress || !numberOfPackages || !approxWeight) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide all required customer details (name, phone, address, packages, weight)'
      });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number must be a valid 10-digit number'
      });
    }

    // Fetch courier boy details
    const CourierBoy = (await import('../models/CourierBoy.js')).default;
    const courierBoy = await CourierBoy.findById(courierBoyId);

    if (!courierBoy) {
      return res.status(404).json({
        success: false,
        error: 'Courier boy not found',
        message: 'The selected courier boy does not exist'
      });
    }

    if (courierBoy.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Courier boy not approved',
        message: 'Cannot assign pickup to an unapproved courier boy'
      });
    }

    // Store courier boy details for reference
    const courierBoyDetails = {
      _id: courierBoy._id.toString(),
      fullName: courierBoy.fullName,
      email: courierBoy.email,
      phone: courierBoy.phone,
      area: courierBoy.area,
      pincode: courierBoy.pincode,
      locality: courierBoy.locality,
      building: courierBoy.building,
      vehicleType: courierBoy.vehicleType,
      licenseNumber: courierBoy.licenseNumber || '',
      profilePhotoUrl: courierBoy.profilePhotoUrl || ''
    };

    // Create assignment record
    const assignment = new MedicineCourierBoyAssigned({
      medicineUserId: medicineUserId,
      courierBoyId: courierBoyId,
      courierBoyDetails: courierBoyDetails,
      customerDetails: {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.replace(/\D/g, '').slice(0, 10),
        bookingAddress: bookingAddress.trim(),
        numberOfPackages: numberOfPackages.trim(),
        approxWeight: approxWeight.trim(),
        specialInstruction: (specialInstruction || '').trim()
      },
      status: 'assigned',
      assignedAt: new Date()
    });

    await assignment.save();

    console.log(`✅ Pickup assigned: Medicine User ${medicineUserId} assigned courier boy ${courierBoy.fullName} for customer ${customerName}`);

    res.status(201).json({
      success: true,
      message: 'Pickup assigned successfully',
      data: {
        assignmentId: assignment._id,
        courierBoy: {
          _id: courierBoy._id,
          fullName: courierBoy.fullName,
          phone: courierBoy.phone
        },
        customer: {
          name: customerName,
          phone: phoneNumber
        },
        assignedAt: assignment.assignedAt
      }
    });
  } catch (error) {
    console.error('Error assigning pickup to courier boy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign pickup',
      message: error.message || 'An unexpected error occurred. Please try again.'
    });
  }
});

export default router;


