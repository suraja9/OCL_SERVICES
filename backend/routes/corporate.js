import express from 'express';
import CorporateData from '../models/CorporateData.js';
import ConsignmentAssignment, { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import CourierRequest from '../models/CourierRequest.js';
import Tracking from '../models/Tracking.js';
import { generateToken, authenticateCorporate, validateLoginInput } from '../middleware/auth.js';
import { uploadCorporateLogo, handleCorporateLogoUploadError } from '../middleware/corporateLogoUpload.js';
import S3Service from '../services/s3Service.js';
import emailService from '../services/emailService.js';

const router = express.Router();

const CUSTOMER_TRACKING_STEPS = [
  { key: 'booked', title: 'Booked' },
  { key: 'received_at_ocl', title: 'Received at OCL' },
  { key: 'in_transit', title: 'In Transit' },
  { key: 'out_for_delivery', title: 'Out for Delivery' },
  { key: 'delivered', title: 'Delivered' }
];

const TRACKING_STEP_ORDER = CUSTOMER_TRACKING_STEPS.reduce((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

const STEP_TITLE_MAP = CUSTOMER_TRACKING_STEPS.reduce((acc, step) => {
  acc[step.key] = step.title;
  return acc;
}, {});

const deriveStepKeyFromStatus = (status = '') => {
  const normalized = status?.toString().toLowerCase() || '';
  if (['delivered'].includes(normalized)) return 'delivered';
  if (['ofp', 'out_for_delivery'].includes(normalized)) return 'out_for_delivery';
  if (['in_transit', 'intransit', 'assigned', 'courierboy', 'reached-hub', 'reachedhub', 'assigned_completed'].includes(normalized)) {
    return 'in_transit';
  }
  if (['picked', 'pickup', 'picked_up', 'received'].includes(normalized)) return 'received_at_ocl';
  return 'booked';
};

const toISO = (value) => {
  if (!value) {
    return null;
  }
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
};

const formatLocationLabel = (city = '', state = '') => {
  const trimmedCity = (city || '').trim();
  const trimmedState = (state || '').trim();
  if (trimmedCity && trimmedState) {
    return `${trimmedCity}, ${trimmedState}`;
  }
  return trimmedCity || trimmedState || '';
};

const getLatestEntry = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value[value.length - 1];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return null;
};

const collectImages = (collection, extractor) => {
  const images = [];
  if (!Array.isArray(collection)) {
    return images;
  }
  collection.forEach((item) => {
    const url = extractor(item);
    if (url) {
      images.push(url);
    }
  });
  return images;
};

const buildCorporateTrackingSummary = (booking, tracking) => {
  const shipmentData = booking?.bookingData?.shipmentData || {};
  const invoiceData = booking?.bookingData?.invoiceData || {};
  const paymentData = booking?.bookingData?.paymentData || {};

  const origin = booking?.bookingData?.originData || {};
  const destination = booking?.bookingData?.destinationData || {};
  const originLabel = formatLocationLabel(origin.city, origin.state) || origin.city || 'Origin';
  const destinationLabel = formatLocationLabel(destination.city, destination.state) || destination.city || 'Destination';
  const routeSummary = `${originLabel} → ${destinationLabel}`.trim();

  const packageCount = shipmentData.packagesCount || shipmentData.totalPackages || null;
  const packageWeight = shipmentData.actualWeight || shipmentData.chargeableWeight || invoiceData.chargeableWeight || null;
  const paymentModeRaw = paymentData.paymentType || booking.paymentType || booking.paymentStatus;
  const paymentLabel = paymentModeRaw && paymentModeRaw.toUpperCase() === 'TP'
    ? 'To Pay (COD)'
    : 'Prepaid (Corporate Credit)';

  const bookingTimestamp = booking?.bookingData?.bookingDate || booking?.usedAt;
  const pickupEvent = getLatestEntry(tracking?.pickup);
  const receivedEvent = getLatestEntry(tracking?.received);
  const reachedHubEvent = getLatestEntry(tracking?.reachedHub);
  const ofdEvent = getLatestEntry(tracking?.OFD);
  const courierAssignment = getLatestEntry(tracking?.courierboy);
  const deliveredEvent = tracking?.delivered || null;

  const rawStatusHistory = Array.isArray(tracking?.statusHistory) ? tracking.statusHistory : [];
  const rawHistory = Array.isArray(tracking?.history)
    ? tracking.history.map((entry) => ({
        status: entry.status,
        timestamp: entry.timestamp || entry?.meta?.timestamp,
        notes: entry.notes,
        meta: entry.meta || {}
      }))
    : [];

  const combinedHistory = [...rawStatusHistory, ...rawHistory]
    .filter((entry) => entry && entry.status)
    .map((entry) => ({
      status: entry.status.toLowerCase(),
      timestamp: entry.timestamp ? toISO(entry.timestamp) : null,
      notes: entry.notes || '',
      meta: entry.meta || {}
    }))
    .sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

  const getTimestampForStatus = (...statuses) => {
    for (const status of statuses) {
      const match = combinedHistory.find((entry) => entry.status === status);
      if (match?.timestamp) {
        return match.timestamp;
      }
    }
    return null;
  };

  const receivedTimestamp = toISO(receivedEvent?.scannedAt)
    || toISO(pickupEvent?.pickedUpAt)
    || getTimestampForStatus('received', 'pickup', 'picked');

  const inTransitTimestamp = getTimestampForStatus('in_transit', 'intransit', 'assigned', 'reached-hub', 'reachedhub', 'assigned_completed');
  const ofdTimestamp = toISO(ofdEvent?.assignedAt) || getTimestampForStatus('ofp', 'out_for_delivery');
  const deliveredTimestamp = toISO(deliveredEvent?.deliveredAt);

  const packageImages = collectImages(shipmentData?.packageImages, (img) => img?.url);
  const deliveryProofImages = new Set();
  collectImages(tracking?.courierboy, (entry) => entry?.deliveryProofImages).forEach((item) => {
    if (Array.isArray(item)) {
      item.forEach((url) => url && deliveryProofImages.add(url));
    }
  });
  const inTransitProofs = Array.isArray(tracking?.intransit?.proofImages)
    ? tracking.intransit.proofImages
    : tracking?.intransit?.proofImages ? [tracking.intransit.proofImages] : [];
  inTransitProofs.forEach((url) => url && deliveryProofImages.add(url));

  const ofdDeliveryProofs = Array.isArray(tracking?.delivered?.deliveryProofImages)
    ? tracking.delivered.deliveryProofImages
    : tracking?.delivered?.deliveryProofImages ? [tracking.delivered.deliveryProofImages] : [];
  ofdDeliveryProofs.forEach((url) => url && deliveryProofImages.add(url));

  const movementHistory = [];
  const statusMap = new Map(); // Track which statuses we've already added (by canonical status)
  
  // Map status aliases to canonical statuses for deduplication
  const statusAliasMap = {
    'picked': 'pickup',
    'intransit': 'in_transit',
    'ofp': 'out_for_delivery',
    'reachedhub': 'reached-hub',
    'assigned_completed': 'reached-hub' // Treat transit leg completed as same as reached hub
  };
  
  const getCanonicalStatus = (status) => {
    const normalized = status.toLowerCase();
    return statusAliasMap[normalized] || normalized;
  };
  
  const pushMovementEvent = (status, label, timestamp, location = null, description = null) => {
    if (!timestamp) return; // Skip events without timestamps
    
    // Get canonical status for deduplication
    const canonicalStatus = getCanonicalStatus(status);
    
    // Check if we already have this canonical status
    const existing = statusMap.get(canonicalStatus);
    if (existing) {
      const existingTime = new Date(existing.timestamp).getTime();
      const newTime = new Date(timestamp).getTime();
      const timeDiff = Math.abs(existingTime - newTime);
      
      // If timestamps are very close (within 2 minutes), prefer the more detailed label
      if (timeDiff < 120000 && label.length > existing.label.length) {
        // Replace with more detailed version
        const index = movementHistory.findIndex(e => 
          getCanonicalStatus(e.status) === canonicalStatus && e.timestamp === existing.timestamp
        );
        if (index !== -1) {
          movementHistory[index] = { status, label, timestamp, location, description };
          statusMap.set(canonicalStatus, { status, label, timestamp });
        }
      }
      return; // Skip duplicate
    }
    
    // Add new event
    movementHistory.push({
      status,
      label,
      timestamp,
      location,
      description
    });
    statusMap.set(canonicalStatus, { status, label, timestamp });
  };

  // First, add direct events (these are more detailed and preferred)
  if (bookingTimestamp) {
    pushMovementEvent('booked', 'Shipment booked', toISO(bookingTimestamp), originLabel);
  }
  if (pickupEvent?.pickedUpAt) {
    pushMovementEvent('pickup', `Picked by ${pickupEvent?.courierName || 'assigned courier'}`, toISO(pickupEvent.pickedUpAt), originLabel);
  }
  if (receivedTimestamp) {
    pushMovementEvent('received', 'Received at OCL hub', receivedTimestamp, originLabel);
  }
  
  // Handle transit-related statuses - prefer specific events
  if (courierAssignment?.assignedAt) {
    pushMovementEvent('courierboy', 'Courier assigned', toISO(courierAssignment.assignedAt), originLabel);
  }
  
  // Check for in_transit status (but not 'assigned' which is separate)
  const inTransitEntry = combinedHistory.find(e => 
    ['in_transit', 'intransit'].includes(e.status) && e.timestamp && !statusMap.has('in_transit')
  );
  if (inTransitEntry) {
    pushMovementEvent('in_transit', 'In transit', inTransitEntry.timestamp, null);
  }
  
  if (reachedHubEvent?.timestamp) {
    pushMovementEvent('reached-hub', 'Reached hub', toISO(reachedHubEvent.timestamp), destinationLabel);
  }
  
  if (ofdTimestamp) {
    pushMovementEvent('out_for_delivery', 'Out for delivery', ofdTimestamp, destinationLabel);
  }
  if (deliveredTimestamp) {
    pushMovementEvent('delivered', 'Delivered', deliveredTimestamp, destinationLabel);
  }

  // Then add from combinedHistory only for statuses we haven't seen yet
  combinedHistory.forEach((entry) => {
    if (!entry.timestamp) return;
    
    const canonicalStatus = getCanonicalStatus(entry.status);
    
    // Skip if we already have this canonical status
    if (statusMap.has(canonicalStatus)) {
      return;
    }
    
    const labelMap = {
      booked: 'Shipment booked',
      pickup: 'Picked by courier',
      received: 'Received at OCL hub',
      assigned: 'Assigned for transit',
      'reached-hub': 'Reached hub',
      'assigned_completed': 'Transit leg completed',
      courierboy: 'Courier assigned',
      in_transit: 'In transit',
      'out_for_delivery': 'Out for delivery',
      delivered: 'Delivered'
    };
    const label = labelMap[canonicalStatus];
    if (label) {
      pushMovementEvent(canonicalStatus, label, entry.timestamp, 
        entry.status.includes('delivered') || entry.status.includes('reached') ? destinationLabel : originLabel, 
        entry.notes || null);
    }
  });

  const baseSteps = CUSTOMER_TRACKING_STEPS.map((definition) => ({
    key: definition.key,
    title: definition.title,
    completed: false,
    timestamp: null,
    description: null,
    fields: []
  }));
  const stepsByKey = baseSteps.reduce((acc, step) => {
    acc[step.key] = step;
    return acc;
  }, {});

  stepsByKey.booked.timestamp = toISO(bookingTimestamp);
  stepsByKey.booked.completed = true;
  stepsByKey.booked.description = 'Shipment created and awaiting handover.';
  stepsByKey.booked.fields = [
    bookingTimestamp ? { label: 'Booking Date & Time', value: toISO(bookingTimestamp), format: 'datetime' } : null,
    booking.consignmentNumber ? { label: 'Consignment Number', value: booking.consignmentNumber.toString() } : null,
    booking.bookingReference ? { label: 'Booking Reference', value: booking.bookingReference } : null,
    routeSummary ? { label: 'Route', value: routeSummary } : null,
    shipmentData?.services ? { label: 'Service Type', value: shipmentData.services } : null,
    packageCount ? { label: 'Package Count', value: packageCount.toString() } : null,
    packageWeight ? { label: 'Weight', value: `${packageWeight} kg` } : null,
    paymentLabel ? { label: 'Payment Method', value: paymentLabel } : null,
    shipmentData?.mode ? { label: 'Transit Mode', value: shipmentData.mode } : null
  ].filter(Boolean);

  stepsByKey.received_at_ocl.timestamp = receivedTimestamp;
  stepsByKey.received_at_ocl.description = receivedTimestamp
    ? 'Shipment verified at OCL.'
    : 'Awaiting receipt at OCL.';
  stepsByKey.received_at_ocl.fields = [
    receivedTimestamp ? { label: 'Received Time', value: receivedTimestamp, format: 'datetime' } : null,
    pickupEvent?.courierName ? { label: 'Received / Picked By', value: pickupEvent.courierName } : null,
    courierAssignment?.courierBoyName ? { label: 'Courier Assigned', value: courierAssignment.courierBoyName } : null,
    { label: 'Current Location', value: originLabel ? `OCL ${originLabel} Hub` : 'OCL Hub' },
    { label: 'Scan Status', value: receivedTimestamp ? 'Shipment verified & processed' : 'Pending scan' },
    shipmentData?.specialInstructions ? { label: 'Special Instructions', value: shipmentData.specialInstructions } : null
  ].filter(Boolean);

  stepsByKey.in_transit.timestamp = inTransitTimestamp;
  stepsByKey.in_transit.description = inTransitTimestamp
    ? 'Shipment is moving between hubs.'
    : 'Preparing for line haul.';
  stepsByKey.in_transit.fields = [
    reachedHubEvent ? { label: 'Last Hub Update', value: toISO(reachedHubEvent.timestamp), format: 'datetime' } : null,
    reachedHubEvent ? { label: 'Processed By', value: reachedHubEvent.adminName || 'OCL Operations' } : null,
    destinationLabel ? { label: 'Next Hub', value: destinationLabel } : null,
    { label: 'Movement Updates', value: movementHistory.length ? `${movementHistory.length} recorded events` : 'No updates yet' }
  ].filter(Boolean);

  const ofdAgentName = ofdEvent?.courierBoyName || courierAssignment?.courierBoyName;
  const ofdAgentPhone = ofdEvent?.courierBoyPhone || courierAssignment?.courierBoyPhone;
  stepsByKey.out_for_delivery.timestamp = ofdTimestamp;
  stepsByKey.out_for_delivery.description = ofdTimestamp
    ? 'Your shipment is out for delivery today.'
    : 'Awaiting delivery assignment.';
  stepsByKey.out_for_delivery.fields = [
    ofdTimestamp ? { label: 'Dispatch Time', value: ofdTimestamp, format: 'datetime' } : null,
    ofdAgentName ? { label: 'Delivery Agent', value: ofdAgentName } : null,
    ofdAgentPhone ? { label: 'Agent Phone', value: ofdAgentPhone } : null,
    destinationLabel ? { label: 'Delivery City', value: destinationLabel } : null,
    (invoiceData?.finalPrice || shipmentData?.declaredValue) ? {
      label: 'Payment to Collect',
      value: paymentLabel.includes('COD')
        ? `₹${invoiceData?.finalPrice || shipmentData?.declaredValue}`
        : 'No payment due'
    } : null
  ].filter(Boolean);

  stepsByKey.delivered.timestamp = deliveredTimestamp;
  stepsByKey.delivered.description = deliveredTimestamp
    ? 'Shipment delivered successfully.'
    : 'Awaiting delivery confirmation.';
  const deliveredHistoryMeta = combinedHistory.find((entry) => entry.status === 'delivered')?.meta || {};
  stepsByKey.delivered.fields = [
    deliveredTimestamp ? { label: 'Delivered At', value: deliveredTimestamp, format: 'datetime' } : null,
    deliveredHistoryMeta?.receivedBy
      ? { label: 'Received By', value: deliveredHistoryMeta.receivedBy }
      : { label: 'Received By', value: destination?.name || destination?.companyName || 'Recipient' },
    deliveredEvent?.amountCollected
      ? { label: 'Payment Collected', value: `₹${deliveredEvent.amountCollected}` }
      : null,
    deliveredHistoryMeta?.paymentMethod
      ? { label: 'Payment Method', value: deliveredHistoryMeta.paymentMethod }
      : paymentLabel
        ? { label: 'Payment Status', value: paymentLabel }
        : null
  ].filter(Boolean);

  const rawStatusForStep = tracking?.currentStatus || booking?.status || 'booked';
  let currentStepKey = deriveStepKeyFromStatus(rawStatusForStep);
  if (deliveredTimestamp) {
    currentStepKey = 'delivered';
  } else if (ofdTimestamp) {
    currentStepKey = 'out_for_delivery';
  } else if (inTransitTimestamp) {
    currentStepKey = 'in_transit';
  } else if (receivedTimestamp) {
    currentStepKey = 'received_at_ocl';
  }

  const currentStepOrder = TRACKING_STEP_ORDER[currentStepKey] ?? 0;
  baseSteps.forEach((step) => {
    if (step.key === 'booked') {
      step.completed = true;
      return;
    }
    const stepOrder = TRACKING_STEP_ORDER[step.key];
    step.completed = stepOrder <= currentStepOrder && Boolean(step.timestamp);
  });

  const estimatedDelivery = deliveredTimestamp
    || shipmentData?.estimatedDeliveryDate
    || invoiceData?.estimatedDeliveryDate
    || null;

  const lastUpdated = tracking?.updatedAt
    ? toISO(tracking.updatedAt)
    : combinedHistory.length
      ? combinedHistory[combinedHistory.length - 1].timestamp
      : toISO(booking.usedAt);

  return {
    metadata: {
      consignmentNumber: booking?.consignmentNumber?.toString() || '',
      bookingReference: booking?.bookingReference || '',
      serviceType: shipmentData?.services || invoiceData?.serviceType || '',
      packageCount,
      totalWeight: packageWeight,
      paymentMethod: paymentLabel,
      routeSummary,
      bookingDate: toISO(bookingTimestamp),
      statusLabel: STEP_TITLE_MAP[currentStepKey] || 'Booked',
      currentStepKey,
      estimatedDelivery: toISO(estimatedDelivery),
      lastUpdated
    },
    steps: baseSteps,
    movementHistory: movementHistory
      .filter((event, index, self) => {
        // Remove duplicates by canonical status and timestamp (within 2 minutes)
        const canonicalStatus = getCanonicalStatus(event.status);
        return index === self.findIndex((item) => {
          const itemCanonical = getCanonicalStatus(item.status);
          if (itemCanonical !== canonicalStatus) return false;
          
          if (!item.timestamp || !event.timestamp) {
            return item.timestamp === event.timestamp;
          }
          
          const timeDiff = Math.abs(new Date(item.timestamp).getTime() - new Date(event.timestamp).getTime());
          return timeDiff < 120000; // Within 2 minutes = same event
        });
      })
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(a.timestamp) - new Date(b.timestamp);
      }),
    attachments: {
      packageImages,
      deliveryProofImages: Array.from(deliveryProofImages)
    }
  };
};

