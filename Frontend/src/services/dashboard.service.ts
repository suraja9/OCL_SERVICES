// Dashboard Service - Mocked API responses
// TODO: Replace with real API calls when backend is ready

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

type SLAResponse = {
  status: 'ok' | 'warning' | 'breached';
  hoursRemaining?: number;
  breachedByHours?: number;
};

type NeedsAttentionItem = {
  consignmentNumber: number;
  issueType: string;
  timeSinceUpdate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  lastUpdate: string;
  sla: SLAResponse;
};

type DashboardSummary = {
  totalShipments: number;
  statusCounts: Record<string, number>;
  todayCount: number;
  failedDeliveryTotal: number;
  failedDeliveryReasons: Record<string, number>;
};

// Mock data - replace with real API calls
const mockNeedsAttention: NeedsAttentionItem[] = [
  {
    consignmentNumber: 8349123456,
    issueType: 'Out for Delivery too long',
    timeSinceUpdate: '3d ago',
    priority: 'high',
    status: 'OFP',
    lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sla: { status: 'breached', breachedByHours: 67 },
  },
  {
    consignmentNumber: 8349123457,
    issueType: 'Delayed beyond SLA',
    timeSinceUpdate: '2d ago',
    priority: 'high',
    status: 'in_transit',
    lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sla: { status: 'breached', breachedByHours: 48 },
  },
];

const mockSummary: DashboardSummary = {
  totalShipments: 103,
  statusCounts: {
    booked: 17,
    pickup: 51,
    received: 3,
    intransit: 0,
    'reached-hub': 20,
    OFP: 0,
    delivered: 10,
  },
  todayCount: 5,
  failedDeliveryTotal: 2,
  failedDeliveryReasons: {
    'Customer not available': 1,
    'Phone switched off': 1,
  },
};

const token = () => localStorage.getItem('officeToken') || '';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Dashboard summary error:', error);
      // Fallback to mock for development
      return mockSummary;
    }
  },

  async getNeedsAttention(): Promise<NeedsAttentionItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/dashboard/needs-attention`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch needs attention');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Needs attention error:', error);
      // Fallback to mock for development
      return mockNeedsAttention;
    }
  },
};

