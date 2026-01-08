import express from 'express';
import CustomerBooking from '../models/CustomerBooking.js';
import BookingInvoice from '../models/BookingInvoice.js';
import { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import { getNextGlobalConsignmentNumber } from '../services/consignmentSequenceService.js';
import emailService from '../services/emailService.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// Helper function to generate invoice number
// Format: YY-YY/SSSSS (e.g., 25-26/00011)
const generateInvoiceNumber = (bookingReference, createdAt) => {
  const createdDate = new Date(createdAt);
  const currentYear = createdDate.getFullYear();
  const nextYear = currentYear + 1;
  const fiscalYear = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;

  const numericPart = bookingReference?.replace(/\D/g, "") || '0';
  const serial = numericPart.slice(-5).padStart(5, "0");

  return `${fiscalYear}/${serial}`;
};

// Helper function to convert number to words (Indian format)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero Rupees Only';
  
  const convertHundreds = (n) => {
    let result = '';
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      result += teens[n - 10] + ' ';
      return result.trim();
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  let remaining = integerPart;
  
  // Crore
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    result += convertHundreds(crore) + ' Crore ';
    remaining %= 10000000;
  }
  
  // Lakh
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    result += convertHundreds(lakh) + ' Lakh ';
    remaining %= 100000;
  }
  
  // Thousand
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    result += convertHundreds(thousand) + ' Thousand ';
    remaining %= 1000;
  }
  
  // Hundreds, Tens, Ones
  if (remaining > 0) {
    result += convertHundreds(remaining) + ' ';
  }
  
  result = result.trim() + ' Rupees';
  
  // Add paise if exists
  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + ' Paise';
  }
  
  return result + ' Only';
};

