// Shipment Actions Service - Notes and Escalations
// TODO: Replace with real API calls when backend is ready

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

type InternalNote = {
  id: string;
  note: string;
  agentName: string;
  timestamp: string;
};

type Escalation = {
  id: string;
  target: 'ops_manager' | 'hub_manager' | 'admin';
  reason: string;
  agent: string;
  timestamp: string;
};

// Mock storage - replace with real API calls
const mockNotes: Record<number, InternalNote[]> = {};
const mockEscalations: Record<number, Escalation[]> = {};

const token = () => localStorage.getItem('officeToken') || '';

export const shipmentActionsService = {
  async getNotes(consignmentNumber: number): Promise<InternalNote[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/${consignmentNumber}/notes`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Get notes error:', error);
      // Fallback to mock for development
      return mockNotes[consignmentNumber] || [];
    }
  },

  async addNote(consignmentNumber: number, note: string): Promise<InternalNote> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/${consignmentNumber}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Add note error:', error);
      throw error;
    }
  },

  async getEscalations(consignmentNumber: number): Promise<Escalation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/${consignmentNumber}/escalations`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch escalations');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Get escalations error:', error);
      // Fallback to mock for development
      return mockEscalations[consignmentNumber] || [];
    }
  },

  async escalate(
    consignmentNumber: number,
    target: 'ops_manager' | 'hub_manager' | 'admin',
    reason: string
  ): Promise<Escalation> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/office/shipments/${consignmentNumber}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ target, reason }),
      });
      if (!response.ok) throw new Error('Failed to escalate');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Escalate error:', error);
      throw error;
    }
  },
};

export type { InternalNote, Escalation };

