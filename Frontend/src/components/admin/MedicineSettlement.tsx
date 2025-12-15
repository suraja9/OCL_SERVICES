import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Calculator,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStoredToken } from '@/utils/auth';

const monthNames = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

interface SettlementItem {
  _id: string;
  consignmentNumber: number;
  senderName: string;
  receiverName: string;
  paidBy: 'sender' | 'receiver';
  cost: number;
  isPaid: boolean;
  createdAt: string;
}

const MedicineSettlement: React.FC = () => {
  const { toast } = useToast();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [total, setTotal] = useState<number>(0);
  const [oclCharge, setOclCharge] = useState<string>('');
  const [settlementData, setSettlementData] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(() => {
    const ocl = Number(oclCharge) || 0;
    return total - ocl;
  }, [total, oclCharge]);

  const adminToken = getStoredToken();

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch summary (total and OCL charge)
      const summaryRes = await fetch(`/api/admin/medicine/settlements/summary?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const summaryJson = await summaryRes.json();
      if (summaryJson.success) {
        setTotal(summaryJson.data.total || 0);
        setOclCharge(String(summaryJson.data.oclCharge ?? ''));
      }

      // Fetch full settlement data
      const settlementsRes = await fetch(`/api/admin/medicine/settlements?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const settlementsJson = await settlementsRes.json();
      if (settlementsJson.success) {
        setSettlementData(settlementsJson.data || []);
      } else {
        setError(settlementsJson.message || 'Failed to fetch settlement data');
      }
    } catch (e) {
      setError('Network error while fetching data');
      toast({ title: 'Network error', description: 'Unable to fetch settlement data' });
    } finally {
      setLoading(false);
    }
  };

  const saveOclCharge = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/medicine/ocl-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ month, year, amount: Number(oclCharge) || 0 })
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Saved', description: 'OCL charge saved successfully' });
        await fetchSettlementData();
      } else {
        toast({ title: 'Save failed', description: json.message || 'Unable to save OCL charge' });
      }
    } catch (e) {
      toast({ title: 'Network error', description: 'Unable to save OCL charge' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettlementData();
  }, [month, year]);

  const yearOptions = Array.from({ length: 7 }).map((_, idx) => new Date().getFullYear() - 3 + idx);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-md">
                <Calculator className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medicine Settlement</h1>
                <p className="text-sm text-gray-600">Manage medicine settlements and OCL charges</p>
              </div>
            </div>
            <Button
              onClick={() => fetchSettlementData()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Month and Year Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Select Period</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* OCL Charge Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">OCL Charge Amount</label>
              <Input
                type="number"
                value={oclCharge}
                onChange={(e) => setOclCharge(e.target.value)}
                placeholder="Enter OCL charge"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
              />
            </div>
            <div>
              <Button 
                onClick={saveOclCharge} 
                disabled={saving || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save OCL Charge
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-gray-500">Total for {monthNames[month-1]} {year}</div>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="mt-1 text-xs text-gray-500">{settlementData.length} transactions</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-gray-500">OCL Charge</div>
              <Calculator className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">₹{(Number(oclCharge) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="mt-1 text-xs text-gray-500">Deduction amount</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-gray-500">Grand Total (after OCL)</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="mt-1 text-xs text-gray-500">Final settlement</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Settlement Details ({settlementData.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading settlement data...</span>
                </div>
              </div>
            ) : settlementData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Consignment</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Sender</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Receiver</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Payment By</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4 text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlementData.map((item) => (
                    <TableRow key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">#{item.consignmentNumber}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-500">
                        {item.senderName}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-500">
                        {item.receiverName}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant={item.paidBy === 'sender' ? 'default' : 'secondary'}
                          className={item.paidBy === 'sender' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }
                        >
                          {item.paidBy === 'sender' ? 'Sender' : 'Receiver'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        ₹{item.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot className="bg-gray-50">
                  <TableRow>
                    <TableCell colSpan={5} className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                      Grand Total:
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm font-bold text-gray-900 text-right">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </tfoot>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No settlement data</h3>
                <p className="text-gray-500">No transactions found for {monthNames[month-1]} {year}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineSettlement;
