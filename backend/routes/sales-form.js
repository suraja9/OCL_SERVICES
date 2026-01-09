import express from 'express';
import SalesForm from '../models/SalesForm.js';
import { uploadSalesFormImage, handleUploadError } from '../middleware/upload.js';
import S3Service from '../services/s3Service.js';
import GoogleSheetsService from '../services/googleSheetsService.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/sales-form - Submit sales form data
router.post('/', uploadSalesFormImage, handleUploadError, async (req, res) => {
  try {
    const {
      companyName,
      concernPersonName,
      designation,
      phoneNumber,
      emailAddress,
      alternatePhoneNumber,
      website,
      fullAddress, // Legacy field - will be used if provided, otherwise generated from structured fields
      // New structured address fields
      locality,
      buildingFlatNo,
      landmark,
      pincode,
      city,
      state,
      area,
      typeOfBusiness,
      typeOfShipments,
      averageShipmentVolume,
      mostFrequentRoutes,
      weightRange,
      packingRequired,
      existingLogisticsPartners,
      currentIssues,
      vehiclesNeededPerMonth,
      typeOfVehicleRequired,
      submittedByName,
      submissionLocation,
      submissionCity,
      submissionState,
      submissionCountry,
      submissionFullAddress,
      submissionIpAddress
    } = req.body;

    // Validate required fields
    const requiredFields = {
      companyName: 'Company name is required',
      concernPersonName: 'Concern person name is required',
      designation: 'Designation is required',
      phoneNumber: 'Phone number is required',
      // emailAddress is optional - removed from required fields
      typeOfBusiness: 'Type of business is required',
      typeOfShipments: 'Type of shipments is required',
      averageShipmentVolume: 'Average shipment volume is required',
      mostFrequentRoutes: 'Most frequent routes is required',
      weightRange: 'Weight range is required',
      packingRequired: 'Packing required option is required',
      existingLogisticsPartners: 'Existing logistics partners is required',
      currentIssues: 'Current issues is required',
      vehiclesNeededPerMonth: 'Vehicles needed per month is required',
      typeOfVehicleRequired: 'Type of vehicle required is required'
    };

    // Address validation - either fullAddress (legacy) or structured fields
    const hasFullAddress = fullAddress && fullAddress.trim();
    const hasStructuredAddress = locality && locality.trim() &&
      buildingFlatNo && buildingFlatNo.trim() &&
      pincode && pincode.trim() &&
      city && city.trim() &&
      state && state.trim();

    if (!hasFullAddress && !hasStructuredAddress) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please provide either full address or all address fields (locality, building/flat no, pincode, city, state)',
        details: ['Address information is required']
      });
    }

    const missingFields = [];
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(message);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please fill in all required fields',
        details: missingFields
      });
    }

    // Validate email format (only if email is provided)
    if (emailAddress && emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email',
          message: 'Please enter a valid email address'
        });
      }
    }

    // Validate packingRequired value
    if (!['yes', 'no'].includes(packingRequired.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid packing option',
        message: 'Packing required must be either "yes" or "no"'
      });
    }

    // Handle image uploads to S3 if files exist
    const uploadedImages = [];
    const uploadedImageKeys = [];
    const uploadedImageOriginalNames = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await S3Service.uploadFile(
            file,
            'uploads/sales-form-images'
          );

          if (uploadResult.success) {
            uploadedImages.push(uploadResult.url);
            uploadedImageKeys.push(uploadResult.key);
            uploadedImageOriginalNames.push(uploadResult.originalName);
            console.log(`✅ Sales form image uploaded to S3: ${uploadResult.url}`);
          }
        } catch (uploadError) {
          console.error('Error uploading image to S3:', uploadError);
          // Don't fail the form submission if image upload fails
          // Just log the error and continue
        }
      }
    }

    // Generate fullAddress from structured fields if not provided
    let finalFullAddress = fullAddress?.trim() || '';
    if (!finalFullAddress && hasStructuredAddress) {
      const addressParts = [
        locality?.trim(),
        buildingFlatNo?.trim(),
        landmark?.trim(),
        area?.trim(),
        city?.trim(),
        state?.trim(),
        pincode?.trim()
      ].filter(part => part && part.length > 0);
      finalFullAddress = addressParts.join(', ');
    }

    // Create new sales form entry
    const salesForm = new SalesForm({
      companyName: companyName.trim(),
      concernPersonName: concernPersonName.trim(),
      designation: designation.trim(),
      phoneNumber: phoneNumber.trim(),
      emailAddress: emailAddress?.trim().toLowerCase() || '',
      alternatePhoneNumber: alternatePhoneNumber?.trim() || '',
      website: website?.trim() || '',
      // Structured address fields
      locality: locality?.trim() || '',
      buildingFlatNo: buildingFlatNo?.trim() || '',
      landmark: landmark?.trim() || '',
      pincode: pincode?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      area: area?.trim() || '',
      // Full address (generated or provided)
      fullAddress: finalFullAddress,
      typeOfBusiness: typeOfBusiness.trim(),
      typeOfShipments: typeOfShipments.trim(),
      averageShipmentVolume: averageShipmentVolume.trim(),
      mostFrequentRoutes: mostFrequentRoutes.trim(),
      weightRange: weightRange.trim(),
      packingRequired: packingRequired.toLowerCase(),
      existingLogisticsPartners: existingLogisticsPartners.trim(),
      currentIssues: currentIssues.trim(),
      vehiclesNeededPerMonth: vehiclesNeededPerMonth.trim(),
      typeOfVehicleRequired: typeOfVehicleRequired.trim(),
      // Multiple images (new)
      uploadedImages: uploadedImages,
      uploadedImageKeys: uploadedImageKeys,
      uploadedImageOriginalNames: uploadedImageOriginalNames,
      // Legacy single image fields (for backward compatibility - use first image if available)
      uploadedImage: uploadedImages.length > 0 ? uploadedImages[0] : '',
      uploadedImageKey: uploadedImageKeys.length > 0 ? uploadedImageKeys[0] : '',
      uploadedImageOriginalName: uploadedImageOriginalNames.length > 0 ? uploadedImageOriginalNames[0] : '',
      submittedByName: submittedByName?.trim() || '',
      // Location data
      submissionLocation: (() => {
        if (!submissionLocation) return undefined;
        try {
          // Parse JSON string if it's a string, otherwise use as is
          const parsed = typeof submissionLocation === 'string' 
            ? JSON.parse(submissionLocation) 
            : submissionLocation;
          // Validate coordinates
          if (parsed && parsed.coordinates && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
            // Check if coordinates are valid (not [0, 0] which is default)
            if (parsed.coordinates[0] !== 0 || parsed.coordinates[1] !== 0) {
              return parsed;
            }
          }
          return undefined;
        } catch (e) {
          console.warn('Error parsing submissionLocation:', e);
          return undefined;
        }
      })(),
      submissionCity: submissionCity?.trim() || '',
      submissionState: submissionState?.trim() || '',
      submissionCountry: submissionCountry?.trim() || '',
      submissionFullAddress: submissionFullAddress?.trim() || '',
      submissionIpAddress: submissionIpAddress?.trim() || '',
      status: 'pending'
    });

    await salesForm.save();

    console.log(`✅ Sales form submitted successfully: ${companyName}${emailAddress ? ` - ${emailAddress}` : ''}`);

    res.status(201).json({
      success: true,
      message: 'Sales form submitted successfully!',
      data: {
        id: salesForm._id,
        companyName: salesForm.companyName,
        emailAddress: salesForm.emailAddress,
        phoneNumber: salesForm.phoneNumber,
        status: salesForm.status,
        createdAt: salesForm.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting sales form:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit sales form',
      message: error.message || 'Internal server error'
    });
  }
});

