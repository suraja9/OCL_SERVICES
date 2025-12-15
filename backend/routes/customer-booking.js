import express from 'express';
import CustomerBooking from '../models/CustomerBooking.js';
import { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import { getNextGlobalConsignmentNumber } from '../services/consignmentSequenceService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// POST /api/customer-booking/create
router.post('/create', async (req, res) => {
  try {
    const {
      origin,
      destination,
      shipment,
      packageImages,
      shippingMode,
      serviceType,
      calculatedPrice,
      actualWeight,
      volumetricWeight,
      chargeableWeight,
      originServiceable,
      destinationServiceable,
      originAddressInfo,
      destinationAddressInfo,
      onlineCustomerId,
      paymentInfo = {}
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !shipment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide origin, destination, and shipment details'
      });
    }

    // Validate origin required fields
    if (!origin.name || !origin.mobileNumber || !origin.pincode || !origin.city || !origin.district || !origin.state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid origin data',
        message: 'Please provide all required origin details'
      });
    }

    // Validate destination required fields
    if (!destination.name || !destination.mobileNumber || !destination.pincode || !destination.city || !destination.district || !destination.state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid destination data',
        message: 'Please provide all required destination details'
      });
    }

    // Validate shipment required fields
    if (!shipment.natureOfConsignment || !shipment.insurance || !shipment.riskCoverage || !shipment.packagesCount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shipment data',
        message: 'Please provide all required shipment details'
      });
    }

    // Generate next available consignment number which will also serve as booking reference
    let consignmentNumber;
    try {
      consignmentNumber = await getNextGlobalConsignmentNumber();
    } catch (error) {
      console.error('❌ Error generating consignment number:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate consignment number',
        message: error.message || 'Please try again later'
      });
    }

    const bookingReference = consignmentNumber.toString();

    const normalizedPayment = {
      paymentStatus: paymentInfo.paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentMethod: paymentInfo.paymentMethod || '',
      razorpayOrderId: paymentInfo.razorpayOrderId || '',
      razorpayPaymentId: paymentInfo.razorpayPaymentId || '',
      razorpaySignature: paymentInfo.razorpaySignature || '',
      paidAt: paymentInfo.paymentStatus === 'paid'
        ? (paymentInfo.paidAt ? new Date(paymentInfo.paidAt) : new Date())
        : null
    };

    // Create booking payload
    const bookingData = {
      origin: {
        name: origin.name || '',
        mobileNumber: origin.mobileNumber || '',
        email: origin.email || '',
        companyName: origin.companyName || '',
        flatBuilding: origin.flatBuilding || '',
        locality: origin.locality || '',
        landmark: origin.landmark || '',
        pincode: origin.pincode || '',
        area: origin.area || '',
        city: origin.city || '',
        district: origin.district || '',
        state: origin.state || '',
        gstNumber: origin.gstNumber || '',
        alternateNumbers: origin.alternateNumbers || [],
        addressType: origin.addressType || 'HOME',
        birthday: origin.birthday || '',
        anniversary: origin.anniversary || '',
        website: origin.website || '',
        otherAlternateNumber: origin.otherAlternateNumber || ''
      },
      destination: {
        name: destination.name || '',
        mobileNumber: destination.mobileNumber || '',
        email: destination.email || '',
        companyName: destination.companyName || '',
        flatBuilding: destination.flatBuilding || '',
        locality: destination.locality || '',
        landmark: destination.landmark || '',
        pincode: destination.pincode || '',
        area: destination.area || '',
        city: destination.city || '',
        district: destination.district || '',
        state: destination.state || '',
        gstNumber: destination.gstNumber || '',
        alternateNumbers: destination.alternateNumbers || [],
        addressType: destination.addressType || 'HOME',
        birthday: destination.birthday || '',
        anniversary: destination.anniversary || '',
        website: destination.website || '',
        otherAlternateNumber: destination.otherAlternateNumber || ''
      },
      shipment: {
        natureOfConsignment: shipment.natureOfConsignment || '',
        insurance: shipment.insurance || '',
        riskCoverage: shipment.riskCoverage || '',
        packagesCount: shipment.packagesCount || '',
        materials: shipment.materials || '',
        others: shipment.others || '',
        description: shipment.description || '',
        declaredValue: shipment.declaredValue || '',
        weight: shipment.weight || '',
        length: shipment.length || '',
        width: shipment.width || '',
        height: shipment.height || '',
        insuranceCompanyName: shipment.insuranceCompanyName || '',
        insurancePolicyNumber: shipment.insurancePolicyNumber || '',
        insurancePolicyDate: shipment.insurancePolicyDate || '',
        insuranceValidUpto: shipment.insuranceValidUpto || '',
        insurancePremiumAmount: shipment.insurancePremiumAmount || '',
        insuranceDocumentName: shipment.insuranceDocumentName || '',
        insuranceDocument: shipment.insuranceDocument || '', // S3 URL
        declarationDocumentName: shipment.declarationDocumentName || '',
        declarationDocument: shipment.declarationDocument || '' // S3 URL
      },
      packageImages: packageImages || [], // Array of S3 URLs
      shippingMode: shippingMode || '',
      serviceType: serviceType || '',
      calculatedPrice: calculatedPrice || null,
      // Calculate price breakdown (calculatedPrice already includes GST)
      basePrice: calculatedPrice ? Number((calculatedPrice / 1.18).toFixed(2)) : null,
      gstAmount: calculatedPrice ? Number((calculatedPrice - (calculatedPrice / 1.18)).toFixed(2)) : null,
      pickupCharge: 100, // Door pickup charge
      totalAmount: calculatedPrice ? Number((calculatedPrice + 100).toFixed(2)) : null,
      actualWeight: actualWeight || null,
      volumetricWeight: volumetricWeight || null,
      chargeableWeight: chargeableWeight || null,
      originServiceable: originServiceable !== undefined ? originServiceable : null,
      destinationServiceable: destinationServiceable !== undefined ? destinationServiceable : null,
      originAddressInfo: originAddressInfo || '',
      destinationAddressInfo: destinationAddressInfo || '',
      bookingReference: bookingReference,
      consignmentNumber,
      status: 'pending',
      currentStatus: 'booked', // Set initial tracking status to 'booked'
      BookedAt: new Date(), // Record booking timestamp
      onlineCustomerId: onlineCustomerId || null,
      paymentStatus: normalizedPayment.paymentStatus,
      paymentMethod: normalizedPayment.paymentMethod,
      razorpayOrderId: normalizedPayment.razorpayOrderId,
      razorpayPaymentId: normalizedPayment.razorpayPaymentId,
      razorpaySignature: normalizedPayment.razorpaySignature,
      paidAt: normalizedPayment.paidAt
    };

    if (normalizedPayment.paymentStatus === 'paid' && bookingData.status === 'pending') {
      bookingData.status = 'confirmed';
    }

    // Create booking
    const booking = new CustomerBooking(bookingData);
    await booking.save();

    // Record consignment usage for tracking
    try {
      const usage = new ConsignmentUsage({
        assignmentType: 'online_customer',
        entityId: booking.onlineCustomerId || booking._id,
        onlineCustomerId: booking.onlineCustomerId || null,
        consignmentNumber: booking.consignmentNumber,
        bookingReference: booking.bookingReference,
        bookingData: {
          origin: booking.origin,
          destination: booking.destination,
          shipment: booking.shipment,
          shippingMode: booking.shippingMode,
          serviceType: booking.serviceType,
          calculatedPrice: booking.calculatedPrice,
          onlineCustomerId: booking.onlineCustomerId,
          customerBookingId: booking._id
        },
        freightCharges: booking.calculatedPrice || 0,
        totalAmount: booking.totalAmount || (booking.calculatedPrice ? booking.calculatedPrice + 100 : 0),
        paymentStatus: normalizedPayment.paymentStatus === 'paid' ? 'paid' : 'unpaid',
        paymentType: normalizedPayment.paymentStatus === 'paid' ? 'FP' : 'TP'
      });

      await usage.save();
      console.log('📥 Consignment usage recorded for online booking:', usage._id);
    } catch (usageError) {
      console.error('⚠️ Failed to record consignment usage for online booking:', usageError);
    }

    console.log('✅ Customer booking created successfully:', booking._id, bookingReference);

    // Send booking confirmation email to sender (origin contact)
    try {
      await emailService.sendOnlineBookingConfirmationEmail({
        bookingReference,
        consignmentNumber,
        bookingDate: booking.createdAt,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        shippingMode: booking.shippingMode,
        serviceType: booking.serviceType,
        calculatedPrice: booking.calculatedPrice,
        basePrice: booking.basePrice,
        gstAmount: booking.gstAmount,
        pickupCharge: booking.pickupCharge || 100,
        totalAmount: booking.totalAmount || (booking.calculatedPrice ? booking.calculatedPrice + 100 : null),
        origin: booking.origin,
        destination: booking.destination,
        shipment: booking.shipment,
        packageImages: booking.packageImages || []
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send online booking confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating customer booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message || 'An error occurred while creating the booking'
    });
  }
});

