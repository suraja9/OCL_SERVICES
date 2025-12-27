import express from 'express';
import SalesForm from '../models/SalesForm.js';
import { uploadSalesFormImage, handleUploadError } from '../middleware/upload.js';
import S3Service from '../services/s3Service.js';

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
      typeOfVehicleRequired
    } = req.body;

    // Validate required fields
    const requiredFields = {
      companyName: 'Company name is required',
      concernPersonName: 'Concern person name is required',
      designation: 'Designation is required',
      phoneNumber: 'Phone number is required',
      emailAddress: 'Email address is required',
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email',
        message: 'Please enter a valid email address'
      });
    }

    // Validate packingRequired value
    if (!['yes', 'no'].includes(packingRequired.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid packing option',
        message: 'Packing required must be either "yes" or "no"'
      });
    }

    // Handle image upload to S3 if file exists
    let uploadedImageUrl = '';
    let uploadedImageKey = '';
    let uploadedImageOriginalName = '';

    if (req.file) {
      try {
        const uploadResult = await S3Service.uploadFile(
          req.file,
          'uploads/sales-form-images'
        );

        if (uploadResult.success) {
          uploadedImageUrl = uploadResult.url;
          uploadedImageKey = uploadResult.key;
          uploadedImageOriginalName = uploadResult.originalName;
          console.log(`✅ Sales form image uploaded to S3: ${uploadResult.url}`);
        }
      } catch (uploadError) {
        console.error('Error uploading image to S3:', uploadError);
        // Don't fail the form submission if image upload fails
        // Just log the error and continue
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
      emailAddress: emailAddress.trim().toLowerCase(),
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
      uploadedImage: uploadedImageUrl,
      uploadedImageKey: uploadedImageKey,
      uploadedImageOriginalName: uploadedImageOriginalName,
      status: 'pending'
    });

    await salesForm.save();

    console.log(`✅ Sales form submitted successfully: ${companyName} - ${emailAddress}`);

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

// PATCH /api/sales-form/:id - Update sales form status (for admin)
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, handledBy } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (handledBy) {
      updateData.handledBy = handledBy;
    }

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
    res.status(500).json({
      success: false,
      error: 'Failed to update sales form',
      message: error.message
    });
  }
});

export default router;