// GET /api/sales-form - Get all sales forms (for admin)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const salesForms = await SalesForm.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-__v');

    const total = await SalesForm.countDocuments(query);

    res.json({
      success: true,
      data: salesForms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching sales forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales forms',
      message: error.message
    });
  }
});

// GET /api/sales-form/:id - Get a specific sales form
router.get('/:id', async (req, res) => {
  try {
    const salesForm = await SalesForm.findById(req.params.id)
      .populate('handledBy', 'name email')
      .select('-__v');

    if (!salesForm) {
      return res.status(404).json({
        success: false,
        error: 'Sales form not found'
      });
    }

    res.json({
      success: true,
      data: salesForm
    });
  } catch (error) {
    console.error('Error fetching sales form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales form',
      message: error.message
    });
  }
});

// PATCH /api/sales-form/:id - Update sales form (for admin)
router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const {
      companyName,
      concernPersonName,
      designation,
      phoneNumber,
      emailAddress,
      alternatePhoneNumber,
      website,
      fullAddress,
      locality,
      buildingFlatNo,
      landmark,
      pincode,
      city,
      state,
      area,
      typeOfBusiness,
      typeOfShipments,
      averageShipmentVolume,
      mostFrequentRoutes,
      weightRange,
      packingRequired,
      existingLogisticsPartners,
      currentIssues,
      vehiclesNeededPerMonth,
      typeOfVehicleRequired,
      status,
      notes,
      remarks,
      handledBy
    } = req.body;

    // Build update data object
    const updateData = {};

    // Company & Contact Information
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (concernPersonName !== undefined) updateData.concernPersonName = concernPersonName.trim();
    if (designation !== undefined) updateData.designation = designation.trim();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
    if (emailAddress !== undefined) {
      // Validate email format (only if email is provided)
      if (emailAddress && emailAddress.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailAddress.trim())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email',
            message: 'Please enter a valid email address'
          });
        }
        updateData.emailAddress = emailAddress.trim().toLowerCase();
      } else {
        // Allow empty email
        updateData.emailAddress = '';
      }
    }
    if (alternatePhoneNumber !== undefined) updateData.alternatePhoneNumber = alternatePhoneNumber.trim();
    if (website !== undefined) updateData.website = website.trim();

    // Address fields
    if (locality !== undefined) updateData.locality = locality.trim();
    if (buildingFlatNo !== undefined) updateData.buildingFlatNo = buildingFlatNo.trim();
    if (landmark !== undefined) updateData.landmark = landmark.trim();
    if (pincode !== undefined) updateData.pincode = pincode.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (area !== undefined) updateData.area = area.trim();
    if (fullAddress !== undefined) updateData.fullAddress = fullAddress.trim();

    // Generate fullAddress from structured fields if fullAddress is not provided but structured fields are
    if (!updateData.fullAddress && (locality || buildingFlatNo || city || state || pincode)) {
      const addressParts = [
        updateData.locality || locality,
        updateData.buildingFlatNo || buildingFlatNo,
        updateData.landmark || landmark,
        updateData.area || area,
        updateData.city || city,
        updateData.state || state,
        updateData.pincode || pincode
      ].filter(part => part && part.trim().length > 0);
      if (addressParts.length > 0) {
        updateData.fullAddress = addressParts.join(', ');
      }
    }

    // Business & Shipment Details
    if (typeOfBusiness !== undefined) updateData.typeOfBusiness = typeOfBusiness.trim();
    if (typeOfShipments !== undefined) updateData.typeOfShipments = typeOfShipments.trim();
    if (averageShipmentVolume !== undefined) updateData.averageShipmentVolume = averageShipmentVolume.trim();
    if (mostFrequentRoutes !== undefined) updateData.mostFrequentRoutes = mostFrequentRoutes.trim();
    if (weightRange !== undefined) updateData.weightRange = weightRange.trim();
    if (packingRequired !== undefined) {
      if (!['yes', 'no'].includes(packingRequired.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid packing option',
          message: 'Packing required must be either "yes" or "no"'
        });
      }
      updateData.packingRequired = packingRequired.toLowerCase();
    }

    // Logistics Setup
    if (existingLogisticsPartners !== undefined) updateData.existingLogisticsPartners = existingLogisticsPartners.trim();
    if (currentIssues !== undefined) updateData.currentIssues = currentIssues.trim();

    // Vehicle Requirements
    if (vehiclesNeededPerMonth !== undefined) updateData.vehiclesNeededPerMonth = vehiclesNeededPerMonth.trim();
    if (typeOfVehicleRequired !== undefined) updateData.typeOfVehicleRequired = typeOfVehicleRequired.trim();

    // Status & Notes & Remarks
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes.trim();
    if (remarks !== undefined) updateData.remarks = remarks.trim();
    if (handledBy !== undefined) updateData.handledBy = handledBy;

    // Update the document
    const salesForm = await SalesForm.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!salesForm) {
      return res.status(404).json({
        success: false,
        error: 'Sales form not found'
      });
    }

    res.json({
      success: true,
      message: 'Sales form updated successfully',
      data: salesForm
    });
  } catch (error) {
    console.error('Error updating sales form:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update sales form',
      message: error.message
    });
  }
});

