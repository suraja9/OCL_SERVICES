import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicineSidebar from '../../components/medicine/MedicineSidebar';
import { 
  Package, 
  Truck,
  Calendar,
  Send,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Phone,
  Warehouse,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface MedicineUserInfo {
  id: string;
  name: string;
  email: string;
}

interface Coloader {
  _id: string;
  phoneNumber: string;
  busNumber: string;
  name?: string;
  isActive: boolean;
}

// Add this interface for file upload
interface UploadedFile {
  name: string;
  url: string;
}

interface ManifestConsignment {
  bookingId: {
    _id: string;
    consignmentNumber: number;
    origin: {
      city: string;
      state: string;
    };
    destination: {
      city: string;
      state: string;
    };
    shipment?: {
      chargeableWeight?: number;
      actualWeight?: string;
    };
    package?: {
      totalPackages?: string;
    };
    createdAt: string;
  };
  consignmentNumber: number;
}

interface Manifest {
  _id: string;
  manifestNumber: string;
  path: string;
  totalCount: number;
  status: 'submitted' | 'dispatched' | 'delivered';
  consignments: ManifestConsignment[];
  createdAt: string;
  coloaderId?: Coloader;
  contentDescription?: string;
  coloaderDocketNo?: string;
  dispatchedAt?: string;
}

const MedicineManifest: React.FC = () => {
  const [user, setUser] = useState<MedicineUserInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [coloaders, setColoaders] = useState<Coloader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddColoader, setShowAddColoader] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [dispatchFormData, setDispatchFormData] = useState({
    contentDescription: '',
    coloaderId: '',
    coloaderDocketNo: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // Add this state for uploaded files
  const [newColoaderData, setNewColoaderData] = useState({
    phoneNumber: '',
    busNumber: '',
    name: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('medicineToken');
    const info = localStorage.getItem('medicineInfo');
    if (!token || !info) {
      navigate('/medicine');
      return;
    }
    try {
      setUser(JSON.parse(info));
    } catch {
      navigate('/medicine');
      return;
    }
  }, [navigate]);

  // Fetch manifests and coloaders
  useEffect(() => {
    fetchManifests();
    fetchColoaders();
  }, []);

  const fetchManifests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('medicineToken');
      const response = await axios.get(`${API_BASE}/api/medicine/manifests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setManifests(response.data.data || []);
      } else {
        setError('Failed to fetch manifests');
      }
    } catch (error: any) {
      console.error('Error fetching manifests:', error);
      setError(error.response?.data?.message || 'Failed to fetch manifests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColoaders = async () => {
    try {
      const token = localStorage.getItem('medicineToken');
      const response = await axios.get(`${API_BASE}/api/medicine/coloaders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setColoaders(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching coloaders:', error);
    }
  };

  // Calculate totals for a manifest
  const calculateManifestTotals = (manifest: Manifest) => {
    return manifest.consignments.reduce(
      (totals, consignment) => {
        const booking = consignment.bookingId;
        const weight = (booking?.shipment?.chargeableWeight as number) || 
                      parseFloat(booking?.shipment?.actualWeight || '0') || 0;
        const units = parseInt(booking?.package?.totalPackages || '0', 10) || 0;
        
        return {
          totalWeight: totals.totalWeight + weight,
          totalUnits: totals.totalUnits + units
        };
      },
      { totalWeight: 0, totalUnits: 0 }
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle dispatch all button click
  const handleDispatchAllClick = () => {
    if (manifests.length === 0) {
      toast({
        title: 'No Manifests',
        description: 'No manifests available to dispatch',
        variant: 'destructive'
      });
      return;
    }
    setShowDispatchForm(true);
    setDispatchFormData({
      contentDescription: '',
      coloaderId: '',
      coloaderDocketNo: ''
    });
    setFormError(null);
  };

  // Handle form submission - dispatch all manifests
  const handleDispatchSubmit = async () => {
    if (!dispatchFormData.coloaderId) {
      setFormError('Please select a coloader');
      return;
    }

    if (manifests.length === 0) {
      setFormError('No manifests to dispatch');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const token = localStorage.getItem('medicineToken');
      
      // Dispatch all manifests
      const dispatchPromises = manifests.map(manifest =>
        axios.post(
          `${API_BASE}/api/medicine/manifests/${manifest._id}/dispatch`,
          {
            coloaderId: dispatchFormData.coloaderId,
            contentDescription: dispatchFormData.contentDescription,
            coloaderDocketNo: dispatchFormData.coloaderDocketNo
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      const results = await Promise.allSettled(dispatchPromises);
      
      // Count successful and failed dispatches
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.data.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.data.success)).length;

      if (successful > 0) {
        // Show success animation
        setShowSuccessAnimation(true);
        
        // Close the form after a delay
        setTimeout(() => {
          setShowDispatchForm(false);
          setShowSuccessAnimation(false);
          setDispatchFormData({
            contentDescription: '',
            coloaderId: '',
            coloaderDocketNo: ''
          });
          
          // Refresh manifests
          fetchManifests();
        }, 2000);
      } else {
        const firstError = results.find(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.data.success));
        const errorMessage = firstError?.status === 'rejected' 
          ? firstError.reason?.response?.data?.message || 'Failed to dispatch manifests'
          : firstError?.status === 'fulfilled' 
            ? firstError.value.data.message || 'Failed to dispatch manifests'
            : 'Failed to dispatch manifests';
        setFormError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error dispatching manifests:', error);
      setFormError(error.response?.data?.message || 'Failed to dispatch manifests');
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to dispatch manifests',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add new coloader
  const handleAddColoader = async () => {
    if (!newColoaderData.phoneNumber.trim() || !newColoaderData.busNumber.trim() || !newColoaderData.name.trim()) {
      setFormError('Name, phone number and bus number are required');
      return;
    }

    if (!/^\d{10}$/.test(newColoaderData.phoneNumber)) {
      setFormError('Phone number must be exactly 10 digits');
      return;
    }

    try {
      const token = localStorage.getItem('medicineToken');
      const response = await axios.post(
        `${API_BASE}/api/medicine/coloaders`,
        {
          phoneNumber: newColoaderData.phoneNumber.trim(),
          busNumber: newColoaderData.busNumber.trim(),
          name: newColoaderData.name.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Add to coloaders list
        // Refresh the coloaders list to ensure all data is properly populated
        fetchColoaders();
        // Select the new coloader
        setDispatchFormData(prev => ({
          ...prev,
          coloaderId: response.data.data._id
        }));
        // Close add coloader form
        setShowAddColoader(false);
        setNewColoaderData({ phoneNumber: '', busNumber: '', name: '' });
        setFormError(null);
        
        toast({
          title: 'Coloader Added',
          description: 'New coloader added successfully'
        });
      }
    } catch (error: any) {
      console.error('Error adding coloader:', error);
      setFormError(error.response?.data?.message || 'Failed to add coloader');
    }
  };

  // Close dispatch form
  const closeDispatchForm = () => {
    setShowDispatchForm(false);
    setDispatchFormData({
      contentDescription: '',
      coloaderId: '',
      coloaderDocketNo: ''
    });
    setShowAddColoader(false);
    setNewColoaderData({ phoneNumber: '', busNumber: '', name: '' });
    setFormError(null);
  };

  // Calculate total consignments across all manifests
  const getTotalConsignments = () => {
    return manifests.reduce((total, manifest) => total + manifest.totalCount, 0);
  };

  // Get the earliest booking date from a manifest
  const getEarliestBookingDate = (manifest: Manifest): string => {
    if (!manifest.consignments || manifest.consignments.length === 0) return '';
    const dates = manifest.consignments
      .map(c => c.bookingId?.createdAt)
      .filter((date): date is string => date !== undefined && date !== null);
    if (dates.length === 0) return '';
    
    return dates.reduce((earliest, current) => {
      const earliestDate = new Date(earliest);
      const currentDate = new Date(current);
      return currentDate < earliestDate ? current : earliest;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    navigate('/medicine');
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout} 
      />
      <main className={`${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-80 w-[calc(100vw-20rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`}>
        <div className="space-y-6 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Ready to Dispatch</h1>
              <p className="text-sm text-gray-500 mt-1">View all submitted manifests ready for dispatch</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Manifests List */}
              {manifests.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Package className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Manifests Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        No submitted manifests found. Submit manifests from the "Scan Consignment" section.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {manifests.map((manifest) => {
                    const totals = calculateManifestTotals(manifest);
                    return (
                      <Card key={manifest._id} className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <CardHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-800">
                                  Manifest {manifest.manifestNumber}
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  {manifest.path} • Created: {formatDate(manifest.createdAt)}
                                </p>
                                {/* Show earliest booking date if available */}
                                {manifest.consignments && manifest.consignments.length > 0 && getEarliestBookingDate(manifest) && (
                                  <p className="text-sm text-gray-600">
                                    Booking Date: {formatDate(getEarliestBookingDate(manifest))}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1.5">
                                <span className="font-medium">{manifest.totalCount}</span>
                                <span className="ml-1">Consignments</span>
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                              <thead className="bg-gray-50">
                                <tr className="text-left text-xs text-gray-600">
                                  <th className="px-4 py-3 border-b">Sr. No</th>
                                  <th className="px-4 py-3 border-b">AWB / Docket No</th>
                                  <th className="px-4 py-3 border-b">Destination</th>
                                  <th className="px-4 py-3 border-b text-center">Units</th>
                                  <th className="px-4 py-3 border-b text-right">Weight (Kg)</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {manifest.consignments.map((consignment, idx) => {
                                  const booking = consignment.bookingId;
                                  const weight = (booking?.shipment?.chargeableWeight as number) || 
                                               parseFloat(booking?.shipment?.actualWeight || '0') || 0;
                                  const units = parseInt(booking?.package?.totalPackages || '0', 10) || 0;
                                  return (
                                    <tr key={consignment.bookingId._id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700 font-medium">{idx + 1}</td>
                                      <td className="px-4 py-3 border-b border-gray-100 font-semibold text-blue-600">
                                        {consignment.consignmentNumber}
                                      </td>
                                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4 text-gray-400" />
                                          <span>{booking.destination.city}, {booking.destination.state}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700 text-center">
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                          {units || '-'}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 border-b border-gray-100 text-gray-700 text-right font-medium">
                                        {weight ? `${weight.toFixed(2)} kg` : '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td className="px-4 py-3 border-t border-gray-200 font-semibold text-gray-800" colSpan={3}>
                                    <div className="flex items-center gap-2">
                                      <span>Total</span>
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {manifest.totalCount} Consignments
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 border-t border-gray-200 font-semibold text-gray-800 text-center">
                                    {totals.totalUnits}
                                  </td>
                                  <td className="px-4 py-3 border-t border-gray-200 font-semibold text-gray-800 text-right">
                                    {totals.totalWeight.toFixed(2)} Kg
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {/* Dispatch All Button at Bottom */}
              {manifests.length > 0 && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleDispatchAllClick}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 text-lg"
                    size="lg"
                  >
                    <Send className="h-5 w-5" />
                    Dispatch
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Dispatch Form Modal */}
      {showDispatchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {showSuccessAnimation ? (
              <ForwardSuccessAnimation />
            ) : (
                <>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Forward Manifests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Forwarding {manifests.length} manifest{manifests.length > 1 ? 's' : ''} with {getTotalConsignments()} total consignment{getTotalConsignments() > 1 ? 's' : ''}
                </p>
              </div>
              <button 
                onClick={closeDispatchForm}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}
              
              <div>
                <FloatingLabelTextarea
                  id="contentDescription"
                  value={dispatchFormData.contentDescription}
                  onChange={(value) => setDispatchFormData(prev => ({ ...prev, contentDescription: value }))}
                  placeholder="Content Description"
                  rows={3}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <FloatingLabelInput
                  id="coloaderDocketNo"
                  value={dispatchFormData.coloaderDocketNo}
                  onChange={(value) => setDispatchFormData(prev => ({ ...prev, coloaderDocketNo: value }))}
                  placeholder="Co-Loader Docket No."
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Upload Document Field - Only show when coloaderDocketNo is entered */}
              {dispatchFormData.coloaderDocketNo && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real implementation, you would upload the file to a server
                        // For now, we'll just store the file name as a placeholder
                        const newFile: UploadedFile = {
                          name: file.name,
                          url: URL.createObjectURL(file)
                        };
                        setUploadedFiles(prev => [...prev, newFile]);
                        // Reset the file input
                        e.target.value = '';
                      }
                    }}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-500">Uploaded files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="coloaderId" className="block text-sm font-medium text-gray-700 mb-1">
                  Coloader (Bus Number) <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    id="coloaderId"
                    value={dispatchFormData.coloaderId}
                    onChange={(e) => {
                      setDispatchFormData(prev => ({ ...prev, coloaderId: e.target.value }));
                      setFormError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Coloader</option>
                    {coloaders.map((coloader) => (
                      <option key={coloader._id} value={coloader._id}>
                        {coloader.name ? coloader.name : 'Coloader'} - {coloader.busNumber} - {coloader.phoneNumber}
                      </option>
                    ))}
                  </select>
                  
                  {!showAddColoader ? (
                    <button
                      type="button"
                      onClick={() => setShowAddColoader(true)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 w-full"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Coloader
                    </button>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Add New Coloader</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddColoader(false);
                            setNewColoaderData({ phoneNumber: '', busNumber: '', name: '' });
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={newColoaderData.name}
                          onChange={(e) => setNewColoaderData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter coloader name"
                          className="w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="tel"
                          value={newColoaderData.phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setNewColoaderData(prev => ({ ...prev, phoneNumber: value }));
                          }}
                          placeholder="Enter 10-digit phone number"
                          maxLength={10}
                          className="w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bus Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={newColoaderData.busNumber}
                          onChange={(e) => setNewColoaderData(prev => ({ ...prev, busNumber: e.target.value }))}
                          placeholder="Enter bus number"
                          className="w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddColoader}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting || !newColoaderData.phoneNumber || !newColoaderData.busNumber || !newColoaderData.name}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Coloader
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={closeDispatchForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDispatchSubmit}
                  disabled={!dispatchFormData.coloaderId || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Forwarding...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Forward ({manifests.length} manifest{manifests.length > 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              </div>
            </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineManifest;

// Floating Label Textarea Component
interface FloatingLabelTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  required?: boolean;
  rows?: number;
}

const FloatingLabelTextarea: React.FC<FloatingLabelTextareaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  className = "",
  required = false,
  rows = 3
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={rows}
        className={`${className} text-sm text-gray-700`}
        placeholder=""
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
          isFloating
            ? 'left-3 -top-2 text-xs bg-white px-1 text-blue-600 font-medium'
            : 'left-3 top-3 text-gray-500 text-sm'
        }`}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </Label>
    </div>
  );
};

// Floating Label Input Component
interface FloatingLabelInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  className = "",
  required = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`${className} text-sm text-gray-700`}
        placeholder=""
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
          isFloating
            ? 'left-3 -top-2 text-xs bg-white px-1 text-blue-600 font-medium'
            : 'left-3 top-3 text-gray-500 text-sm'
        }`}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </Label>
    </div>
  );
};

const ForwardSuccessAnimation: React.FC = () => {
  return (
    <div className="success-animation-overlay">
      <div className="success-animation-wrapper">
        <div className="success-animation-circle">
          <div className="success-animation-ring" />
          <svg
            className="success-animation-check"
            viewBox="0 0 52 52"
            aria-hidden="true"
          >
            <circle className="success-animation-check-circle" cx="26" cy="26" r="25" />
            <path
              className="success-animation-check-mark"
              fill="none"
              d="M16 26.5 22.5 33l13-13"
            />
          </svg>
        </div>
        <div className="success-animation-text">
          <p className="success-animation-heading">Successfully Forwarded</p>
          <p className="success-animation-subtext">
            Manifests have been forwarded successfully
          </p>
        </div>
      </div>
    </div>
  );
};
