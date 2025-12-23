import express from 'express';
import Tracking from '../models/Tracking.js';
import MedicineBooking from '../models/MedicineBooking.js';
import MedicineManifest from '../models/MedicineManifest.js';
import CustomerBooking from '../models/CustomerBooking.js';

const router = express.Router();

const TRACKING_STEPS = [
  { key: 'booked', title: 'Booked' },
  { key: 'in_transit', title: 'In Transit' },
  { key: 'out_for_delivery', title: 'Out for Delivery' },
  { key: 'delivered', title: 'Delivered' }
];

// Medicine tracking steps
const MEDICINE_TRACKING_STEPS = [
  { key: 'booked', title: 'Booked' },
  { key: 'in_transit', title: 'In Transit' },
  { key: 'out_for_delivery', title: 'Out for Delivery' },
  { key: 'delivered', title: 'Delivered' }
];

const STEP_TITLE_MAP = TRACKING_STEPS.reduce((acc, step) => {
  acc[step.key] = step.title;
  return acc;
}, {});

const deriveStepKeyFromStatus = (status = '') => {
  const normalized = status?.toString().toLowerCase() || '';
  // Undelivered status -> treat as final step (same position as delivered)
  if (['undelivered'].includes(normalized)) return 'delivered';
  // Delivered status -> delivered step
  if (['delivered'].includes(normalized)) return 'delivered';
  // OFP status -> out for delivery step
  if (['ofp', 'out_for_delivery'].includes(normalized)) return 'out_for_delivery';
  // intransit status -> in_transit step
  if (['in_transit', 'intransit'].includes(normalized)) return 'in_transit';
  // reached-hub status -> stays in in_transit step
  if (['reached-hub', 'reachedhub'].includes(normalized)) return 'in_transit';
  // assigned and courierboy status -> booked step (before transit)
  if (['assigned', 'courierboy', 'assigned_completed'].includes(normalized)) return 'booked';
  // received status -> booked step (before transit)
  if (['received'].includes(normalized)) return 'booked';
  // pickup status -> stays in booked step
  if (['picked', 'pickup', 'picked_up'].includes(normalized)) return 'booked';
  // booked status or default -> booked step
  return 'booked';
};

