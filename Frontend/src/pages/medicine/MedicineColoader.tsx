import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicineSidebar from '@/components/medicine/MedicineSidebar';
import { 
  Warehouse, 
  Plus, 
  Phone, 
  Truck,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
  Package
} from 'lucide-react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Floating Label Input Component
interface FloatingLabelInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  className = "",
  error,
  required = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => {
            if (type === 'tel') {
              // Only allow digits for mobile numbers
              const numericValue = e.target.value.replace(/\D/g, '');
              onChange(numericValue);
            } else {
              onChange(e.target.value);
            }
          }}
          onFocus={(e) => {
            setIsFocused(true);
            if (!error) {
              e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px';
            }
          }}
          onBlur={(e) => {
            setIsFocused(false);
            e.currentTarget.style.boxShadow = '';
          }}
          onKeyDown={(e) => {
            if (type === 'tel') {
              // Prevent non-numeric keys (except backspace, delete, tab, arrow keys, etc.)
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
              if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
              }
            }
          }}
          maxLength={maxLength}
          disabled={disabled}
          className={`
            ${error ? 'border-red-500 ring-2 ring-red-200' : ''} 
            ${!error && isFocused ? 'border-blue-400 ring-2 ring-blue-200/50' : ''}
            ${!error && !isFocused ? 'border-gray-300/60 hover:border-blue-400/50' : ''}
            focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
            transition-all duration-200 ease-in-out
            ${className}
          `}
          onMouseEnter={(e) => {
            if (!error && !isFocused && !disabled) {
              e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px';
            }
          }}
          onMouseLeave={(e) => {
            if (!error && !isFocused) {
              e.currentTarget.style.boxShadow = '';
            }
          }}
          placeholder=""
        />
        <Label
          htmlFor={id}
          className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none font-['Calibri'] ${
            isFloating
              ? 'left-3 -top-2 text-xs bg-white px-1 text-blue-600 font-medium'
              : 'left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
          }`}
        >
          {placeholder} {required && <span className="text-red-500">*</span>}
        </Label>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

interface MedicineUserInfo {
  id: string;
  email: string;
  name: string;
}

interface Coloader {
  _id: string;
  name?: string;
  phoneNumber: string;
  busNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  medicineUserId?: {
    name: string;
    email: string;
  };
}

const MedicineColoader: React.FC = () => {
  const [user, setUser] = useState<MedicineUserInfo | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [coloaders, setColoaders] = useState<Coloader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    busNumber: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
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

  // Fetch coloaders
  useEffect(() => {
    fetchColoaders();
  }, []);

  const fetchColoaders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('medicineToken');
      const response = await axios.get(`${API_BASE}/api/medicine/coloaders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setColoaders(response.data.data || []);
      } else {
        setError('Failed to fetch coloaders');
      }
    } catch (error: any) {
      console.error('Error fetching coloaders:', error);
      setError(error.response?.data?.message || 'Failed to fetch coloaders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medicineToken');
    localStorage.removeItem('medicineInfo');
    navigate('/medicine');
  };

  const handleAddClick = () => {
    setShowAddDialog(true);
    setFormData({ name: '', phoneNumber: '', busNumber: '' });
    setFormError(null);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setFormData({ name: '', phoneNumber: '', busNumber: '' });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.phoneNumber.trim()) {
      setFormError('Phone number is required');
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      setFormError('Phone number must be exactly 10 digits');
      return;
    }

    if (!formData.busNumber.trim()) {
      setFormError('Bus number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('medicineToken');
      const response = await axios.post(
        `${API_BASE}/api/medicine/coloaders`,
        {
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          busNumber: formData.busNumber.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Refresh the list
        await fetchColoaders();
        handleCloseDialog();
      } else {
        setFormError(response.data.message || 'Failed to add coloader');
      }
    } catch (error: any) {
      console.error('Error adding coloader:', error);
      setFormError(error.response?.data?.message || 'Failed to add coloader');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coloader?')) {
      return;
    }

    try {
      const token = localStorage.getItem('medicineToken');
      await axios.delete(`${API_BASE}/api/medicine/coloaders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh the list
      await fetchColoaders();
    } catch (error: any) {
      console.error('Error deleting coloader:', error);
      alert(error.response?.data?.message || 'Failed to delete coloader');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      <MedicineSidebar 
        user={user} 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout} 
      />
      <main className={`${isSidebarCollapsed ? 'ml-16 w-[calc(100vw-4rem)]' : 'ml-64 w-[calc(100vw-16rem)]'} h-screen overflow-y-auto p-6 transition-all duration-300 ease-in-out`}>
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.08)] border border-gray-100 p-6 min-h-[calc(100vh-3rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Package className="h-5 w-5 text-blue-600" />
              Coloaders - {coloaders.length}
            </h2>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Coloader
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
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
              
              <div className="relative z-10">
                {/* Coloaders Table */}
                {coloaders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-gradient-to-r from-blue-200/40 via-purple-200/30 to-indigo-200/40"></div>
                      <Warehouse className="h-10 w-10 relative z-10 text-gray-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-600">No coloaders found</span>
                    <p className="text-gray-400 text-sm mt-2">Click "Add Coloader" to add your first coloader</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto relative">
                    {/* Premium table shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>
                    <Table className="relative w-full table-fixed" style={{ paddingRight: 0 }}>
                      <TableHeader>
                        <TableRow className="bg-blue-600 border-b hover:bg-blue-600">
                          <TableHead className="text-xs font-bold py-2 px-4 tracking-wide text-white w-[8%] hover:bg-transparent">S.No</TableHead>
                          <TableHead className="text-xs font-bold py-2 px-4 tracking-wide text-white w-[20%] hover:bg-transparent">Name</TableHead>
                          <TableHead className="text-xs font-bold py-2 px-4 tracking-wide text-white w-[18%] hover:bg-transparent">Phone Number</TableHead>
                          <TableHead className="text-xs font-bold py-2 px-4 tracking-wide text-white w-[18%] hover:bg-transparent">Bus Number</TableHead>
                          <TableHead className="text-xs font-bold py-2 px-4 tracking-wide text-white w-[20%] hover:bg-transparent">Created At</TableHead>
                          <TableHead className="text-xs font-bold py-2 pl-4 !pr-0 tracking-wide text-white w-[16%] hover:bg-transparent" style={{ paddingRight: '0 !important' }}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coloaders.map((coloader, index) => {
                          const isEven = index % 2 === 0;
                          return (
                            <TableRow 
                              key={coloader._id} 
                              className={cn(
                                "h-10 border-b",
                                isEven
                                  ? "bg-white border-gray-200"
                                  : "bg-gray-100 border-gray-200"
                              )}
                            >
                              <TableCell className="text-sm py-2 px-4 text-gray-900">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-sm py-2 px-4 text-gray-900">
                                {coloader.name || 'N/A'}
                              </TableCell>
                              <TableCell className="py-2 px-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {coloader.phoneNumber}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Truck className="h-4 w-4 text-gray-400" />
                                  {coloader.busNumber}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs py-2 px-4 text-gray-600">
                                {new Date(coloader.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="py-2 pl-4 !pr-0" style={{ paddingRight: '0 !important' }}>
                                <button
                                  onClick={() => handleDelete(coloader._id)}
                                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Coloader Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Coloader</h3>
              <button 
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <FloatingLabelInput
                id="name"
                value={formData.name}
                onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                placeholder="Name"
                className="font-['Calibri']"
                disabled={isSubmitting}
              />

              <FloatingLabelInput
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, phoneNumber: value }))}
                placeholder="Phone Number"
                type="tel"
                maxLength={10}
                className="font-['Calibri']"
                required
                disabled={isSubmitting}
              />

              <FloatingLabelInput
                id="busNumber"
                value={formData.busNumber}
                onChange={(value) => setFormData(prev => ({ ...prev, busNumber: value }))}
                placeholder="Bus Number (Coloader)"
                className="font-['Calibri']"
                required
                disabled={isSubmitting}
              />

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Add Coloader
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineColoader;