// POST /api/office-booking/create
// Separate endpoint for office bookings (duplicate structure but separate route)
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
      paymentInfo = {},
      detailsData = {},
      invoiceValue = '',
      currentStatus = 'booked' // Accept currentStatus from request, default to 'booked'
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
    if (!shipment.natureOfConsignment || !shipment.insurance || !shipment.riskCoverage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shipment data',
        message: 'Please provide all required shipment details'
      });
    }

    // Generate consignment number
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

    // Normalize payment method - map OfficeBookingPanel values to valid enum values
    const mapPaymentMethod = (method) => {
      if (!method || method === '') return '';
      const methodLower = method.toLowerCase().trim();
      
      // Map common office booking payment methods to valid enum values
      if (methodLower === 'cash') return 'cod';
      if (methodLower === 'to pay' || methodLower === 'topay') return 'pay_later';
      if (methodLower === 'razorpay' || methodLower === 'online') return 'razorpay';
      
      // If already a valid enum value, return as is
      if (['razorpay', 'cod', 'pay_later', ''].includes(methodLower)) {
        return methodLower;
      }
      
      // Default to empty string if unknown
      return '';
    };

    const normalizedPayment = {
      paymentStatus: paymentInfo.paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentMethod: mapPaymentMethod(paymentInfo.paymentMethod || ''),
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
        alternateNumbers: Array.isArray(origin.alternateNumbers) ? origin.alternateNumbers.filter(num => num && num.trim() !== '') : [],
        addressType: origin.addressType || 'Home',
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
        alternateNumbers: Array.isArray(destination.alternateNumbers) ? destination.alternateNumbers.filter(num => num && num.trim() !== '') : [],
        addressType: destination.addressType || 'Home',
        birthday: destination.birthday || '',
        anniversary: destination.anniversary || '',
        website: destination.website || '',
        otherAlternateNumber: destination.otherAlternateNumber || ''
      },
      shipment: {
        natureOfConsignment: shipment.natureOfConsignment || 'NON-DOX',
        insurance: shipment.insurance || 'Without insurance',
        riskCoverage: shipment.riskCoverage || 'Owner',
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
        insuranceDocument: shipment.insuranceDocument || '',
        declarationDocumentName: shipment.declarationDocumentName || '',
        declarationDocument: shipment.declarationDocument || ''
      },
      packageImages: Array.isArray(packageImages) ? packageImages : [],
      shippingMode: shippingMode || 'byAir',
      serviceType: serviceType || 'standard',
      calculatedPrice: typeof calculatedPrice === 'number' ? calculatedPrice : null,
      basePrice: null,
      gstAmount: null,
      pickupCharge: null,
      totalAmount: typeof calculatedPrice === 'number' ? calculatedPrice : null,
      actualWeight: typeof actualWeight === 'number' && actualWeight > 0 ? actualWeight : null,
      volumetricWeight: typeof volumetricWeight === 'number' && volumetricWeight > 0 ? volumetricWeight : null,
      chargeableWeight: typeof chargeableWeight === 'number' && chargeableWeight > 0 ? chargeableWeight : null,
      originServiceable: originServiceable !== undefined ? originServiceable : null,
      destinationServiceable: destinationServiceable !== undefined ? destinationServiceable : null,
      originAddressInfo: originAddressInfo || '',
      destinationAddressInfo: destinationAddressInfo || '',
      bookingReference: bookingReference,
      consignmentNumber,
      status: 'pending',
      currentStatus: currentStatus === 'picked' ? 'picked' : 'booked', // Use currentStatus from request
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

    // If currentStatus is 'picked', populate booked, pickup, and picked data
    if (currentStatus === 'picked') {
      const now = new Date();
      
      // Add booked entry to statusHistory
      if (!booking.statusHistory) {
        booking.statusHistory = [];
      }
      booking.statusHistory.push({
        status: 'booked',
        timestamp: booking.BookedAt || now,
        notes: 'Shipment booked'
      });

      // Add pickup entry to statusHistory
      booking.statusHistory.push({
        status: 'pickup',
        timestamp: now,
        notes: 'Shipment picked up'
      });

      // Add picked entry to statusHistory
      booking.statusHistory.push({
        status: 'picked',
        timestamp: now,
        notes: 'Shipment picked'
      });

      // Save the updated booking with status history
      await booking.save();
    }

    // Record consignment usage for tracking (same pattern as BookNow.tsx)
    try {
      const usage = new ConsignmentUsage({
        assignmentType: 'online_customer', // Use same type as BookNow
        entityId: booking._id, // Use booking ID as entity ID (same pattern as BookNow when no onlineCustomerId)
        onlineCustomerId: null, // Office bookings don't have online customer ID
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
        paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'unpaid',
        paymentType: booking.paymentMethod === 'cod' || booking.paymentMethod === 'pay_later' ? 'TP' : 'FP',
        status: 'active' // Default status (active, cancelled, completed)
      });

      await usage.save();
      console.log('📥 Consignment usage recorded for office booking:', usage._id);
    } catch (usageError) {
      console.error('⚠️ Failed to record consignment usage for office booking:', usageError);
      // Don't fail the booking if consignment usage recording fails
    }

    // Create and save invoice
    try {
      const invoiceNumber = generateInvoiceNumber(booking.bookingReference, booking.createdAt);
      
      // Parse pricing data from detailsData if available
      const parsePriceValue = (value) => {
        if (!value) return 0;
        const cleaned = String(value).replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
      };
      
      const grandTotal = parsePriceValue(detailsData.grandTotal) || booking.totalAmount || booking.calculatedPrice || 0;
      const totalBeforeGST = parsePriceValue(detailsData.total) || 0;
      const pickupChargeBase = parsePriceValue(detailsData.pickupCharge) || booking.pickupCharge || 100;
      const fuelCharge = parsePriceValue(detailsData.fuelCharge) || 0;
      const fuelChargePercentage = parseFloat(detailsData.fuelCharge) || 0;
      const cgst = parsePriceValue(detailsData.cgstAmount) || 0;
      const sgst = parsePriceValue(detailsData.sgstAmount) || 0;
      const igst = parsePriceValue(detailsData.igstAmount) || 0;
      
      // Calculate base price from charges
      const freightCharge = parsePriceValue(detailsData.freightCharge) || 0;
      const awbCharge = parsePriceValue(detailsData.awbCharge) || 0;
      const localCollection = parsePriceValue(detailsData.localCollection) || 0;
      const doorDelivery = parsePriceValue(detailsData.doorDelivery) || 0;
      const loadingUnloading = parsePriceValue(detailsData.loadingUnloading) || 0;
      const demurrageCharge = parsePriceValue(detailsData.demurrageCharge) || 0;
      const ddaCharge = parsePriceValue(detailsData.ddaCharge) || 0;
      const hamaliCharge = parsePriceValue(detailsData.hamaliCharge) || 0;
      const packingCharge = parsePriceValue(detailsData.packingCharge) || 0;
      const otherCharge = parsePriceValue(detailsData.otherCharge) || 0;
      
      const basePrice = freightCharge + awbCharge + localCollection + doorDelivery + 
                       loadingUnloading + demurrageCharge + ddaCharge + hamaliCharge + 
                       packingCharge + otherCharge;
      const subtotal = basePrice + pickupChargeBase;
      const pickupChargeGST = pickupChargeBase * 0.18;
      
      // Build bill to address
      const billToAddress = [
        booking.destination.flatBuilding || '',
        booking.destination.locality || '',
        booking.destination.area || '',
        booking.destination.city || '',
        booking.destination.state || '',
        booking.destination.pincode ? `PIN: ${booking.destination.pincode}` : ''
      ].filter(Boolean).join(', ');

      const invoiceData = {
        invoiceNumber,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber.toString(),
        invoiceType: 'booking',
        companyDetails: {
          name: "Our Courier & Logistics",
          location: "Rehabari, Guwahati, Assam 781008",
          gstin: " 18AJRPG5984B1ZV",
          state: "Assam",
          stateCode: "18",
          phone: "+91 0120 323 7111",
          email: "info@oclservices.com",
          website: "www.oclservices.com"
        },
        origin: {
          name: booking.origin.name || '',
          mobileNumber: booking.origin.mobileNumber || '',
          email: booking.origin.email || '',
          companyName: booking.origin.companyName || '',
          flatBuilding: booking.origin.flatBuilding || '',
          locality: booking.origin.locality || '',
          landmark: booking.origin.landmark || '',
          pincode: booking.origin.pincode || '',
          area: booking.origin.area || '',
          city: booking.origin.city || '',
          district: booking.origin.district || '',
          state: booking.origin.state || '',
          gstNumber: booking.origin.gstNumber || '',
          alternateNumbers: booking.origin.alternateNumbers || []
        },
        destination: {
          name: booking.destination.name || '',
          mobileNumber: booking.destination.mobileNumber || '',
          email: booking.destination.email || '',
          companyName: booking.destination.companyName || '',
          flatBuilding: booking.destination.flatBuilding || '',
          locality: booking.destination.locality || '',
          landmark: booking.destination.landmark || '',
          pincode: booking.destination.pincode || '',
          area: booking.destination.area || '',
          city: booking.destination.city || '',
          district: booking.destination.district || '',
          state: booking.destination.state || '',
          gstNumber: booking.destination.gstNumber || '',
          alternateNumbers: booking.destination.alternateNumbers || []
        },
        shipment: {
          natureOfConsignment: booking.shipment.natureOfConsignment || 'NON-DOX',
          shippingMode: booking.shippingMode || 'byAir',
          serviceType: booking.serviceType || 'standard',
          weight: booking.shipment.weight || '',
          declaredValue: invoiceValue || booking.shipment.declaredValue || '',
          packagesCount: booking.shipment.packagesCount || '',
          materials: booking.shipment.materials || '',
          others: booking.shipment.others || '',
          description: booking.shipment.description || '',
          length: booking.shipment.length || '',
          width: booking.shipment.width || '',
          height: booking.shipment.height || ''
        },
        pricing: {
          basePrice: basePrice,
          pickupCharge: pickupChargeBase,
          pickupChargeGST: pickupChargeGST,
          subtotal: subtotal,
          fuelCharge: fuelCharge,
          fuelChargePercentage: fuelChargePercentage,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          totalBeforeGST: totalBeforeGST || subtotal,
          grandTotal: grandTotal,
          amountInWords: numberToWords(grandTotal)
        },
        payment: {
          status: booking.paymentStatus || 'unpaid',
          modeOfPayment: booking.paymentMethod === 'cod' ? 'Cash' : 
                         booking.paymentMethod === 'pay_later' ? 'To Pay' : '',
          paymentMethod: booking.paymentMethod || '',
          amount: grandTotal
        },
        invoiceDate: booking.createdAt,
        itemDescription: booking.shipment.natureOfConsignment === 'DOX' ? 'Document' : 
                        booking.shipment.natureOfConsignment === 'NON-DOX' ? 'Parcel' : 
                        booking.shipment.natureOfConsignment || 'Document',
        barcodeValue: booking.bookingReference?.replace(/\D/g, "") || booking.consignmentNumber.toString(),
        billTo: {
          name: booking.destination.name || '',
          phone: booking.destination.mobileNumber || '',
          address: billToAddress
        }
      };

      const invoice = new BookingInvoice(invoiceData);
      await invoice.save();
      console.log('✅ Invoice saved successfully:', invoiceNumber, 'for booking:', bookingReference);
    } catch (invoiceError) {
      console.error('⚠️ Failed to save invoice for office booking:', invoiceError);
      // Invoice failure doesn't affect the booking - it's already saved and response sent
    }

    console.log('✅ Office booking created successfully:', booking._id, bookingReference);

    // Send response immediately - don't wait for email
    res.status(201).json({
      success: true,
      message: 'Office booking created successfully',
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });

    // Send booking confirmation email to sender (origin contact) - run in background (non-blocking)
    // This runs after the response is sent, so it doesn't delay the booking confirmation
    (async () => {
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
        console.log('✅ Office booking confirmation email sent successfully for:', bookingReference);
      } catch (emailError) {
        console.error('⚠️ Failed to send office booking confirmation email:', emailError);
        // Email failure doesn't affect the booking - it's already saved and response sent
      }
    })(); // IIFE - Immediately Invoked Function Expression, runs in background

    // Send booking confirmation WhatsApp message to sender (origin contact) - run in background (non-blocking)
    // This runs after the response is sent, so it doesn't delay the booking confirmation
    (async () => {
      try {
        // Get sender's phone number from origin
        const senderPhoneNumber = booking.origin?.mobileNumber;
        
        if (!senderPhoneNumber) {
          console.warn('⚠️ No sender phone number found, skipping WhatsApp notification');
          return;
        }

        // Build tracking URL
        const trackingUrl = `https://oclservices.com/tracking?view=progress&type=awb&number=${consignmentNumber}`;

        // Send WhatsApp message
        const whatsappResult = await whatsappService.sendBookingConfirmation({
          phoneNumber: senderPhoneNumber,
          consignmentNumber: consignmentNumber.toString(),
          trackingUrl: trackingUrl
        });

        if (whatsappResult.success) {
          console.log('✅ Office booking confirmation WhatsApp sent successfully for:', bookingReference);
        } else {
          console.error('⚠️ Failed to send office booking confirmation WhatsApp:', whatsappResult.error);
        }
      } catch (whatsappError) {
        console.error('⚠️ Failed to send office booking confirmation WhatsApp:', whatsappError);
        // WhatsApp failure doesn't affect the booking - it's already saved and response sent
      }
    })(); // IIFE - Immediately Invoked Function Expression, runs in background

  } catch (error) {
    console.error('❌ Error creating office booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message || 'An error occurred while creating the booking'
    });
  }
});

export default router;