// POST /api/sales-form/sync-to-sheets - Sync all sales forms to Google Sheets
router.post('/sync-to-sheets', authenticateAdmin, async (req, res) => {
  try {
    // Fetch all sales forms (no pagination for sync)
    const salesForms = await SalesForm.find({})
      .sort({ createdAt: -1 })
      .select('-__v');

    if (salesForms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No sales forms found',
        message: 'There are no sales forms to sync'
      });
    }

    // Sync to Google Sheets
    const result = await GoogleSheetsService.syncSalesForms(salesForms);

    res.json({
      success: true,
      message: result.message,
      data: {
        sheetName: result.sheetName,
        rowsAdded: result.rowsAdded,
        totalForms: salesForms.length,
        spreadsheetUrl: result.spreadsheetUrl
      }
    });
  } catch (error) {
    console.error('Error syncing sales forms to Google Sheets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync sales forms to Google Sheets',
      message: error.message || 'Internal server error'
    });
  }
});

// GET /api/sales-form/sheets-url - Get Google Sheets URL
router.get('/sheets-url', authenticateAdmin, async (req, res) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets not configured',
        message: 'GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables'
      });
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    res.json({
      success: true,
      data: {
        spreadsheetUrl,
        sheetName: 'Sales_Forms'
      }
    });
  } catch (error) {
    console.error('Error getting Google Sheets URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Sheets URL',
      message: error.message || 'Internal server error'
    });
  }
});

export default router;

