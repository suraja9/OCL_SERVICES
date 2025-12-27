// Payments Service - Mocked API responses
// TODO: Replace with real API calls when backend is ready

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

type UnpaidOrder = {
  consignmentNumber: number;
  bookingReference: string;
  amount: number;
  receiverName: string;
  receiverPhone: string;
  route: string;
  bookingDate: string;
};

type UnpaidPayments = {
  FP: {
    totalAmount: number;
    totalOrders: number;
    orders: UnpaidOrder[];
  };
  TP: {
    totalAmount: number;
    totalOrders: number;
    orders: UnpaidOrder[];
  };
};

type CourierPayments = {
  totalAmount: number;
  totalCourierBoys: number;
  totalOrders: number;
};

// Mock data - replace with real API calls
const mockUnpaidPayments: UnpaidPayments = {
  FP: {
    totalAmount: 382617,
    totalOrders: 33,
    orders: [
      {
        consignmentNumber: 8349123456,
        bookingReference: 'BR001',
        amount: 500,
        receiverName: 'Receiver Name',
        receiverPhone: '+919876543210',
        route: 'Guwahati → Delhi',
        bookingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  TP: {
    totalAmount: 213178,
    totalOrders: 24,
    orders: [
      {
        consignmentNumber: 8349123457,
        bookingReference: 'BR002',
        amount: 300,
        receiverName: 'Receiver Name 2',
        receiverPhone: '+919876543211',
        route: 'Mumbai → Delhi',
        bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
};

const mockCourierPayments: CourierPayments = {
  totalAmount: 301414,
  totalCourierBoys: 4,
  totalOrders: 19,
};

export const paymentsService = {
  async getUnpaidPayments(): Promise<UnpaidPayments> {
    try {
      const token = localStorage.getItem('officeToken') || localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/office/unpaid-payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }

      // Fallback to mock data if API fails
      console.warn('API returned unexpected format, using mock data');
      return mockUnpaidPayments;
    } catch (error) {
      console.error('Error fetching unpaid payments:', error);
      // Fallback to mock data on error
      return mockUnpaidPayments;
    }
  },

  async getCourierPaymentsSummary(): Promise<CourierPayments> {
    // TODO: Replace with: GET /api/courier/payments/summary
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCourierPayments), 300);
    });
  },
};

export type { UnpaidPayments, CourierPayments, UnpaidOrder };