const toISO = (value) => {
  if (!value) return null;
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

// Map medicine booking status to tracking step key
const deriveMedicineStepKeyFromStatus = (status = '') => {
  const normalized = status?.toString().toLowerCase() || '';
  // Delivered status -> delivered step
  if (['delivered'].includes(normalized)) return 'delivered';
  // Out for delivery status -> out for delivery step
  if (['out_for_delivery'].includes(normalized)) return 'out_for_delivery';
  // Arrived at Hub and Ready to Dispatch -> booked step (before transit)
  if (['arrived at hub', 'ready to dispatch'].includes(normalized)) return 'booked';
  // intransit and arrived status -> in_transit step
  if (['in_transit', 'intransit', 'arrived'].includes(normalized)) return 'in_transit';
  // Booked status or default -> booked step
  return 'booked';
};

// Map customer booking currentStatus to tracking step key
const deriveCustomerBookingStepKeyFromStatus = (status = '') => {
  const normalized = status?.toString().toLowerCase() || '';
  // Delivered status -> delivered step
  if (['delivered'].includes(normalized)) return 'delivered';
  // Out for delivery status -> out for delivery step
  if (['out_for_delivery', 'ofp'].includes(normalized)) return 'out_for_delivery';
  // intransit and reached-hub status -> in_transit step
  if (['intransit', 'in_transit', 'reached-hub', 'reachedhub'].includes(normalized)) return 'in_transit';
  // received and courierboy status -> booked step (before transit)
  if (['received', 'courierboy', 'assigned'].includes(normalized)) return 'booked';
  // booked, pickup, picked status -> booked step
  if (['booked', 'pickup', 'picked'].includes(normalized)) return 'booked';
  // Default -> booked step
  return 'booked';
};

// Build tracking summary from medicine booking
const buildMedicineTrackingSummary = async (medicineBooking) => {
  const originData = medicineBooking.origin || {};
  const destinationData = medicineBooking.destination || {};
  const shipmentData = medicineBooking.shipment || {};
  const packageData = medicineBooking.package || {};
  const invoiceData = medicineBooking.invoice || {};
  const paymentData = medicineBooking.payment || {};
  
  const originLabel = formatLocationLabel(originData.city, originData.state) || originData.city || 'Origin';
  const destinationLabel = formatLocationLabel(destinationData.city, destinationData.state) || destinationData.city || 'Destination';
  const routeSummary = `${originLabel} → ${destinationLabel}`.trim();
  
  // Get current status and map to step
  const rawStatus = medicineBooking.status || 'Booked';
  const currentStepKey = deriveMedicineStepKeyFromStatus(rawStatus);
  
  // Fetch manifest if manifestId exists
  let manifest = null;
  if (medicineBooking.manifestId) {
    manifest = await MedicineManifest.findById(medicineBooking.manifestId).lean();
  } else {
    // Also try to find manifest by consignment number in consignments array
    manifest = await MedicineManifest.findOne({
      'consignments.consignmentNumber': medicineBooking.consignmentNumber
    }).lean();
  }
  
  // Get timestamps from medicine booking
  const bookingTimestamp = medicineBooking.createdAt;
  const receivedTimestamp = medicineBooking.arrivedAtHubScanAt || null;
  const manifestCreatedAt = manifest?.createdAt || null;
  const assignedCourierTimestamp = medicineBooking.assignedCourierBoyAt || null;
  const arrivedMedicineTimestamp = medicineBooking.arrivedMedicineScannedAt || null;
  const manifestDispatchedAt = manifest?.dispatchedAt || null;
  const deliveredTimestamp = medicineBooking.deliveredAt || null;
  
  // Determine timestamps for each step
  let inTransitTimestamp = manifestDispatchedAt || null;
  
  // Build movement history
  let movementHistory = [];
  const pushMovementEvent = (status, label, timestamp, location = null) => {
    if (timestamp) {
      movementHistory.push({ status, label, timestamp, location });
    }
  };
  
  // 1. Booked
  if (bookingTimestamp) {
    pushMovementEvent('booked', 'Shipment booked', toISO(bookingTimestamp), originLabel);
  }
  
  // 2. Received (Arrived at Hub or Ready to Dispatch)
  if (receivedTimestamp) {
    pushMovementEvent('received', 'Received at OCL hub', toISO(receivedTimestamp), originLabel);
  }
  
  // 3. In Transit
  if (inTransitTimestamp) {
    pushMovementEvent('in_transit', 'In Transit', toISO(inTransitTimestamp), destinationLabel);
  }
  
  // 4. Out for Delivery
  if (assignedCourierTimestamp) {
    pushMovementEvent('out_for_delivery', 'Out for delivery', toISO(assignedCourierTimestamp), destinationLabel);
  }
  
  // 5. Delivered
  if (deliveredTimestamp) {
    pushMovementEvent('delivered', 'Delivered', toISO(deliveredTimestamp), destinationLabel);
  }
  
  // Build steps array
  const steps = MEDICINE_TRACKING_STEPS.map(definition => {
    const stepKey = definition.key;
    let timestamp = null;
    let completed = false;
    let description = '';
    let fields = [];
    
    const stepOrder = MEDICINE_TRACKING_STEPS.findIndex(s => s.key === stepKey);
    const currentStepOrder = MEDICINE_TRACKING_STEPS.findIndex(s => s.key === currentStepKey);
    
    switch (stepKey) {
      case 'booked':
        timestamp = toISO(bookingTimestamp);
        completed = stepOrder <= currentStepOrder;
        description = 'Shipment created and awaiting handover.';
        fields = [
          bookingTimestamp ? { label: 'Booking Date & Time', value: toISO(bookingTimestamp), format: 'datetime' } : null,
          medicineBooking.consignmentNumber ? { label: 'Consignment Number', value: medicineBooking.consignmentNumber.toString() } : null,
          routeSummary ? { label: 'Route', value: routeSummary } : null,
          shipmentData?.services ? { label: 'Service Type', value: shipmentData.services } : null,
          packageData?.totalPackages ? { label: 'Package Count', value: packageData.totalPackages } : null,
          shipmentData?.actualWeight ? { label: 'Weight', value: `${shipmentData.actualWeight} kg` } : null,
          shipmentData?.mode ? { label: 'Transit Mode', value: shipmentData.mode } : null
        ].filter(Boolean);
        break;
      case 'in_transit':
        // Use manifestDispatchedAt as the main timestamp for in_transit
        timestamp = manifestDispatchedAt ? toISO(manifestDispatchedAt) : (arrivedMedicineTimestamp ? toISO(arrivedMedicineTimestamp) : null);
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = timestamp ? 'Shipment is moving between hubs.' : 'Preparing for line haul.';
        fields = [
          manifestDispatchedAt ? { label: 'In Transit Time', value: toISO(manifestDispatchedAt), format: 'datetime' } : null,
          arrivedMedicineTimestamp ? { label: 'Reached', value: toISO(arrivedMedicineTimestamp), format: 'datetime' } : null,
          destinationLabel ? { label: 'Next Hub', value: destinationLabel } : null
        ].filter(Boolean);
        break;
      case 'out_for_delivery':
        // Use assignedCourierBoyAt as the timestamp
        timestamp = assignedCourierTimestamp ? toISO(assignedCourierTimestamp) : null;
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = timestamp ? 'Your shipment is out for delivery today.' : 'Awaiting delivery assignment.';
        fields = [
          assignedCourierTimestamp ? { label: 'Out for Delivery Time', value: toISO(assignedCourierTimestamp), format: 'datetime' } : null,
          destinationLabel ? { label: 'Delivery City', value: destinationLabel } : null,
          destinationData?.locality ? { label: 'Delivery Address', value: destinationData.locality } : null
        ].filter(Boolean);
        break;
      case 'delivered':
        // Use deliveredAt as the timestamp
        timestamp = deliveredTimestamp ? toISO(deliveredTimestamp) : null;
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = timestamp ? 'Shipment delivered successfully.' : 'Awaiting delivery confirmation.';
        fields = [
          deliveredTimestamp ? { label: 'Delivered At', value: toISO(deliveredTimestamp), format: 'datetime' } : null,
          destinationData?.name ? { label: 'Received By', value: destinationData.name } : null,
          destinationLabel ? { label: 'Delivery Location', value: destinationLabel } : null
        ].filter(Boolean);
        break;
    }
    
    // Mark steps as completed based on current step
    if (stepOrder <= currentStepOrder) {
      if (stepOrder === currentStepOrder) {
        completed = true; // Current step is always completed (in progress)
      } else {
        completed = !!timestamp; // Past steps need timestamp
      }
    } else {
      completed = false;
      timestamp = null;
      fields = [];
    }
    
    return {
      key: stepKey,
      title: definition.title,
      completed,
      timestamp,
      description,
      fields
    };
  });
  
  // Get package images
  const packageImages = [];
  if (packageData?.packageImages && Array.isArray(packageData.packageImages)) {
    packageData.packageImages.forEach(img => {
      if (img?.url) packageImages.push(img.url);
    });
  }
  
  // Build tracking summary
  const trackingSummary = {
    metadata: {
      consignmentNumber: medicineBooking.consignmentNumber?.toString() || '',
      bookingReference: medicineBooking.bookingReference || '',
      serviceType: shipmentData?.services || '',
      packageCount: packageData?.totalPackages || null,
      paymentMethod: paymentData?.deliveryType === 'COD' ? 'To Pay (COD)' : 'Prepaid',
      routeSummary,
      bookingDate: toISO(bookingTimestamp),
      statusLabel: MEDICINE_TRACKING_STEPS.find(s => s.key === currentStepKey)?.title || 'Booked',
      currentStepKey,
      estimatedDelivery: null, // Medicine bookings may not have this
      lastUpdated: toISO(medicineBooking.updatedAt) || toISO(medicineBooking.createdAt)
    },
    steps,
    movementHistory: movementHistory
      .filter((event, index, self) => {
        return index === self.findIndex(item =>
          item.label === event.label &&
          item.timestamp === event.timestamp &&
          item.status === event.status
        );
      })
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      }),
    attachments: {
      packageImages: [...new Set(packageImages)],
      deliveryProofImages: []
    }
  };
  
  return trackingSummary;
};