// GET /api/customer-booking/search-by-phone
router.get('/search-by-phone', async (req, res) => {
  try {
    const { phoneNumber, type } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required',
        message: 'Please provide a phone number'
      });
    }

    if (!type || (type !== 'origin' && type !== 'destination')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type',
        message: 'Type must be either "origin" or "destination"'
      });
    }

    // Clean phone number (remove non-digits)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    if (cleanPhoneNumber.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number must be 10 digits'
      });
    }

    // Find all bookings with this phone number
    const query = type === 'origin' 
      ? { 'origin.mobileNumber': cleanPhoneNumber }
      : { 'destination.mobileNumber': cleanPhoneNumber };

    const bookings = await CustomerBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent too many results

    if (bookings.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No records found for this phone number'
      });
    }

    // Extract unique records based on key fields
    // We'll consider records unique if they have different combinations of:
    // name, pincode, city, district, state, locality, flatBuilding
    const uniqueRecords = [];
    const seenKeys = new Set();

    bookings.forEach(booking => {
      const data = type === 'origin' ? booking.origin : booking.destination;
      
      // Create a unique key based on address fields
      const uniqueKey = [
        data.name || '',
        data.pincode || '',
        data.city || '',
        data.district || '',
        data.state || '',
        data.locality || '',
        data.flatBuilding || ''
      ].join('|').toLowerCase();

      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        uniqueRecords.push({
          name: data.name || '',
          mobileNumber: data.mobileNumber || '',
          email: data.email || '',
          companyName: data.companyName || '',
          flatBuilding: data.flatBuilding || '',
          locality: data.locality || '',
          landmark: data.landmark || '',
          pincode: data.pincode || '',
          area: data.area || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          gstNumber: data.gstNumber || '',
          alternateNumbers: data.alternateNumbers || [],
          addressType: data.addressType || 'Home',
          birthday: data.birthday || '',
          anniversary: data.anniversary || '',
          website: data.website || '',
          otherAlternateNumber: data.otherAlternateNumber || ''
        });
      }
    });

    res.json({
      success: true,
      data: uniqueRecords,
      count: uniqueRecords.length
    });

  } catch (error) {
    console.error('Error searching by phone number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search by phone number',
      message: error.message || 'An error occurred while searching'
    });
  }
});