// Corporate login route
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Corporate login attempt: ${username}`);
    
    // Find corporate by username (which is email or phone)
    const corporate = await CorporateData.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
        { contactNumber: username.replace(/\D/g, '') }
      ]
    });
    
    if (!corporate) {
      return res.status(401).json({ 
        error: 'Invalid username or password.' 
      });
    }
    
    if (!corporate.isActive) {
      return res.status(401).json({ 
        error: 'Corporate account is deactivated.' 
      });
    }
    
    // Check password
    const isPasswordValid = await corporate.verifyPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password.' 
      });
    }
    
    // Update last login
    corporate.lastLogin = new Date();
    await corporate.save();
    
    // Generate JWT token
    const token = generateToken(corporate._id, 'corporate');
    
    console.log(`✅ Corporate login successful: ${corporate.companyName} (${corporate.corporateId})`);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      corporate: {
        id: corporate._id,
        corporateId: corporate.corporateId,
        companyName: corporate.companyName,
        email: corporate.email,
        contactNumber: corporate.contactNumber,
        username: corporate.username,
        lastLogin: corporate.lastLogin,
        isFirstLogin: corporate.isFirstLogin || false,
        logo: corporate.logo
      }
    });
    
  } catch (error) {
    console.error('Corporate login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

// Get current corporate profile
router.get('/profile', authenticateCorporate, async (req, res) => {
  try {
    res.json({
      success: true,
      corporate: {
        id: req.corporate._id,
        corporateId: req.corporate.corporateId,
        companyName: req.corporate.companyName,
        concernName: req.corporate.concernName || '',
        email: req.corporate.email,
        contactNumber: req.corporate.contactNumber,
        companyAddress: req.corporate.companyAddress,
        flatNumber: req.corporate.flatNumber,
        landmark: req.corporate.landmark,
        city: req.corporate.city,
        state: req.corporate.state,
        pin: req.corporate.pin,
        locality: req.corporate.locality,
        gstNumber: req.corporate.gstNumber,
        logo: req.corporate.logo,
        registrationDate: req.corporate.registrationDate,
        lastLogin: req.corporate.lastLogin,
        isActive: req.corporate.isActive
      }
    });
  } catch (error) {
    console.error('Get corporate profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get profile information.' 
    });
  }
});

// Change password (first time or regular change)
router.post('/change-password', authenticateCorporate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long.'
      });
    }
    
    // For first-time login, currentPassword might be the generated password
    // For regular password changes, verify current password
    if (!req.corporate.isFirstLogin) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Current password is required.'
        });
      }
      
      const isCurrentPasswordValid = await req.corporate.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Current password is incorrect.'
        });
      }
    }
    
    // Update password
    req.corporate.password = newPassword;
    req.corporate.isFirstLogin = false; // Mark as no longer first login
    await req.corporate.save();
    
    console.log(`✅ Password changed for corporate: ${req.corporate.companyName} (${req.corporate.corporateId})`);
    
    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password.' 
    });
  }
});

// Get corporate dashboard stats
router.get('/dashboard-stats', authenticateCorporate, async (req, res) => {
  try {
    // Get basic corporate information
    const corporate = req.corporate;
    
    // Import ConsignmentUsage model
    const { ConsignmentUsage } = await import('../models/ConsignmentAssignment.js');
    
    // Get current date for monthly calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get all shipments for this corporate
    const allShipments = await ConsignmentUsage.find({
      corporateId: corporate._id
    }).lean();
    
    // Get monthly shipments
    const monthlyShipments = await ConsignmentUsage.find({
      corporateId: corporate._id,
      usedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).lean();
    
    // Calculate summary statistics
    const totalShipments = allShipments.length;
    const pendingShipments = allShipments.filter(s => s.status === 'active').length;
    const completedShipments = allShipments.filter(s => s.status === 'completed').length;
    const totalSpent = allShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    // Calculate TP metrics
    const tpPaidShipments = allShipments.filter(s => 
      s.paymentType === 'TP' && s.paymentStatus === 'paid'
    ).length;
    
    const fpUnpaidShipments = allShipments.filter(s => 
      s.paymentType === 'FP' && s.paymentStatus === 'unpaid' && s.status === 'active'
    ).length;
    
    const tpUnpaidShipments = allShipments.filter(s => 
      s.paymentType === 'TP' && s.paymentStatus === 'unpaid' && s.status === 'active'
    ).length;
    
    // Calculate monthly statistics
    const monthlyShipmentCount = monthlyShipments.length;
    const monthlySpend = monthlyShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const deliveryRate = totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : 0;
    
    // Get recent shipments (last 5)
    const recentShipments = allShipments
      .sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
      .slice(0, 5)
      .map(shipment => ({
        id: shipment._id.toString(),
        consignmentNumber: shipment.consignmentNumber.toString(),
        destination: `${shipment.bookingData?.destinationData?.city || 'Unknown'}, ${shipment.bookingData?.destinationData?.state || 'Unknown'}`,
        status: shipment.status === 'active' ? 'In Transit' : shipment.status === 'completed' ? 'Delivered' : 'Pending',
        date: new Date(shipment.usedAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
      }));
    
    const stats = {
      corporate: {
        id: corporate._id,
        corporateId: corporate.corporateId,
        companyName: corporate.companyName,
        email: corporate.email,
        contactNumber: corporate.contactNumber,
        registrationDate: corporate.registrationDate,
        lastLogin: corporate.lastLogin,
        isActive: corporate.isActive,
        billingType: corporate.billingType || 'Standard',
        manager: corporate.manager || 'Not Assigned',
        billingCycle: corporate.billingCycle || 'Monthly',
        companyAddress: corporate.companyAddress,
        city: corporate.city,
        state: corporate.state,
        pin: corporate.pin,
        locality: corporate.locality,
        gstNumber: corporate.gstNumber,
        logo: corporate.logo
      },
      summary: {
        totalShipments,
        pendingShipments,
        completedShipments,
        totalSpent
      },
      monthly: {
        shipments: monthlyShipmentCount,
        spend: monthlySpend,
        deliveryRate
      },
      recentShipments,
      complaints: {
        active: 0, // Placeholder - can be implemented later
        resolved: 0 // Placeholder - can be implemented later
      },
      tpMetrics: {
        tpPaidShipments,
        fpUnpaidShipments,
        tpUnpaidShipments
      }
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get corporate dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard statistics.' 
    });
  }
});

// Update corporate profile
router.put('/profile', authenticateCorporate, async (req, res) => {
  try {
    const allowedUpdates = ['contactNumber', 'email', 'companyAddress', 'flatNumber', 'landmark'];
    const updates = {};
    
    // Only allow certain fields to be updated
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update.'
      });
    }
    
    const updatedCorporate = await CorporateData.findByIdAndUpdate(
      req.corporate._id,
      updates,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Corporate profile updated: ${updatedCorporate.companyName} (${updatedCorporate.corporateId})`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      corporate: {
        id: updatedCorporate._id,
        corporateId: updatedCorporate.corporateId,
        companyName: updatedCorporate.companyName,
        email: updatedCorporate.email,
        contactNumber: updatedCorporate.contactNumber,
        companyAddress: updatedCorporate.companyAddress,
        flatNumber: updatedCorporate.flatNumber,
        landmark: updatedCorporate.landmark,
        logo: updatedCorporate.logo
      }
    });
    
  } catch (error) {
    console.error('Update corporate profile error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }
});