// Build tracking summary from customer booking
const buildCustomerBookingTrackingSummary = async (customerBooking) => {
  const originData = customerBooking.origin || {};
  const destinationData = customerBooking.destination || {};
  const shipmentData = customerBooking.shipment || {};
  
  const originLabel = formatLocationLabel(originData.city, originData.state) || originData.city || 'Origin';
  const destinationLabel = formatLocationLabel(destinationData.city, destinationData.state) || destinationData.city || 'Destination';
  const routeSummary = `${originLabel} → ${destinationLabel}`.trim();
  
  // Get current status and map to step
  const rawStatus = customerBooking.currentStatus || 'booked';
  const currentStepKey = deriveCustomerBookingStepKeyFromStatus(rawStatus);
  
  // Get timestamps from customer booking
  const bookingTimestamp = customerBooking.BookedAt || customerBooking.createdAt;
  const pickedUpTimestamp = customerBooking.PickedUpAt || null;
  const receivedTimestamp = customerBooking.ReceivedAt || null;
  const reachedHubEvent = getLatestEntry(customerBooking.reachedHub);
  const assignedEvent = getLatestEntry(customerBooking.assigned);
  const courierBoyEvent = getLatestEntry(customerBooking.courierboy);
  const intransitEvent = getLatestEntry(customerBooking.intransit);
  const ofdEvent = getLatestEntry(customerBooking.OutForDelivery);
  const deliveredData = customerBooking.delivered || {};
  const deliveredTimestamp = deliveredData?.deliveredAt ? toISO(deliveredData.deliveredAt) : null;
  
  // Determine in_transit timestamp
  let inTransitTimestamp = null;
  if (intransitEvent?.assignedAt) {
    inTransitTimestamp = toISO(intransitEvent.assignedAt);
  } else if (reachedHubEvent?.timestamp) {
    inTransitTimestamp = toISO(reachedHubEvent.timestamp);
  }
  
  // Determine out_for_delivery timestamp
  const ofdTimestamp = ofdEvent?.assignedAt ? toISO(ofdEvent.assignedAt) : null;
  
  // Build movement history
  let movementHistory = [];
  const pushMovementEvent = (status, label, timestamp, location = null) => {
    if (timestamp) {
      movementHistory.push({ status, label, timestamp, location });
    }
  };
  
  // 1. Booked
  if (bookingTimestamp) {
    pushMovementEvent('booked', 'Shipment booked', toISO(bookingTimestamp), originLabel);
  }
  
  // 2. Picked Up
  if (pickedUpTimestamp) {
    pushMovementEvent('pickup', 'Picked up', toISO(pickedUpTimestamp), originLabel);
  }
  
  // 3. Received at OCL
  if (receivedTimestamp) {
    pushMovementEvent('received', 'Received at OCL hub', toISO(receivedTimestamp), originLabel);
  }
  
  // 4. In Transit
  if (inTransitTimestamp) {
    pushMovementEvent('in_transit', 'In Transit', inTransitTimestamp, destinationLabel);
  }
  
  // 5. Out for Delivery
  if (ofdTimestamp) {
    pushMovementEvent('out_for_delivery', 'Out for delivery', ofdTimestamp, destinationLabel);
  }
  
  // 6. Delivered
  if (deliveredTimestamp) {
    pushMovementEvent('delivered', 'Delivered', deliveredTimestamp, destinationLabel);
  }
  
  // Build steps array
  const steps = TRACKING_STEPS.map(definition => {
    const stepKey = definition.key;
    let timestamp = null;
    let completed = false;
    let description = '';
    let fields = [];
    
    const stepOrder = TRACKING_STEPS.findIndex(s => s.key === stepKey);
    const currentStepOrder = TRACKING_STEPS.findIndex(s => s.key === currentStepKey);
    
    switch (stepKey) {
      case 'booked':
        timestamp = toISO(bookingTimestamp);
        completed = stepOrder <= currentStepOrder;
        description = 'Shipment created and awaiting handover.';
        fields = [
          bookingTimestamp ? { label: 'Booking Date & Time', value: toISO(bookingTimestamp), format: 'datetime' } : null,
          customerBooking.consignmentNumber ? { label: 'Consignment Number', value: customerBooking.consignmentNumber.toString() } : null,
          routeSummary ? { label: 'Route', value: routeSummary } : null,
          customerBooking.serviceType ? { label: 'Service Type', value: customerBooking.serviceType } : null,
          shipmentData?.packagesCount ? { label: 'Package Count', value: shipmentData.packagesCount } : null,
          shipmentData?.weight || customerBooking.actualWeight ? { label: 'Weight', value: `${shipmentData?.weight || customerBooking.actualWeight} kg` } : null,
          customerBooking.shippingMode ? { label: 'Transit Mode', value: customerBooking.shippingMode } : null
        ].filter(Boolean);
        break;
      case 'in_transit':
        timestamp = inTransitTimestamp;
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = inTransitTimestamp ? 'Shipment is moving between hubs.' : 'Preparing for line haul.';
        fields = [
          reachedHubEvent?.timestamp ? { label: 'Reached Hub', value: toISO(reachedHubEvent.timestamp), format: 'datetime' } : null,
          reachedHubEvent?.adminName ? { label: 'Processed By', value: reachedHubEvent.adminName } : null,
          destinationLabel ? { label: 'Next Hub', value: destinationLabel } : null,
          originLabel ? { label: 'From', value: originLabel } : null
        ].filter(Boolean);
        break;
      case 'out_for_delivery':
        timestamp = ofdTimestamp;
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = ofdTimestamp ? 'Your shipment is out for delivery today.' : 'Awaiting delivery assignment.';
        const ofdAgentName = ofdEvent?.courierBoyName;
        const ofdAgentPhone = ofdEvent?.courierBoyPhone;
        fields = [
          ofdTimestamp ? { label: 'Out for Delivery Time', value: ofdTimestamp, format: 'datetime' } : null,
          ofdAgentName ? { label: 'Delivery Agent', value: ofdAgentName } : null,
          ofdAgentPhone ? { label: 'Agent Phone', value: ofdAgentPhone } : null,
          destinationLabel ? { label: 'Delivery City', value: destinationLabel } : null,
          destinationData?.locality ? { label: 'Delivery Address', value: destinationData.locality } : null,
          customerBooking.paymentMethod === 'cod' && customerBooking.totalAmount ? {
            label: 'Payment to Collect',
            value: `₹${customerBooking.totalAmount}`
          } : null
        ].filter(Boolean);
        break;
      case 'delivered':
        timestamp = deliveredTimestamp;
        completed = stepOrder <= currentStepOrder && !!timestamp;
        description = deliveredTimestamp ? 'Shipment delivered successfully.' : 'Awaiting delivery confirmation.';
        fields = [
          deliveredTimestamp ? { label: 'Delivered At', value: deliveredTimestamp, format: 'datetime' } : null,
          destinationData?.name ? { label: 'Received By', value: destinationData.name } : null,
          destinationLabel ? { label: 'Delivery Location', value: destinationLabel } : null,
          deliveredData?.amountCollected !== undefined && deliveredData.amountCollected > 0 ? {
            label: 'Payment Collected',
            value: `₹${deliveredData.amountCollected}`
          } : null
        ].filter(Boolean);
        break;
    }
    
    // Mark steps as completed based on current step
    if (stepOrder <= currentStepOrder) {
      if (stepOrder === currentStepOrder) {
        completed = true; // Current step is always completed (in progress)
      } else {
        completed = !!timestamp; // Past steps need timestamp
      }
    } else {
      completed = false;
      timestamp = null;
      fields = [];
    }
    
    return {
      key: stepKey,
      title: definition.title,
      completed,
      timestamp,
      description,
      fields
    };
  });
  
  // Get package images
  const packageImages = [];
  if (customerBooking.packageImages && Array.isArray(customerBooking.packageImages)) {
    customerBooking.packageImages.forEach(img => {
      if (img) packageImages.push(img);
    });
  }
  
  // Build tracking summary
  const trackingSummary = {
    metadata: {
      consignmentNumber: customerBooking.consignmentNumber?.toString() || '',
      bookingReference: customerBooking.bookingReference || '',
      serviceType: customerBooking.serviceType || '',
      packageCount: shipmentData?.packagesCount || null,
      paymentMethod: customerBooking.paymentMethod === 'cod' ? 'To Pay (COD)' : 'Prepaid',
      routeSummary,
      bookingDate: toISO(bookingTimestamp),
      statusLabel: STEP_TITLE_MAP[currentStepKey] || 'Booked',
      currentStepKey,
      estimatedDelivery: null, // Customer bookings may not have this
      lastUpdated: toISO(customerBooking.updatedAt) || toISO(customerBooking.createdAt)
    },
    steps,
    movementHistory: movementHistory
      .filter((event, index, self) => {
        return index === self.findIndex(item =>
          item.label === event.label &&
          item.timestamp === event.timestamp &&
          item.status === event.status
        );
      })
      .sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      }),
    attachments: {
      packageImages: [...new Set(packageImages)],
      deliveryProofImages: []
    }
  };
  
  return trackingSummary;
};

