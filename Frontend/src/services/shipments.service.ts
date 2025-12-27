// Shipments Service - Mocked API responses
// TODO: Replace with real API calls when backend is ready

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

type SLAResponse = {
  status: 'ok' | 'warning' | 'breached';
  hoursRemaining?: number;
  breachedByHours?: number;
};

type ShipmentStatus = 
  | 'booked'
  | 'picked'
  | 'received'
  | 'assigned'
  | 'courierboy'
  | 'in_transit'
  | 'reached-hub'
  | 'out_for_delivery'
  | 'OFP'
  | 'delivered'
  | 'cancelled'
  | 'returned';

type TimelineEntry = {
  status: string;
  timestamp: string;
  location?: string;
  hubName?: string;
  courierBoyName?: string;
  courierBoyPhone?: string;
  failedReason?: string;
};

type Shipment = {
  _id: string;
  consignmentNumber: number;
  bookingReference: string;
  currentStatus: ShipmentStatus;
  hub?: string;
  location?: string;
  lastUpdated: string;
  sla: SLAResponse;
  flags: string[];
  timeline: TimelineEntry[];
  booked?: Array<{
    originData?: {
      name?: string;
      mobileNumber?: string;
      city?: string;
      state?: string;
    };
    destinationData?: {
      name?: string;
      mobileNumber?: string;
      city?: string;
      state?: string;
    };
    bookingDate?: string;
    paymentStatus?: string;
    paymentData?: {
      paymentType?: string;
    };
    invoiceData?: {
      finalPrice?: number;
    };
  }>;
  OFD?: Array<{
    courierBoyName?: string;
    courierBoyPhone?: string;
    ofdAt?: string;
  }>;
  failedReason?: string;
};

// Mock data - replace with real API calls
const mockLiveShipments: Shipment[] = [
  {
    _id: '1',
    consignmentNumber: 8349123456,
    bookingReference: 'BR001',
    currentStatus: 'OFP',
    hub: 'Guwahati',
    location: 'Guwahati',
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sla: { status: 'breached', breachedByHours: 67 },
    flags: ['payment_issue', 'escalated'],
    timeline: [
      { status: 'booked', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { status: 'received', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), location: 'OCL Hub' },
      { status: 'OFP', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), courierBoyName: 'John Doe', courierBoyPhone: '+919876543210' },
    ],
    booked: [{
      originData: { name: 'Customer Name', mobileNumber: '+919876543210', city: 'Guwahati' },
      destinationData: { name: 'Receiver', city: 'Delhi' },
      bookingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: 'unpaid',
      paymentData: { paymentType: 'TP' },
      invoiceData: { finalPrice: 500 },
    }],
    OFD: [{
      courierBoyName: 'John Doe',
      courierBoyPhone: '+919876543211',
      ofdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }],
  },
  {
    _id: '2',
    consignmentNumber: 8349123457,
    bookingReference: 'BR002',
    currentStatus: 'delivered',
    hub: 'Delhi',
    location: 'Delhi',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sla: { status: 'ok' },
    flags: [],
    timeline: [
      { status: 'booked', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { status: 'delivered', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    booked: [{
      originData: { name: 'Customer 2', mobileNumber: '+919876543212', city: 'Mumbai' },
      destinationData: { name: 'Receiver 2', city: 'Delhi' },
      bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: 'paid',
    }],
  },
];

const mockShipmentDetails: Record<number, Shipment> = {
  8349123456: mockLiveShipments[0],
  8349123457: mockLiveShipments[1],
};

const token = () => localStorage.getItem('officeToken') || '';

export const shipmentsService = {
  async getLiveShipments(): Promise<Shipment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/live`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch live shipments');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Live shipments error:', error);
      // Fallback to mock for development
      return mockLiveShipments;
    }
  },

  async getShipmentDetails(consignmentNumber: number): Promise<Shipment | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/${consignmentNumber}/details`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch shipment details');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Shipment details error:', error);
      // Fallback to mock for development
      return mockShipmentDetails[consignmentNumber] || null;
    }
  },
};

export type { Shipment, ShipmentStatus, SLAResponse, TimelineEntry };