// Upload corporate logo
router.post('/upload-logo', authenticateCorporate, uploadCorporateLogo, handleCorporateLogoUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No logo file uploaded'
      });
    }
    
    // Upload logo to S3
    const uploadResult = await S3Service.uploadFile(req.file, 'uploads/corporate-logos');
    
    if (!uploadResult.success) {
      return res.status(500).json({
        error: 'Failed to upload logo to S3'
      });
    }
    
    // Update corporate record with S3 URL
    const updatedCorporate = await CorporateData.findByIdAndUpdate(
      req.corporate._id,
      { logo: uploadResult.url },
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Corporate logo uploaded to S3: ${updatedCorporate.companyName} (${updatedCorporate.corporateId})`);
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo: uploadResult.url,
      corporate: {
        id: updatedCorporate._id,
        corporateId: updatedCorporate.corporateId,
        companyName: updatedCorporate.companyName,
        logo: updatedCorporate.logo
      }
    });
    
  } catch (error) {
    console.error('Upload corporate logo error:', error);
    res.status(500).json({ 
      error: 'Failed to upload logo' 
    });
  }
});

// Get corporate pricing assigned to this corporate client
router.get('/pricing', authenticateCorporate, async (req, res) => {
  try {
    const CorporatePricing = (await import('../models/CorporatePricing.js')).default;
    
    // Find the pricing plan assigned to this corporate client
    const pricing = await CorporatePricing.findOne({ 
      corporateClient: req.corporate._id,
      status: 'approved' // Only return approved pricing
    }).select('-__v -createdBy -approvedBy -rejectionReason -clientEmail -clientName -clientCompany -approvalToken -emailSentAt -emailApprovedAt -emailApprovedBy -emailRejectedAt -emailRejectionReason -notes');
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'No pricing plan has been assigned to your corporate account yet.'
      });
    }
    
    console.log(`✅ Corporate pricing retrieved for: ${req.corporate.companyName} (${req.corporate.corporateId})`);
    
    res.json({
      success: true,
      pricing
    });
    
  } catch (error) {
    console.error('Get corporate pricing error:', error);
    res.status(500).json({ 
      error: 'Failed to get pricing information.' 
    });
  }
});

// Calculate price based on corporate pricing
router.post('/calculate-price', authenticateCorporate, async (req, res) => {
  try {
    const { fromPincode, toPincode, weight, serviceType, deliveryType, transportMode } = req.body;
    
    // Validate required fields
    if (!fromPincode || !toPincode || !weight || !serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromPincode, toPincode, weight, serviceType'
      });
    }
    
    const CorporatePricing = (await import('../models/CorporatePricing.js')).default;
    
    // Find the pricing plan assigned to this corporate client
    const pricing = await CorporatePricing.findOne({ 
      corporateClient: req.corporate._id,
      status: 'approved'
    });
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'No approved pricing plan found for your corporate account.'
      });
    }
    
    // Helper functions for location classification
    const classifyLocation = (pincode) => {
      const pincodeNum = parseInt(pincode);
      
      // Assam pincodes (780xxx, 781xxx, 782xxx, 783xxx, 784xxx, 785xxx, 786xxx, 787xxx, 788xxx)
      if (pincodeNum >= 780000 && pincodeNum <= 788999) {
        return 'assam';
      }
      
      // North East pincodes (790xxx, 791xxx, 792xxx, 793xxx, 794xxx, 795xxx, 796xxx, 797xxx, 798xxx, 799xxx)
      if (pincodeNum >= 790000 && pincodeNum <= 799999) {
        return 'neBySurface';
      }
      
      // Rest of India
      return 'restOfIndia';
    };
    
    const isAssamPincode = (pincode) => {
      const pincodeNum = parseInt(pincode);
      return pincodeNum >= 780000 && pincodeNum <= 788999;
    };
    
    const isNorthEastPincode = (pincode) => {
      const pincodeNum = parseInt(pincode);
      return pincodeNum >= 790000 && pincodeNum <= 799999;
    };
    
    // Calculate price based on service type and conditions
    let price = 0;
    let location = '';
    let transportModeUsed = transportMode || 'byRoad';
    let chargeableWeight = parseFloat(weight);
    let isMinimumWeightApplied = false;
    let breakdown = {
      weightSlab: '',
      pricePerUnit: 0,
      units: 0,
      subtotal: 0
    };
    
    // Check if this is reverse pricing (from pincode provided and destination is Assam/North East)
    if (fromPincode && serviceType === 'non-dox') {
      // Reverse pricing logic
      const minChargeableWeights = {
        byRoad: 500,
        byTrain: 100,
        byFlight: 25
      };
      
      chargeableWeight = Math.max(parseFloat(weight), minChargeableWeights[transportModeUsed]);
      isMinimumWeightApplied = chargeableWeight > parseFloat(weight);

      if (isAssamPincode(toPincode)) {
        location = 'Assam';
        const pricePerKg = parseFloat(pricing.reversePricing.toAssam[transportModeUsed][deliveryType || 'normal']) || 0;
        price = pricePerKg * chargeableWeight;
        breakdown = {
          weightSlab: `${weight}kg (min: ${chargeableWeight}kg)`,
          pricePerUnit: pricePerKg,
          units: chargeableWeight,
          subtotal: price
        };
      } else if (isNorthEastPincode(toPincode)) {
        location = 'North East';
        const pricePerKg = parseFloat(pricing.reversePricing.toNorthEast[transportModeUsed][deliveryType || 'normal']) || 0;
        price = pricePerKg * chargeableWeight;
        breakdown = {
          weightSlab: `${weight}kg (min: ${chargeableWeight}kg)`,
          pricePerUnit: pricePerKg,
          units: chargeableWeight,
          subtotal: price
        };
      } else {
        return res.status(400).json({
          success: false,
          error: 'Reverse pricing is only available for Assam and North East destinations'
        });
      }
    } else {
      // Forward pricing logic
      const destinationLocation = classifyLocation(toPincode);
      location = destinationLocation;

      if (serviceType === 'dox') {
        // DOX pricing
        const weightNum = parseFloat(weight);
        
        if (weightNum <= 250) {
          const pricePerUnit = pricing.doxPricing['01gm-250gm'][destinationLocation] || 0;
          price = pricePerUnit;
          breakdown = {
            weightSlab: '0-250gm',
            pricePerUnit,
            units: weightNum,
            subtotal: pricePerUnit
          };
        } else if (weightNum <= 500) {
          const pricePerUnit = pricing.doxPricing['251gm-500gm'][destinationLocation] || 0;
          price = pricePerUnit;
          breakdown = {
            weightSlab: '251-500gm',
            pricePerUnit,
            units: weightNum,
            subtotal: pricePerUnit
          };
        } else {
          // For weights above 500gm, calculate base price + additional weight
          const basePrice = pricing.doxPricing['251gm-500gm'][destinationLocation] || 0;
          const additionalWeight = weightNum - 500;
          const additionalPrice = (pricing.doxPricing.add500gm[destinationLocation] || 0) * Math.ceil(additionalWeight / 500);
          
          breakdown = {
            weightSlab: `500gm + ${Math.ceil(additionalWeight / 500)} × 500gm`,
            pricePerUnit: pricing.doxPricing.add500gm[destinationLocation] || 0,
            units: Math.ceil(additionalWeight / 500),
            subtotal: basePrice + additionalPrice
          };
          price = basePrice + additionalPrice;
        }
      } else if (serviceType === 'non-dox') {
        // Non-DOX pricing
        const weightNum = parseFloat(weight);
        
        if (transportModeUsed === 'byRoad') {
          const pricePerKg = pricing.nonDoxSurfacePricing[destinationLocation] || 0;
          price = pricePerKg * weightNum;
          breakdown = {
            weightSlab: `${weight}kg`,
            pricePerUnit: pricePerKg,
            units: weightNum,
            subtotal: price
          };
        } else {
          const pricePerKg = pricing.nonDoxAirPricing[destinationLocation] || 0;
          price = pricePerKg * weightNum;
          breakdown = {
            weightSlab: `${weight}kg`,
            pricePerUnit: pricePerKg,
            units: weightNum,
            subtotal: price
          };
        }
      } else if (serviceType === 'priority') {
        // Priority pricing
        const weightNum = parseFloat(weight);
        
        if (weightNum <= 500) {
          const pricePerUnit = pricing.priorityPricing['01gm-500gm'][destinationLocation] || 0;
          price = pricePerUnit;
          breakdown = {
            weightSlab: '0-500gm',
            pricePerUnit,
            units: weightNum,
            subtotal: pricePerUnit
          };
        } else {
          const basePrice = pricing.priorityPricing['01gm-500gm'][destinationLocation] || 0;
          const additionalWeight = weightNum - 500;
          const additionalPrice = (pricing.priorityPricing.add500gm[destinationLocation] || 0) * Math.ceil(additionalWeight / 500);
          
          breakdown = {
            weightSlab: `500gm + ${Math.ceil(additionalWeight / 500)} × 500gm`,
            pricePerUnit: pricing.priorityPricing.add500gm[destinationLocation] || 0,
            units: Math.ceil(additionalWeight / 500),
            subtotal: basePrice + additionalPrice
          };
          price = basePrice + additionalPrice;
        }
      }
    }
    
    const gst = price * 0.18; // 18% GST
    const finalPrice = price + gst;
    
    const result = {
      basePrice: price,
      totalPrice: price,
      gst,
      finalPrice,
      serviceType,
      location,
      transportMode: transportModeUsed,
      chargeableWeight,
      isMinimumWeightApplied,
      breakdown
    };
    
    console.log(`✅ Price calculated for corporate: ${req.corporate.companyName} (${req.corporate.corporateId})`);
    
    res.json({
      success: true,
      calculation: result
    });
    
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate price. Please try again.' 
    });
  }
});

// Check if corporate has assigned consignment numbers
router.get('/consignment/check', authenticateCorporate, async (req, res) => {
  try {
    // Check if corporate has active consignment assignments
    const assignments = await ConsignmentAssignment.find({
      corporateId: req.corporate._id,
      isActive: true
    }).sort({ startNumber: 1 });
    
    if (!assignments || assignments.length === 0) {
      return res.json({
        success: false,
        hasAssignment: false,
        message: 'No consignment numbers assigned to your corporate account. Please contact admin to get consignment numbers assigned before making bookings.'
      });
    }
    
    // Get usage statistics across all assignments
    // Check both corporateId and entityId to support all records (old and new)
    const usedCount = await ConsignmentUsage.countDocuments({
      $or: [
        { corporateId: req.corporate._id },
        { assignmentType: 'corporate', entityId: req.corporate._id }
      ]
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
    console.error('Check consignment assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check consignment assignment status'
    });
  }
});

// Corporate booking endpoint
router.post('/bookings', authenticateCorporate, async (req, res) => {
  try {
    const { originData, destinationData, shipmentData, invoiceData, paymentData } = req.body;
    
    // Validate required fields
    if (!originData || !destinationData || !shipmentData || !invoiceData || !paymentData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking data'
      });
    }

    // Validate origin data required fields
    if (!originData.name || !originData.mobileNumber || !originData.email || !originData.pincode || !originData.locality || !originData.flatBuilding) {
      return res.status(400).json({
        success: false,
        error: 'Missing required origin fields: name, mobileNumber, email, pincode, locality, or flatBuilding'
      });
    }

    // Validate destination data required fields
    if (!destinationData.name || !destinationData.mobileNumber || !destinationData.email || !destinationData.pincode || !destinationData.locality || !destinationData.flatBuilding) {
      return res.status(400).json({
        success: false,
        error: 'Missing required destination fields: name, mobileNumber, email, pincode, locality, or flatBuilding'
      });
    }

    // Validate shipment data required fields
    if (!shipmentData.natureOfConsignment || !shipmentData.services) {
      return res.status(400).json({
        success: false,
        error: 'Missing required shipment fields: natureOfConsignment or services'
      });
    }

    // Mode is required only for Standard service, not for Priority
    if (shipmentData.services === 'Standard' && !shipmentData.mode) {
      return res.status(400).json({
        success: false,
        error: 'Mode is required when Standard service is selected'
      });
    }

    if (!shipmentData.packagesCount || !shipmentData.packageType || !shipmentData.declaredValue || !shipmentData.actualWeight) {
      return res.status(400).json({
        success: false,
        error: 'Missing required shipment fields: packagesCount, packageType, declaredValue, or actualWeight'
      });
    }

    if (shipmentData.packageType === 'Others' && !shipmentData.others) {
      return res.status(400).json({
        success: false,
        error: 'Please specify the package type when "Others" is selected'
      });
    }

    // Validate payment data
    if (!paymentData.paymentType || (paymentData.paymentType !== 'FP' && paymentData.paymentType !== 'TP')) {
      return res.status(400).json({
        success: false,
        error: 'Payment type is required and must be either FP or TP'
      });
    }
    
    // Check consignment availability first
    const assignments = await ConsignmentAssignment.find({
      corporateId: req.corporate._id,
      isActive: true
    });
    
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No consignment numbers assigned to your corporate account. Please contact admin.'
      });
    }

    // Check if any consignment numbers are available across all assignments
    // Use corporateId to match the check endpoint query (supports both old and new records)
    const usedCount = await ConsignmentUsage.countDocuments({
      $or: [
        { corporateId: req.corporate._id },
        { assignmentType: 'corporate', entityId: req.corporate._id }
      ]
    });
    
    const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.totalNumbers, 0);
    const availableCount = totalAssigned - usedCount;
    
    if (availableCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'All consignment numbers have been used. Please contact admin to get more consignment numbers assigned.'
      });
    }

    // Get next available consignment number for this corporate
    let consignmentNumber;
    try {
      consignmentNumber = await ConsignmentAssignment.getNextConsignmentNumber('corporate', req.corporate._id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'No consignment numbers assigned to your corporate account. Please contact admin.'
      });
    }
    
    // Prepare complete booking payload with all data
    const bookingPayload = {
      corporateId: req.corporate._id,
      corporateInfo: {
        corporateId: req.corporate.corporateId,
        companyName: req.corporate.companyName,
        email: req.corporate.email,
        contactNumber: req.corporate.contactNumber
      },
      originData: {
        useCurrentAddress: originData.useCurrentAddress || false,
        mobileNumber: originData.mobileNumber,
        name: originData.name,
        companyName: originData.companyName || '',
        email: originData.email,
        locality: originData.locality,
        flatBuilding: originData.flatBuilding,
        landmark: originData.landmark || '',
        pincode: originData.pincode,
        area: originData.area || '',
        city: originData.city || '',
        district: originData.district || '',
        state: originData.state || '',
        gstNumber: originData.gstNumber || '',
        alternateNumbers: originData.alternateNumbers || [],
        addressType: originData.addressType || 'Corporate',
        birthday: originData.birthday || '',
        anniversary: originData.anniversary || '',
        otherAlternateNumber: originData.otherAlternateNumber || '',
        showOtherAlternateNumber: originData.showOtherAlternateNumber || false,
        website: originData.website || ''
      },
      destinationData: {
        mobileNumber: destinationData.mobileNumber,
        name: destinationData.name,
        companyName: destinationData.companyName || '',
        email: destinationData.email,
        locality: destinationData.locality,
        flatBuilding: destinationData.flatBuilding,
        landmark: destinationData.landmark || '',
        pincode: destinationData.pincode,
        area: destinationData.area || '',
        city: destinationData.city || '',
        district: destinationData.district || '',
        state: destinationData.state || '',
        gstNumber: destinationData.gstNumber || '',
        alternateNumbers: destinationData.alternateNumbers || [],
        addressType: destinationData.addressType || 'Home',
        website: destinationData.website || '',
        anniversary: destinationData.anniversary || '',
        birthday: destinationData.birthday || ''
      },
      shipmentData: {
        natureOfConsignment: shipmentData.natureOfConsignment,
        services: shipmentData.services,
        mode: shipmentData.mode || '', // Can be empty for Priority service
        insurance: shipmentData.insurance || 'Without insurance',
        riskCoverage: shipmentData.riskCoverage || 'Owner',
        packagesCount: shipmentData.packagesCount,
        packageType: shipmentData.packageType,
        others: shipmentData.others || '',
        contentDescription: shipmentData.contentDescription || '',
        declaredValue: shipmentData.declaredValue,
        dimensions: shipmentData.dimensions || [],
        actualWeight: shipmentData.actualWeight,
        volumetricWeight: shipmentData.volumetricWeight || 0,
        chargeableWeight: shipmentData.chargeableWeight || 0,
        totalPackages: shipmentData.totalPackages || shipmentData.packagesCount,
        materials: shipmentData.materials || '',
        packageImages: shipmentData.packageImages || [],
        uploadedFiles: shipmentData.uploadedFiles || [],
        description: shipmentData.description || '',
        specialInstructions: shipmentData.specialInstructions || ''
      },
      invoiceData: {
        billingAddress: invoiceData.billingAddress || '',
        paymentMethod: invoiceData.paymentMethod || 'Corporate Credit',
        terms: invoiceData.terms || '',
        calculatedPrice: invoiceData.calculatedPrice || 0,
        gst: invoiceData.gst || 0,
        finalPrice: invoiceData.finalPrice || 0,
        serviceType: invoiceData.serviceType || shipmentData.natureOfConsignment,
        location: invoiceData.location || '',
        transportMode: invoiceData.transportMode || shipmentData.mode || '',
        chargeableWeight: invoiceData.chargeableWeight || 0
      },
      paymentData: {
        paymentType: paymentData.paymentType // FP or TP
      },
      consignmentNumber: consignmentNumber,
      bookingReference: consignmentNumber.toString(),
      bookingDate: new Date(),
      status: 'booked',
      paymentStatus: 'unpaid'
    };
    
    // Record consignment usage
    const usage = new ConsignmentUsage({
      assignmentType: 'corporate',
      entityId: req.corporate._id,
      corporateId: req.corporate._id,
      consignmentNumber: consignmentNumber,
      bookingReference: consignmentNumber.toString(),
      bookingData: bookingPayload,
      freightCharges: invoiceData.calculatedPrice || 0,
      totalAmount: invoiceData.finalPrice || 0,
      paymentType: paymentData.paymentType, // FP or TP
      paymentStatus: 'unpaid',
      status: 'active'
    });
    
    await usage.save();
    
    // Create tracking record
    const tracking = new Tracking({
      consignmentNumber: consignmentNumber,
      bookingReference: consignmentNumber.toString(),
      assignmentType: 'corporate',
      entityId: req.corporate._id,
      corporateId: req.corporate._id,
      currentStatus: 'booked',
      booked: [bookingPayload], // Store booking data in booked array
      statusHistory: [{
        status: 'booked',
        timestamp: new Date(),
        notes: 'Booking created'
      }]
    });
    
    await tracking.save();
    
    console.log(`✅ Corporate booking created: ${req.corporate.companyName} - Consignment: ${consignmentNumber}`);
    console.log(`📦 Booking saved to database with ID: ${usage._id}`);
    console.log(`📊 Corporate ID: ${req.corporate._id}, Entity ID: ${req.corporate._id}`);
    console.log(`📍 Tracking record created with ID: ${tracking._id}`);

    // Send response immediately without waiting for email
    res.json({
      success: true,
      message: 'Booking created successfully',
      bookingReference: consignmentNumber.toString(),
      consignmentNumber: consignmentNumber,
      bookingData: bookingPayload,
      usageId: usage._id.toString()
    });

    // Send booking confirmation email asynchronously in the background (non-blocking)
    (async () => {
      try {
        const uploadedFiles = Array.isArray(shipmentData?.uploadedFiles) ? shipmentData.uploadedFiles : [];
        const packageImageUrls = uploadedFiles
          .filter(file => file?.url && (!file.mimetype || file.mimetype.startsWith('image/')))
          .map(file => file.url);

        await emailService.sendCorporateBookingConfirmationEmail({
          bookingReference: bookingPayload.bookingReference,
          consignmentNumber,
          bookingDate: bookingPayload.bookingDate,
          serviceType: bookingPayload.shipmentData?.services || bookingPayload.invoiceData?.serviceType || 'Standard',
          shippingMode: bookingPayload.shipmentData?.mode || bookingPayload.invoiceData?.transportMode || '',
          origin: bookingPayload.originData,
          destination: bookingPayload.destinationData,
          shipment: bookingPayload.shipmentData,
          invoice: bookingPayload.invoiceData,
          payment: bookingPayload.paymentData,
          corporateInfo: bookingPayload.corporateInfo,
          packageImages: packageImageUrls
        });
        console.log(`✅ Booking confirmation email sent for consignment: ${consignmentNumber}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send corporate booking confirmation email:', emailError);
      }
    })();
    
  } catch (error) {
    console.error('❌ Corporate booking error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      console.error('Validation errors:', validationErrors);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create booking',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
});