// Public tracking endpoint
router.get('/:consignmentNumber', async (req, res) => {
  try {
    const { consignmentNumber } = req.params;
    let numericConsignment = null;
    
    // Try to parse as number
    if (/^\d+$/.test(consignmentNumber)) {
      numericConsignment = parseFloat(consignmentNumber);
    }
    
    if (!numericConsignment) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consignment number'
      });
    }
    
    // First, try to find in trackings collection (corporate bookings)
    let tracking = await Tracking.findOne({
      $or: [
        { consignmentNumber: numericConsignment },
        { consignmentNumber: numericConsignment.toString() }
      ]
    }).lean();
    
    // If not found in trackings, search in medicinebookings
    let medicineBooking = null;
    if (!tracking) {
      medicineBooking = await MedicineBooking.findOne({
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: numericConsignment.toString() }
        ]
      }).lean();
      
      if (medicineBooking) {
        // Build tracking summary from medicine booking
        const trackingSummary = await buildMedicineTrackingSummary(medicineBooking);
        
        return res.json({
          success: true,
          data: {
            consignmentNumber: medicineBooking.consignmentNumber,
            bookingReference: medicineBooking.bookingReference,
            status: medicineBooking.status || 'Booked',
            trackingSummary,
            source: 'medicine'
          }
        });
      }
    }
    
    // If not found in trackings or medicinebookings, search in customerbookings
    let customerBooking = null;
    if (!tracking && !medicineBooking) {
      customerBooking = await CustomerBooking.findOne({
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: numericConsignment.toString() }
        ]
      }).lean();
      
      if (!customerBooking) {
        return res.status(404).json({
          success: false,
          error: 'Consignment number not found'
        });
      }
      
      // Build tracking summary from customer booking
      const trackingSummary = await buildCustomerBookingTrackingSummary(customerBooking);
      
      return res.json({
        success: true,
        data: {
          consignmentNumber: customerBooking.consignmentNumber,
          bookingReference: customerBooking.bookingReference,
          status: customerBooking.currentStatus || 'booked',
          trackingSummary,
          source: 'customer'
        }
      });
    }
    
    // Extract booking data from tracked booked array
    const bookedData = Array.isArray(tracking.booked) && tracking.booked.length > 0 
      ? tracking.booked[0] 
      : {};
    
    const shipmentData = bookedData?.shipmentData || {};
    const invoiceData = bookedData?.invoiceData || {};
    const paymentData = bookedData?.paymentData || {};
    const originData = bookedData?.originData || {};
    const destinationData = bookedData?.destinationData || {};
    
    const originLabel = formatLocationLabel(originData.city, originData.state) || originData.city || 'Origin';
    const destinationLabel = formatLocationLabel(destinationData.city, destinationData.state) || destinationData.city || 'Destination';
    const routeSummary = `${originLabel} → ${destinationLabel}`.trim();
    
    // Get timestamps from tracking data
    const bookingTimestamp = bookedData?.bookingDate || tracking.createdAt;
    const pickupEvent = getLatestEntry(tracking.pickup);
    const receivedEvent = getLatestEntry(tracking.received);
    const reachedHubEvent = getLatestEntry(tracking.reachedHub);
    const assignedEvent = getLatestEntry(tracking.assigned);
    const ofdEvent = getLatestEntry(tracking.OFD);
    const courierAssignment = getLatestEntry(tracking.courierboy);
    const intransitData = tracking.intransit; // Direct intransit field from tracking document
    const unreachableData = tracking.unreachable || {};
    const unreachableAttempts = Array.isArray(unreachableData.attempts) ? unreachableData.attempts : [];
    const lastUnreachableAttempt = unreachableAttempts.length > 0 ? unreachableAttempts[unreachableAttempts.length - 1] : null;
    
    // Handle delivered - use only deliveredAt field (actual delivery time)
    let deliveredTimestamp = null;
    if (tracking.delivered?.deliveredAt) {
      deliveredTimestamp = toISO(tracking.delivered.deliveredAt);
    }
    
    // Build status history from statusHistory and history arrays
    const statusHistory = Array.isArray(tracking.statusHistory) ? tracking.statusHistory : [];
    const history = Array.isArray(tracking.history) ? tracking.history.map(h => ({
      status: h.status || h.meta?.status || 'unknown',
      timestamp: h.timestamp || h.meta?.timestamp,
      notes: h.notes || '',
      meta: h.meta || {}
    })) : [];
    
    const combinedHistory = [...statusHistory, ...history]
      .filter(entry => entry && entry.status)
      .map(entry => ({
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
        const match = combinedHistory.find(entry => entry.status === status);
        if (match?.timestamp) {
          return match.timestamp;
        }
      }
      return null;
    };
    
    // Determine current step - prioritize currentStatus from tracking
    // currentStatus is the PRIMARY source of truth - never override it with timestamps
    const rawStatus = tracking.currentStatus || 'booked';
    let currentStepKey = deriveStepKeyFromStatus(rawStatus);
    
    // Get timestamps ONLY from actual data arrays, not fallbacks
    // Only use received timestamp if received array has actual data
    const receivedTimestamp = receivedEvent?.scannedAt ? toISO(receivedEvent.scannedAt) : null;
    
    // Only use pickup timestamp if pickup array has actual data
    const pickupTimestamp = pickupEvent?.pickedUpAt ? toISO(pickupEvent.pickedUpAt) : null;
    
    // Get in_transit timestamp - prioritize actual intransit field from tracking document
    // Then check statusHistory/history, then fall back to reachedHub, assigned, or other related statuses
    let inTransitTimestamp = null;
    
    // First priority: Check if tracking.intransit.completedAt exists (direct intransit field)
    if (intransitData?.completedAt) {
      inTransitTimestamp = toISO(intransitData.completedAt);
    }
    
    // Second priority: Check statusHistory/history for 'intransit' status
    if (!inTransitTimestamp) {
      inTransitTimestamp = getTimestampForStatus('intransit', 'in_transit');
    }
    
    // Third priority: Check reachedHub (which is part of in_transit flow)
    if (!inTransitTimestamp) {
      inTransitTimestamp = reachedHubEvent?.timestamp ? toISO(reachedHubEvent.timestamp) : null;
    }
    
    // Fallback: Check other transit-related statuses from history (only actual in_transit statuses)
    if (!inTransitTimestamp) {
      inTransitTimestamp = getTimestampForStatus('reached-hub', 'reachedhub');
    }
    
    const ofdTimestamp = ofdEvent?.assignedAt ? toISO(ofdEvent.assignedAt) : null;
    
    // Only use delivered timestamp if currentStatus is actually "delivered"
    if (rawStatus.toLowerCase() === 'delivered') {
      if (!deliveredTimestamp) {
        deliveredTimestamp = getTimestampForStatus('delivered');
      }
    } else {
      // If currentStatus is not "delivered", don't show delivered events
      deliveredTimestamp = null;
    }

    // Undelivered timestamp (for steps & movement history when status is undelivered)
    let undeliveredTimestamp = null;
    if (rawStatus.toLowerCase() === 'undelivered') {
      undeliveredTimestamp =
        tracking.delivered?.lastUnreachableAttempt
          ? toISO(tracking.delivered.lastUnreachableAttempt)
          : (lastUnreachableAttempt?.at ? toISO(lastUnreachableAttempt.at) : null);
    }
    
    // Build movement history - only include events that are actually confirmed
    // Order: booked → picked → received → in_transit → out_for_delivery → delivered
    let movementHistory = [];
    const pushMovementEvent = (status, label, timestamp, location = null, description = null) => {
      if (timestamp) {
        movementHistory.push({ status, label, timestamp, location, description });
      }
    };
    
    // 1. Booked - always first
    if (bookingTimestamp) {
      pushMovementEvent('booked', 'Shipment booked', toISO(bookingTimestamp), originLabel);
    }
    
    // 2. Picked - after booked
    if (pickupTimestamp) {
      pushMovementEvent('pickup', `Picked by ${pickupEvent?.courierName || 'assigned courier'}`, pickupTimestamp, originLabel);
    }
    
    // 3. Received - after picked
    if (receivedTimestamp) {
      pushMovementEvent('received', 'Received at OCL hub', receivedTimestamp, originLabel);
    }
    
    // 4. In Transit - after received (replaced "Reached hub" with "In Transit")
    if (inTransitTimestamp) {
      pushMovementEvent('in_transit', 'In Transit', inTransitTimestamp, destinationLabel);
    }
    
    // 5. Out for Delivery - after in transit
    if (ofdTimestamp) {
      pushMovementEvent('out_for_delivery', 'Out for delivery', ofdTimestamp, destinationLabel);
    }
    
    // 6. Delivered / Not delivered - last
    if (deliveredTimestamp && rawStatus.toLowerCase() === 'delivered') {
      pushMovementEvent('delivered', 'Delivered', deliveredTimestamp, destinationLabel);
    } else if (undeliveredTimestamp && rawStatus.toLowerCase() === 'undelivered') {
      pushMovementEvent('not_delivered', 'Not delivered', undeliveredTimestamp, destinationLabel);
    }
    
    // Calculate movement history stats for use in step fields
    const movementHistoryStats = {
      totalEvents: movementHistory.length,
      transitEvents: movementHistory.filter(e => e.status === 'in_transit' || e.status === 'reached-hub').length
    };
    
    // Build steps array with detailed fields
    const steps = TRACKING_STEPS.map(definition => {
      const stepKey = definition.key;
      let timestamp = null;
      let completed = false;
      let description = '';
      let fields = [];
      
      switch (stepKey) {
        case 'booked':
          timestamp = toISO(bookingTimestamp);
          completed = true;
          description = 'Shipment created and awaiting handover.';
          fields = [
            bookingTimestamp ? { label: 'Booking Date & Time', value: toISO(bookingTimestamp), format: 'datetime' } : null,
            tracking.consignmentNumber ? { label: 'Consignment Number', value: tracking.consignmentNumber.toString() } : null,
            routeSummary ? { label: 'Route', value: routeSummary } : null,
            shipmentData?.services ? { label: 'Service Type', value: shipmentData.services } : null,
            shipmentData?.packagesCount || shipmentData?.totalPackages ? { label: 'Package Count', value: (shipmentData?.packagesCount || shipmentData?.totalPackages).toString() } : null,
            shipmentData?.actualWeight || shipmentData?.chargeableWeight ? { label: 'Weight', value: `${shipmentData?.actualWeight || shipmentData?.chargeableWeight} kg` } : null,
            shipmentData?.mode ? { label: 'Transit Mode', value: shipmentData.mode } : null
          ].filter(Boolean);
          break;
        case 'in_transit':
          timestamp = inTransitTimestamp;
          completed = !!inTransitTimestamp;
          description = inTransitTimestamp ? 'Shipment is moving between hubs.' : 'Preparing for line haul.';
          fields = [
            reachedHubEvent?.timestamp ? { label: 'Last Hub Update', value: toISO(reachedHubEvent.timestamp), format: 'datetime' } : null,
            reachedHubEvent?.adminName ? { label: 'Processed By', value: reachedHubEvent.adminName } : null,
            destinationLabel ? { label: 'Next Hub', value: destinationLabel } : null,
            originLabel ? { label: 'From', value: originLabel } : null,
            { label: 'Movement Updates', value: movementHistoryStats.transitEvents > 0 ? `${movementHistoryStats.transitEvents} recorded events` : 'No updates yet' }
          ].filter(Boolean);
          break;
        case 'out_for_delivery':
          timestamp = ofdTimestamp;
          completed = !!ofdTimestamp;
          description = ofdTimestamp ? 'Your shipment is out for delivery today.' : 'Awaiting delivery assignment.';
          const ofdAgentName = ofdEvent?.courierBoyName || courierAssignment?.courierBoyName;
          const ofdAgentPhone = ofdEvent?.courierBoyPhone || courierAssignment?.courierBoyPhone;
          fields = [
            ofdTimestamp ? { label: 'Dispatch Time', value: ofdTimestamp, format: 'datetime' } : null,
            ofdAgentName ? { label: 'Delivery Agent', value: ofdAgentName } : null,
            ofdAgentPhone ? { label: 'Agent Phone', value: ofdAgentPhone } : null,
            destinationLabel ? { label: 'Delivery City', value: destinationLabel } : null,
            destinationData?.address || destinationData?.locality ? { label: 'Delivery Address', value: destinationData.address || destinationData.locality } : null,
            (invoiceData?.finalPrice || shipmentData?.declaredValue) && paymentData?.paymentType === 'TP' ? {
              label: 'Payment to Collect',
              value: `₹${invoiceData?.finalPrice || shipmentData?.declaredValue}`
            } : null
          ].filter(Boolean);
          break;
        case 'delivered':
        // Final step: handle both delivered and undelivered states
        if (rawStatus.toLowerCase() === 'delivered') {
          // Delivered flow
          timestamp = deliveredTimestamp;
          completed = !!deliveredTimestamp;
          description = deliveredTimestamp ? 'Shipment delivered successfully.' : 'Awaiting delivery confirmation.';
          const deliveredHistoryMeta = combinedHistory.find(entry => entry.status === 'delivered')?.meta || {};
          fields = [
            deliveredTimestamp ? { label: 'Delivered At', value: deliveredTimestamp, format: 'datetime' } : null,
            destinationData?.name || destinationData?.companyName ? { label: 'Received By', value: destinationData.name || destinationData.companyName } : null,
            destinationLabel ? { label: 'Delivery Location', value: destinationLabel } : null,
            invoiceData?.finalPrice && paymentData?.paymentType === 'TP' ? { label: 'Payment Collected', value: `₹${invoiceData.finalPrice}` } : null
          ].filter(Boolean);
        } else if (rawStatus.toLowerCase() === 'undelivered') {
          // Undelivered flow – show unreachable attempt details
          timestamp = undeliveredTimestamp;
          completed = true; // Final state
          description = 'Shipment could not be delivered after multiple attempts.';

          const lastReason = lastUnreachableAttempt?.reason || '';
          const lastLocationObj = lastUnreachableAttempt?.location || {};
          const lastLocation =
            lastLocationObj.address ||
            (lastLocationObj.latitude && lastLocationObj.longitude
              ? `${lastLocationObj.latitude}, ${lastLocationObj.longitude}`
              : null);

          fields = [
            undeliveredTimestamp
              ? { label: 'Undelivered At', value: undeliveredTimestamp, format: 'datetime' }
              : null,
            unreachableData.count
              ? { label: 'Total Attempts', value: unreachableData.count.toString() }
              : (unreachableAttempts.length
                  ? { label: 'Total Attempts', value: unreachableAttempts.length.toString() }
                  : null),
            lastReason
              ? { label: 'Reason for Delivery Failure', value: lastReason }
              : null,
            lastLocation
              ? { label: 'Last Attempt Location', value: lastLocation }
              : null,
            lastUnreachableAttempt?.courierBoyName
              ? { label: 'Delivery Agent', value: lastUnreachableAttempt.courierBoyName }
              : (courierAssignment?.courierBoyName
                  ? { label: 'Delivery Agent', value: courierAssignment.courierBoyName }
                  : null),
            destinationLabel
              ? { label: 'Delivery Location', value: destinationLabel }
              : null
          ].filter(Boolean);
        } else {
          // Other future states – keep generic
          timestamp = null;
          completed = false;
          description = 'Awaiting delivery confirmation.';
          fields = [];
        }
          break;
      }
      
      // Mark steps as completed based on current step from currentStatus
      // This ensures we only mark steps as completed up to the current step
      const stepOrder = TRACKING_STEPS.findIndex(s => s.key === stepKey);
      const currentStepOrder = TRACKING_STEPS.findIndex(s => s.key === currentStepKey);
      
      // Only mark steps as completed if they are at or before the current step
      // Steps beyond the current step should never be marked as completed
      if (stepOrder <= currentStepOrder) {
        // For steps at or before current step, mark as completed if we have timestamp
        // Current step is always marked as completed (it's the active step)
        if (stepOrder === currentStepOrder) {
          completed = true; // Current step is always completed (in progress)
        } else {
          // Past steps need timestamp to be marked completed
          completed = !!timestamp;
        }
      } else {
        // Future steps should never be marked as completed, regardless of timestamps
        completed = false;
        timestamp = null; // Clear timestamp for future steps to avoid confusion
        fields = []; // Clear fields for future steps
      }
      
      return {
        key: stepKey,
        title: definition.title,
        completed,
        timestamp,
        description,
        fields
      };
    });
    
    // Movement history already built above, now filter and sort it
    
    // Get package images
    const packageImages = [];
    if (shipmentData?.packageImages && Array.isArray(shipmentData.packageImages)) {
      shipmentData.packageImages.forEach(img => {
        if (img?.url) packageImages.push(img.url);
      });
    }
    if (shipmentData?.uploadedFiles && Array.isArray(shipmentData.uploadedFiles)) {
      shipmentData.uploadedFiles.forEach(file => {
        if (file?.url) packageImages.push(file.url);
      });
    }
    
    // Build tracking summary
    const trackingSummary = {
      metadata: {
        consignmentNumber: tracking.consignmentNumber?.toString() || '',
        bookingReference: tracking.bookingReference || '',
        serviceType: shipmentData?.services || invoiceData?.serviceType || '',
        packageCount: shipmentData?.packagesCount || shipmentData?.totalPackages || null,
        paymentMethod: paymentData?.paymentType === 'TP' ? 'To Pay (COD)' : 'Prepaid (Corporate Credit)',
        routeSummary,
        bookingDate: toISO(bookingTimestamp),
        statusLabel: rawStatus.toLowerCase() === 'undelivered'
          ? 'Not delivered'
          : (STEP_TITLE_MAP[currentStepKey] || 'Booked'),
        currentStepKey,
        estimatedDelivery: toISO(shipmentData?.estimatedDeliveryDate || invoiceData?.estimatedDeliveryDate),
        lastUpdated: toISO(tracking.updatedAt) || toISO(tracking.createdAt)
      },
      steps,
      movementHistory: movementHistory
        .filter((event, index, self) => {
          return index === self.findIndex(item =>
            item.label === event.label &&
            item.timestamp === event.timestamp &&
            item.status === event.status
          );
        })
        .sort((a, b) => {
          // Sort by timestamp chronologically
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        }),
      attachments: {
        packageImages: [...new Set(packageImages)],
        deliveryProofImages: []
      }
    };
    
    res.json({
      success: true,
      data: {
        consignmentNumber: tracking.consignmentNumber,
        bookingReference: tracking.bookingReference,
        status: tracking.currentStatus || 'booked',
        trackingSummary,
        source: 'corporate'
      }
    });
    
  } catch (error) {
    console.error('Public tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track consignment'
    });
  }
});

