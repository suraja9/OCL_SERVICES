import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Eye, 
  Edit, 
  Building2, 
  Calendar, 
  DollarSign,
  ArrowLeft,
  Save,
  X,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Invoice from '@/components/corporate/Invoice';

interface Corporate {
  _id: string;
  corporateId: string;
  companyName: string;
  email: string;
  contactNumber: string;
  registrationDate: string;
  isActive: boolean;
  companyAddress?: string;
  gstNumber?: string;
  state?: string;
}

interface InvoiceItem {
  _id: string;
  consignmentNumber: string;
  bookingDate: string;
  origin: string;
  destination: string;
  serviceType: string;
  weight: number;
  freightCharges: number;
  fuelSurcharge?: number;
  cgst?: number;
  sgst?: number;
  totalAmount: number;
}

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  corporateId: string;
  companyName: string;
  companyAddress: string;
  gstNumber: string;
  state: string;
  contactNumber: string;
  email: string;
  invoiceDate: string;
  invoicePeriod: {
    startDate: string;
    endDate: string;
  };
  shipments: InvoiceItem[];
  subtotal: number;
  fuelSurchargeTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  remarks?: string;
}

const InvoiceManagement = () => {
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InvoiceData>>({});
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCorporates();
  }, []);

  const fetchCorporates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/corporates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCorporates(data.corporates || []);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch corporate list';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching corporates:', error);
      const errorMessage = 'Network error while loading corporates';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (corporateId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      console.log('Fetching consolidated invoice for corporateId:', corporateId);
      const response = await fetch(`/api/settlement/admin/consolidated-invoice?corporateId=${corporateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched consolidated invoice data:', data);
        
        if (data.data.consolidatedInvoice) {
          console.log('Number of consignments in consolidated invoice:', data.data.consolidatedInvoice.shipments?.length || 0);
          // Set as single invoice in array
          setInvoices([data.data.consolidatedInvoice]);
        } else {
          console.log('No consolidated invoice found');
          setInvoices([]);
        }
      } else {
        console.error('Failed to fetch consolidated invoice, response:', response);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        toast({
          title: "Error",
          description: `Failed to fetch consolidated invoice: ${errorData.error || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching consolidated invoice:', error);
      toast({
        title: "Error",
        description: "Failed to fetch consolidated invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCorporateClick = (corporate: Corporate) => {
    setSelectedCorporate(corporate);
    fetchInvoices(corporate._id);
  };

  // Auto-open the invoice when it's loaded (only if dialog is not already closed by user)
  useEffect(() => {
    if (invoices.length > 0 && !showInvoiceDialog && !selectedInvoice) {
      setSelectedInvoice(invoices[0]);
      setShowInvoiceDialog(true);
    }
  }, [invoices, showInvoiceDialog, selectedInvoice]);

  const handleViewInvoice = (invoice: InvoiceData) => {
    console.log('Viewing invoice:', invoice);
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  const handleCloseInvoiceDialog = () => {
    setShowInvoiceDialog(false);
    // Don't reset selectedInvoice here - keep it so we can show the table view
  };

  const handleEditInvoice = (invoice: InvoiceData) => {
    setEditingInvoice(invoice);
    setEditFormData({
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paymentReference: invoice.paymentReference,
      remarks: invoice.remarks
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/invoices/${editingInvoice._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
        setShowEditDialog(false);
        setEditingInvoice(null);
        setEditFormData({});
        
        // Refresh invoices if we have a selected corporate
        if (selectedCorporate) {
          fetchInvoices(selectedCorporate._id);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update invoice",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>
          </div>
        );
      case 'overdue':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Unpaid</Badge>
          </div>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const filteredCorporates = corporates.filter(corporate =>
    corporate.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corporate.corporateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corporate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert invoice data to the format expected by the Invoice component
  const convertToInvoiceFormat = (invoice: InvoiceData) => {
    console.log('Converting invoice data:', invoice);
    
    // Ensure we have shipments data
    if (!invoice.shipments || !Array.isArray(invoice.shipments)) {
      console.error('No shipments data found in invoice:', invoice);
      return null;
    }
    
    const items = invoice.shipments.map(shipment => ({
      _id: shipment._id || 'unknown',
      consignmentNumber: parseInt(shipment.consignmentNumber) || 0,
      bookingDate: shipment.bookingDate || new Date().toISOString(),
      serviceType: shipment.serviceType || 'NON-DOX',
      destination: shipment.destination || 'Unknown',
      awbNumber: shipment.awbNumber || '-',
      weight: shipment.weight || 0,
      freightCharges: shipment.freightCharges || 0,
      totalAmount: shipment.totalAmount || 0
    }));

    const summary = {
      totalBills: invoice.shipments.length,
      totalAmount: invoice.grandTotal || 0,
      totalFreight: invoice.subtotal || 0,
      gstAmount: (invoice.cgstTotal || 0) + (invoice.sgstTotal || 0)
    };

    const convertedData = {
      items,
      summary,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      invoiceDate: invoice.invoiceDate ? formatDate(invoice.invoiceDate) : formatDate(new Date().toISOString()),
      invoicePeriod: invoice.invoicePeriod 
        ? `${formatDate(invoice.invoicePeriod.startDate)} to ${formatDate(invoice.invoicePeriod.endDate)}`
        : formatDate(new Date().toISOString()),
      corporateName: invoice.companyName || 'Unknown Company',
      corporateAddress: invoice.companyAddress || 'Unknown Address',
      corporateGstNumber: invoice.gstNumber || '',
      corporateState: invoice.state || 'Unknown',
      corporateContact: invoice.contactNumber || '',
      corporateEmail: invoice.email || '',
      billerState: "Assam"
    };

    console.log('Converted invoice data:', convertedData);
    return convertedData;
  };

  if (selectedCorporate) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header with back button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCorporate(null)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="p-2 bg-blue-100 rounded-md">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                  <p className="text-sm text-gray-600">{selectedCorporate.companyName} - {selectedCorporate.corporateId}</p>
                </div>
              </div>
              <Button
                onClick={() => fetchInvoices(selectedCorporate._id)}
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

          {/* Consolidated Invoice Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800">
                  Consolidated Invoice ({invoices.length > 0 ? invoices[0].shipments?.length || 0 : 0} consignments)
                </h3>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading consolidated invoice...</span>
                  </div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No unpaid consignments found for this corporate</p>
                  <p className="text-sm">This corporate has no unpaid consignments yet.</p>
                </div>
              ) : (
              <div>
                {!showInvoiceDialog ? (
                  // Show table view when dialog is closed
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Invoice No.</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Date</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Period</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Consignments</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Total Amount</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                          <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <TableCell className="py-3 px-4 font-medium text-gray-900">{invoice.invoiceNumber}</TableCell>
                            <TableCell className="py-3 px-4 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</TableCell>
                            <TableCell className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(invoice.invoicePeriod.startDate)} - {formatDate(invoice.invoicePeriod.endDate)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-sm text-gray-900">{invoice.shipments?.length || 0}</TableCell>
                            <TableCell className="py-3 px-4 font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</TableCell>
                            <TableCell className="py-3 px-4">{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewInvoice(invoice)}
                                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                                  title="View Invoice"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="h-7 w-7 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                                  title="Edit Invoice"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Show summary card when dialog is open
                  <div className="space-y-4">
                    {/* Invoice Summary Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                          <p className="font-medium text-gray-900">{invoices[0].invoiceNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="font-medium text-gray-900">{formatDate(invoices[0].invoiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Consignments</p>
                          <p className="font-medium text-gray-900">{invoices[0].shipments?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="font-medium text-lg text-gray-900">{formatCurrency(invoices[0].grandTotal)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getStatusBadge(invoices[0].status)}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handleViewInvoice(invoices[0])}
                            className="border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Invoice
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEditInvoice(invoices[0])}
                            className="border-gray-300 hover:bg-green-50 hover:border-green-300"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Auto-open message */}
                    <div className="text-center text-sm text-gray-500">
                      <p>Invoice will open automatically when loaded...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Invoice View Dialog */}
          <Dialog open={showInvoiceDialog} onOpenChange={handleCloseInvoiceDialog}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-50">
              <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">Invoice Details</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {selectedInvoice ? (
                  (() => {
                    try {
                      const invoiceData = convertToInvoiceFormat(selectedInvoice);
                      if (!invoiceData) {
                        return (
                          <div className="p-4 text-center text-red-600">
                            <p>Invalid invoice data</p>
                            <p className="text-sm text-gray-500 mt-2">
                              The invoice data is missing required fields
                            </p>
                          </div>
                        );
                      }
                      return <Invoice {...invoiceData} />;
                    } catch (error) {
                      console.error('Error rendering invoice:', error);
                      return (
                        <div className="p-4 text-center text-red-600">
                          <p>Error loading invoice details</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Please check the console for more details
                          </p>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No invoice selected
                  </div>
                )}
              </div>
          </DialogContent>
        </Dialog>

          {/* Edit Invoice Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-gray-50">
              <DialogHeader className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-md">
                    <Edit className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">Edit Invoice</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    value={editFormData.paymentMethod || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Reference</label>
                  <Input
                    value={editFormData.paymentReference || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                    placeholder="Enter payment reference"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Remarks</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    value={editFormData.remarks || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Enter remarks"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                <p className="text-sm text-gray-600">Select a corporate to view and manage their invoices</p>
              </div>
            </div>
            <Button
              onClick={() => fetchCorporates()}
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

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search corporates by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {filteredCorporates.filter(c => c.isActive).length} Active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {filteredCorporates.filter(c => !c.isActive).length} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Corporates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Corporate List ({filteredCorporates.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading corporates...</span>
                </div>
              </div>
            ) : filteredCorporates.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-6 w-6 text-gray-400" />
                  <span className="text-gray-500">No corporates found</span>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Corporate ID</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Company Name</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Email</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Contact</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Registration Date</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4">Status</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCorporates.map((corporate) => (
                    <TableRow key={corporate._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4 font-medium text-gray-900">{corporate.corporateId}</TableCell>
                      <TableCell className="py-3 px-4 text-gray-900">{corporate.companyName}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600">{corporate.email}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600">{corporate.contactNumber}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600">{formatDate(corporate.registrationDate)}</TableCell>
                      <TableCell className="py-3 px-4">
                        {corporate.isActive ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCorporateClick(corporate)}
                            className="h-7 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all rounded-md flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Invoices
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