// GET /api/customer-booking/:bookingReference
router.get('/:bookingReference', async (req, res) => {
  try {
    const { bookingReference } = req.params;

    const booking = await CustomerBooking.findOne({ bookingReference });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'No booking found with the provided reference'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching customer booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message || 'An error occurred while fetching the booking'
    });
  }
});

// GET /api/customer-booking
router.get('/', async (req, res) => {
  try {
    const { status, currentStatus, limit = 50, skip = 0, onlineCustomerId } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    // Filter by currentStatus for tracking status
    if (currentStatus) {
      query.currentStatus = currentStatus;
    }
    // Filter by onlineCustomerId if provided (for logged-in users)
    if (onlineCustomerId) {
      query.onlineCustomerId = onlineCustomerId;
    }

    const bookings = await CustomerBooking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Filter out bookings where assignedCourierBoy exists but has no actual courier data
    const filteredBookings = bookings.map(booking => {
      if (booking.assignedCourierBoy) {
        // Check if assignedCourierBoy is actually empty or doesn't have courierBoyId/fullName
        if (!booking.assignedCourierBoy.courierBoyId && !booking.assignedCourierBoy.fullName) {
          booking.assignedCourierBoy = null;
          booking.assignedCourierBoyAt = null;
        }
      }
      return booking;
    });

    const total = await CustomerBooking.countDocuments(query);

    res.json({
      success: true,
      data: filteredBookings,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message || 'An error occurred while fetching bookings'
    });
  }
});

// PATCH /api/customer-booking/:bookingReference/status
router.patch('/:bookingReference/status', async (req, res) => {
  try {
    const { bookingReference } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status required',
        message: 'Please provide a status'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await CustomerBooking.findOne({ bookingReference });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'No booking found with the provided reference'
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        bookingReference: booking.bookingReference,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      message: error.message || 'An error occurred while updating the booking status'
    });
  }
});

// PATCH /api/customer-booking/:bookingId/payment
router.patch('/:bookingId/payment', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus, paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const booking = await CustomerBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'No booking found with the provided ID'
      });
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
    }
    if (razorpayOrderId) {
      booking.razorpayOrderId = razorpayOrderId;
    }
    if (razorpayPaymentId) {
      booking.razorpayPaymentId = razorpayPaymentId;
    }
    if (razorpaySignature) {
      booking.razorpaySignature = razorpaySignature;
    }
    if (paymentStatus === 'paid') {
      booking.paidAt = new Date();
      // Also update booking status to confirmed when payment is successful
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
    }

    await booking.save();

    // Sync payment status with consignment usage if available
    if (booking.consignmentNumber) {
      const usageUpdate = {};

      if (paymentStatus) {
        usageUpdate.paymentStatus = paymentStatus === 'paid' ? 'paid' : 'unpaid';
      }

      if (paymentMethod) {
        usageUpdate.paymentType = paymentMethod === 'cod' || paymentMethod === 'pay_later' ? 'TP' : 'FP';
      }

      usageUpdate.freightCharges = typeof booking.calculatedPrice === 'number' ? booking.calculatedPrice : 0;
      usageUpdate.totalAmount = booking.totalAmount || (typeof booking.calculatedPrice === 'number' ? booking.calculatedPrice + 100 : 0);

      await ConsignmentUsage.findOneAndUpdate(
        { consignmentNumber: booking.consignmentNumber, bookingReference: booking.bookingReference },
        usageUpdate
      );
    }

    res.json({
      success: true,
      message: 'Payment information updated successfully',
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error updating payment information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment information',
      message: error.message || 'An error occurred while updating payment information'
    });
  }
});

export default router;