// Get corporate bookings
router.get('/bookings', authenticateCorporate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`📋 Fetching bookings for corporate ID: ${req.corporate._id}`);
    console.log(`📄 Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
    
    const bookings = await ConsignmentUsage.find({
      corporateId: req.corporate._id
    })
    .sort({ usedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    const totalCount = await ConsignmentUsage.countDocuments({
      corporateId: req.corporate._id
    });
    
    // Fetch currentStatus from Tracking table for each booking
    const consignmentNumbers = bookings.map(b => b.consignmentNumber).filter(Boolean);
    const trackingRecords = await Tracking.find({
      consignmentNumber: { $in: consignmentNumbers }
    })
    .select('consignmentNumber currentStatus')
    .lean();
    
    // Create a map of consignmentNumber -> currentStatus
    const statusMap = new Map();
    trackingRecords.forEach(tracking => {
      statusMap.set(tracking.consignmentNumber, tracking.currentStatus);
    });
    
    // Enrich bookings with currentStatus from Tracking table
    const enrichedBookings = bookings.map(booking => ({
      ...booking,
      currentStatus: statusMap.get(booking.consignmentNumber) || booking.status || 'booked'
    }));
    
    console.log(`✅ Found ${bookings.length} bookings (total: ${totalCount}) for corporate ${req.corporate.companyName}`);
    
    res.json({
      success: true,
      data: enrichedBookings,
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
    console.error('❌ Get corporate bookings error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get bookings',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Rich tracking details for a single consignment
router.get('/tracking/:identifier', authenticateCorporate, async (req, res) => {
  try {
    const { identifier } = req.params;
    const trimmedIdentifier = identifier?.trim();
    if (!trimmedIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'Tracking identifier is required'
      });
    }

    const numericMatch = /^\d+$/.test(trimmedIdentifier);
    const baseQuery = { corporateId: req.corporate._id };
    const bookingQuery = numericMatch
      ? { ...baseQuery, consignmentNumber: parseInt(trimmedIdentifier, 10) }
      : { ...baseQuery, bookingReference: trimmedIdentifier };

    const booking = await ConsignmentUsage.findOne(bookingQuery).lean();
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'No shipment found for this identifier'
      });
    }

    const tracking = await Tracking.findOne({
      consignmentNumber: booking.consignmentNumber
    }).lean();

    const trackingSummary = buildCorporateTrackingSummary(booking, tracking);

    res.json({
      success: true,
      data: {
        booking,
        trackingSummary
      }
    });
  } catch (error) {
    console.error('❌ Corporate tracking lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tracking information'
    });
  }
});

// Get previous destinations by phone number
router.get('/destinations/phone/:phone', authenticateCorporate, async (req, res) => {
  try {
    const phone = req.params.phone;
    
    // Clean the phone number (remove any non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log(`🔍 Searching for destinations with phone: ${cleanPhone} for corporate: ${req.corporate._id}`);
    
    // Find all bookings for this corporate that have matching destination phone numbers
    const bookings = await ConsignmentUsage.find({
      corporateId: req.corporate._id,
      'bookingData.destinationData.mobileNumber': { $regex: cleanPhone, $options: 'i' }
    })
    .sort({ usedAt: -1 })
    .lean();
    
    console.log(`📞 Found ${bookings.length} bookings with matching destination phone`);
    
    // Extract and transform destination data
    const destinations = bookings.map(booking => {
      const destData = booking.bookingData.destinationData;
      return {
        id: booking._id,
        bookingReference: booking.bookingReference,
        consignmentNumber: booking.consignmentNumber,
        usedAt: booking.usedAt,
        name: destData.name || '',
        companyName: destData.companyName || '',
        email: destData.email || '',
        mobileNumber: destData.mobileNumber || '',
        locality: destData.locality || '',
        flatBuilding: destData.flatBuilding || '',
        landmark: destData.landmark || '',
        pincode: destData.pincode || '',
        area: destData.area || '',
        city: destData.city || '',
        district: destData.district || '',
        state: destData.state || '',
        gstNumber: destData.gstNumber || '',
        addressType: destData.addressType || 'Office'
      };
    });
    
    // Remove duplicates based on phone number, name, and address
    const uniqueDestinations = destinations.filter((dest, index, self) => 
      index === self.findIndex(d => 
        d.mobileNumber === dest.mobileNumber && 
        d.name === dest.name && 
        d.flatBuilding === dest.flatBuilding &&
        d.pincode === dest.pincode
      )
    );
    
    console.log(`✅ Returning ${uniqueDestinations.length} unique destinations`);
    
    res.json({
      success: true,
      data: uniqueDestinations,
      count: uniqueDestinations.length
    });
    
  } catch (error) {
    console.error('Get destinations by phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get destinations by phone number'
    });
  }
});

// Request a courier
router.post('/request-courier', authenticateCorporate, async (req, res) => {
  try {
    const {
      pickupAddress,
      urgency,
      specialInstructions,
      packageCount,
      weight
    } = req.body;

    // Get contact person and phone from corporate data
    const contactPerson = req.corporate.companyName;
    const contactPhone = req.corporate.contactNumber;

    // Validate required fields
    if (weight === undefined || weight === null || weight === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: weight'
      });
    }

    const numericWeight = Number(weight);
    if (Number.isNaN(numericWeight) || numericWeight <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid weight. It must be a positive number.'
      });
    }

    // Create courier request record in database
    const requestData = {
      ...(pickupAddress ? { pickupAddress: pickupAddress.trim() } : {}),
      contactPerson,
      contactPhone,
      urgency: urgency || 'normal',
      specialInstructions: specialInstructions || '',
      packageCount: packageCount || 1,
      weight: numericWeight
    };

    const courierRequest = new CourierRequest({
      corporateId: req.corporate._id,
      corporateInfo: {
        corporateId: req.corporate.corporateId,
        companyName: req.corporate.companyName,
        email: req.corporate.email,
        contactNumber: req.corporate.contactNumber
      },
      requestData: requestData,
      status: 'pending',
      estimatedResponseTime: '10-15 minutes'
    });

    await courierRequest.save();

    // Generate request ID for frontend compatibility
    const requestId = `CR-${courierRequest._id}`;

    // Log the courier request for admin notification
    console.log('🚚 NEW COURIER REQUEST:', {
      timestamp: new Date().toISOString(),
      corporate: req.corporate.companyName,
      corporateId: req.corporate.corporateId,
      requestId: requestId,
      dbId: courierRequest._id
    });

    // TODO: Send notification to admin/operations team
    // This could be:
    // - Email notification
    // - SMS to operations team
    // - Push notification to admin dashboard
    // - Integration with courier management system

    res.json({
      success: true,
      message: 'Courier request submitted successfully',
      requestId: requestId,
      estimatedResponseTime: '10-15 minutes',
      data: {
        id: requestId,
        _id: courierRequest._id,
        ...courierRequest.toObject()
      }
    });

  } catch (error) {
    console.error('Courier request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit courier request'
    });
  }
});

// Get single booking by consignment number
router.get('/bookings/:consignmentNumber', authenticateCorporate, async (req, res) => {
  try {
    const { consignmentNumber } = req.params;
    
    const booking = await ConsignmentUsage.findOne({
      corporateId: req.corporate._id,
      consignmentNumber: parseInt(consignmentNumber)
    }).lean();
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking'
    });
  }
});

// Track consignment number (public endpoint)
router.get('/track/:consignmentNumber', async (req, res) => {
  try {
    const { consignmentNumber } = req.params;
    const numericConsignment = parseInt(consignmentNumber, 10);
    
    if (isNaN(numericConsignment)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consignment number'
      });
    }
    
    // Find the consignment usage record
    const usage = await ConsignmentUsage.findOne({
      consignmentNumber: numericConsignment
    }).populate('corporateId', 'corporateId companyName').lean();
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        error: 'Consignment number not found'
      });
    }
    
    // Find the tracking record
    const tracking = await Tracking.findOne({
      consignmentNumber: numericConsignment
    }).lean();
    
    // Build tracking summary using the same function as corporate tracking
    const trackingSummary = buildCorporateTrackingSummary(usage, tracking || {});
    
    // Return tracking information with full summary
    res.json({
      success: true,
      data: {
        consignmentNumber: usage.consignmentNumber,
        bookingReference: usage.bookingReference,
        bookingData: usage.bookingData,
        status: usage.status || tracking?.currentStatus || 'booked',
        usedAt: usage.usedAt,
        trackingSummary
      }
    });
    
  } catch (error) {
    console.error('Track consignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track consignment'
    });
  }
});

export default router;