// Dedicated movement history endpoint for MyShipments
router.get('/:consignmentNumber/movement-history', async (req, res) => {
  try {
    const { consignmentNumber } = req.params;
    let numericConsignment = null;
    
    // Try to parse as number
    if (/^\d+$/.test(consignmentNumber)) {
      numericConsignment = parseFloat(consignmentNumber);
    }
    
    if (!numericConsignment) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consignment number'
      });
    }
    
    // First, try to find in trackings collection (corporate bookings)
    let tracking = await Tracking.findOne({
      $or: [
        { consignmentNumber: numericConsignment },
        { consignmentNumber: numericConsignment.toString() }
      ]
    }).lean();
    
    // If not found in trackings, search in medicinebookings
    let medicineBooking = null;
    if (!tracking) {
      medicineBooking = await MedicineBooking.findOne({
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: numericConsignment.toString() }
        ]
      }).lean();
      
      if (medicineBooking) {
        // Build movement history from medicine booking
        const trackingSummary = await buildMedicineTrackingSummary(medicineBooking);
        
        return res.json({
          success: true,
          data: {
            consignmentNumber: medicineBooking.consignmentNumber?.toString() || '',
            movementHistory: trackingSummary.movementHistory
          }
        });
      }
    }
    
    // If not found in trackings or medicinebookings, search in customerbookings
    let customerBooking = null;
    if (!tracking && !medicineBooking) {
      customerBooking = await CustomerBooking.findOne({
        $or: [
          { consignmentNumber: numericConsignment },
          { consignmentNumber: numericConsignment.toString() }
        ]
      }).lean();
      
      if (!customerBooking) {
        return res.status(404).json({
          success: false,
          error: 'Consignment number not found'
        });
      }
      
      // Build movement history from customer booking
      const trackingSummary = await buildCustomerBookingTrackingSummary(customerBooking);
      
      return res.json({
        success: true,
        data: {
          consignmentNumber: customerBooking.consignmentNumber?.toString() || '',
          movementHistory: trackingSummary.movementHistory
        }
      });
    }
    
    // Extract booking data from tracked booked array
    const bookedData = Array.isArray(tracking.booked) && tracking.booked.length > 0 
      ? tracking.booked[0] 
      : {};
    
    const originData = bookedData?.originData || {};
    const destinationData = bookedData?.destinationData || {};
    
    const originLabel = formatLocationLabel(originData.city, originData.state) || originData.city || 'Origin';
    const destinationLabel = formatLocationLabel(destinationData.city, destinationData.state) || destinationData.city || 'Destination';
    
    // Get timestamps from tracking data
    const bookingTimestamp = bookedData?.bookingDate || tracking.createdAt;
    const pickupEvent = getLatestEntry(tracking.pickup);
    const receivedEvent = getLatestEntry(tracking.received);
    const reachedHubEvent = getLatestEntry(tracking.reachedHub);
    const assignedEvent = getLatestEntry(tracking.assigned);
    const ofdEvent = getLatestEntry(tracking.OFD);
    const intransitData = tracking.intransit; // Direct intransit field from tracking document
    const unreachableData = tracking.unreachable || {};
    const unreachableAttempts = Array.isArray(unreachableData.attempts) ? unreachableData.attempts : [];
    const lastUnreachableAttempt = unreachableAttempts.length > 0 ? unreachableAttempts[unreachableAttempts.length - 1] : null;
    
    // Handle delivered - use only deliveredAt field (actual delivery time)
    let deliveredTimestamp = null;
    if (tracking.delivered?.deliveredAt) {
      deliveredTimestamp = toISO(tracking.delivered.deliveredAt);
    }
    
    // Build status history from statusHistory and history arrays
    const statusHistory = Array.isArray(tracking.statusHistory) ? tracking.statusHistory : [];
    const history = Array.isArray(tracking.history) ? tracking.history.map(h => ({
      status: h.status || h.meta?.status || 'unknown',
      timestamp: h.timestamp || h.meta?.timestamp,
      notes: h.notes || '',
      meta: h.meta || {}
    })) : [];
    
    const combinedHistory = [...statusHistory, ...history]
      .filter(entry => entry && entry.status)
      .map(entry => ({
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
    
    // Determine current status
    const rawStatus = tracking.currentStatus || 'booked';
    
    // Get timestamps ONLY from actual data arrays, not fallbacks
    // Only use received timestamp if received array has actual data
    const receivedTimestamp = receivedEvent?.scannedAt ? toISO(receivedEvent.scannedAt) : null;
    
    // Only use pickup timestamp if pickup array has actual data
    const pickupTimestamp = pickupEvent?.pickedUpAt ? toISO(pickupEvent.pickedUpAt) : null;
    
    // Get in_transit timestamp - prioritize actual intransit field from tracking document
    // Then check statusHistory/history, then fall back to reachedHub, assigned, or other related statuses
    const getTimestampForStatus = (...statuses) => {
      for (const status of statuses) {
        const match = combinedHistory.find(entry => entry.status === status);
        if (match?.timestamp) {
          return match.timestamp;
        }
      }
      return null;
    };
    
    let inTransitTimestamp = null;
    
    // First priority: Check if tracking.intransit.completedAt exists (direct intransit field)
    if (intransitData?.completedAt) {
      inTransitTimestamp = toISO(intransitData.completedAt);
    }
    
    // Second priority: Check statusHistory/history for 'intransit' status
    if (!inTransitTimestamp) {
      inTransitTimestamp = getTimestampForStatus('intransit', 'in_transit');
    }
    
    // Third priority: Check reachedHub (which is part of in_transit flow)
    if (!inTransitTimestamp) {
      inTransitTimestamp = reachedHubEvent?.timestamp ? toISO(reachedHubEvent.timestamp) : null;
    }
    
    // Fallback: Check other transit-related statuses from history (only actual in_transit statuses)
    if (!inTransitTimestamp) {
      inTransitTimestamp = getTimestampForStatus('reached-hub', 'reachedhub');
    }
    
    const ofdTimestamp = ofdEvent?.assignedAt ? toISO(ofdEvent.assignedAt) : null;
    
    // Only use delivered timestamp if currentStatus is actually "delivered"
    if (rawStatus.toLowerCase() !== 'delivered') {
      deliveredTimestamp = null;
    }

    // Undelivered timestamp (for movement history when status is undelivered)
    let undeliveredTimestamp = null;
    if (rawStatus.toLowerCase() === 'undelivered') {
      undeliveredTimestamp =
        tracking.delivered?.lastUnreachableAttempt
          ? toISO(tracking.delivered.lastUnreachableAttempt)
          : (lastUnreachableAttempt?.at ? toISO(lastUnreachableAttempt.at) : null);
    }
    
    // Build movement history - only include events that are actually confirmed
    // Order: booked → picked → received → in_transit → out_for_delivery → delivered
    let movementHistory = [];
    const pushMovementEvent = (status, label, timestamp, location = null, description = null) => {
      if (timestamp) {
        movementHistory.push({ status, label, timestamp, location, description });
      }
    };
    
    // 1. Booked - always first
    if (bookingTimestamp) {
      pushMovementEvent('booked', 'Shipment booked', toISO(bookingTimestamp), originLabel);
    }
    
    // 2. Picked - after booked
    if (pickupTimestamp) {
      pushMovementEvent('pickup', `Picked by ${pickupEvent?.courierName || 'assigned courier'}`, pickupTimestamp, originLabel);
    }
    
    // 3. Received - after picked
    if (receivedTimestamp) {
      pushMovementEvent('received', 'Received at OCL hub', receivedTimestamp, originLabel);
    }
    
    // 4. In Transit - after received (replaced "Reached hub" with "In Transit")
    if (inTransitTimestamp) {
      pushMovementEvent('in_transit', 'In Transit', inTransitTimestamp, destinationLabel);
    }
    
    // 5. Out for Delivery - after in transit
    if (ofdTimestamp) {
      pushMovementEvent('out_for_delivery', 'Out for delivery', ofdTimestamp, destinationLabel);
    }
    
    // 6. Delivered / Not delivered - last
    if (deliveredTimestamp && rawStatus.toLowerCase() === 'delivered') {
      pushMovementEvent('delivered', 'Delivered', deliveredTimestamp, destinationLabel);
    } else if (undeliveredTimestamp && rawStatus.toLowerCase() === 'undelivered') {
      pushMovementEvent('not_delivered', 'Not delivered', undeliveredTimestamp, destinationLabel);
    }
    
    // Filter duplicates and sort chronologically
    const uniqueMovementHistory = movementHistory
      .filter((event, index, self) => {
        return index === self.findIndex(item =>
          item.label === event.label &&
          item.timestamp === event.timestamp &&
          item.status === event.status
        );
      })
      .sort((a, b) => {
        // Sort by timestamp chronologically
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });
    
    res.json({
      success: true,
      data: {
        consignmentNumber: tracking.consignmentNumber?.toString() || '',
        movementHistory: uniqueMovementHistory
      }
    });
    
  } catch (error) {
    console.error('Movement history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement history'
    });
  }
});

export default router;
