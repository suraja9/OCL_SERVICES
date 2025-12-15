import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Search, 
  Eye, 
  Edit,
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  Building2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { makePermissionAwareRequest, handleApiError } from '@/utils/apiUtils';

interface Employee {
  _id: string;
  employeeCode: string;
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  alternativePhone: string;
  dateOfBirth: string;
  designation: string;
  aadharNo: string;
  panNo: string;
  qualification: string;
  presentAddress: {
    locality: string;
    buildingFlatNo: string;
    landmark: string;
    pincode: string;
    city: string;
    state: string;
    area: string;
  };
  permanentAddress: {
    locality: string;
    buildingFlatNo: string;
    landmark: string;
    pincode: string;
    city: string;
    state: string;
    area: string;
  };
  addressType?: string;
  gst?: string;
  website?: string;
  workExperience: string;
  salary: string;
  dateOfJoining: string;
  references: Array<{
    name: string;
    relation: string;
    mobile: string;
  }>;
  photoFilePath?: string;
  cvFilePath?: string;
  documentFilePath?: string;
  aadharCardFilePath?: string;
  panCardFilePath?: string;
  createdAt: string;
  emailSent: boolean;
  emailSentAt?: string;
}

type EditableEmployeeFields = {
  name: string;
  email: string;
  phone: string;
  alternativePhone: string;
  designation: string;
  salary: string;
  workExperience: string;
  dateOfBirth: string;
  dateOfJoining: string;
  aadharNo: string;
  panNo: string;
  qualification: string;
  addressType: string;
  gst: string;
  website: string;
  locality: string;
  buildingFlatNo: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  area: string;
  permanentLocality: string;
  permanentBuildingFlatNo: string;
  permanentLandmark: string;
  permanentPincode: string;
  permanentCity: string;
  permanentState: string;
  permanentArea: string;
};

const getDefaultEditForm = (): EditableEmployeeFields => ({
  name: '',
  email: '',
  phone: '',
  alternativePhone: '',
  designation: '',
  salary: '',
  workExperience: '',
  dateOfBirth: '',
  dateOfJoining: '',
  aadharNo: '',
  panNo: '',
  qualification: '',
  addressType: '',
  gst: '',
  website: '',
  locality: '',
  buildingFlatNo: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  area: '',
  permanentLocality: '',
  permanentBuildingFlatNo: '',
  permanentLandmark: '',
  permanentPincode: '',
  permanentCity: '',
  permanentState: '',
  permanentArea: ''
});

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

const mapEmployeeToEditForm = (employee: Employee): EditableEmployeeFields => ({
  name: employee.name || '',
  email: employee.email || '',
  phone: employee.phone || '',
  alternativePhone: employee.alternativePhone || '',
  designation: employee.designation || '',
  salary: employee.salary || '',
  workExperience: employee.workExperience || '',
  dateOfBirth: formatDateForInput(employee.dateOfBirth),
  dateOfJoining: formatDateForInput(employee.dateOfJoining),
  aadharNo: employee.aadharNo || '',
  panNo: employee.panNo || '',
  qualification: employee.qualification || '',
  addressType: employee.addressType || 'present',
  gst: employee.gst || '',
  website: employee.website || '',
  locality: employee.presentAddress?.locality || '',
  buildingFlatNo: employee.presentAddress?.buildingFlatNo || '',
  landmark: employee.presentAddress?.landmark || '',
  pincode: employee.presentAddress?.pincode || '',
  city: employee.presentAddress?.city || '',
  state: employee.presentAddress?.state || '',
  area: employee.presentAddress?.area || '',
  permanentLocality: employee.permanentAddress?.locality || '',
  permanentBuildingFlatNo: employee.permanentAddress?.buildingFlatNo || '',
  permanentLandmark: employee.permanentAddress?.landmark || '',
  permanentPincode: employee.permanentAddress?.pincode || '',
  permanentCity: employee.permanentAddress?.city || '',
  permanentState: employee.permanentAddress?.state || '',
  permanentArea: employee.permanentAddress?.area || ''
});

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<EditableEmployeeFields>(getDefaultEditForm());
  const [isSaving, setIsSaving] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, [currentPage]);

  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.includes(searchTerm)
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await makePermissionAwareRequest('/employee') as { employees?: Employee[]; data?: Employee[] };
      const employeesList = data?.employees || data?.data || [];
      setEmployees(employeesList);
      setTotalPages(Math.ceil(employeesList.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching employees:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
      setError(errorMessage);
      const errorToast = handleApiError(error as Response, "Failed to fetch employees");
      toast(errorToast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedEmployee(null);
      setIsEditMode(false);
      setEditFormData(getDefaultEditForm());
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditMode(false);
  };

  const handleEditClick = (employee: Employee, event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setEditFormData(mapEmployeeToEditForm(employee));
  };

  const handleEditInputChange = (field: keyof EditableEmployeeFields, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    try {
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        alternativePhone: editFormData.alternativePhone,
        designation: editFormData.designation,
        salary: editFormData.salary,
        workExperience: editFormData.workExperience,
        dateOfBirth: editFormData.dateOfBirth,
        dateOfJoining: editFormData.dateOfJoining,
        aadharNo: editFormData.aadharNo,
        panNo: editFormData.panNo,
        qualification: editFormData.qualification,
        addressType: editFormData.addressType,
        gst: editFormData.gst,
        website: editFormData.website,
        locality: editFormData.locality,
        buildingFlatNo: editFormData.buildingFlatNo,
        landmark: editFormData.landmark,
        pincode: editFormData.pincode,
        city: editFormData.city,
        state: editFormData.state,
        area: editFormData.area,
        permanentLocality: editFormData.permanentLocality,
        permanentBuildingFlatNo: editFormData.permanentBuildingFlatNo,
        permanentLandmark: editFormData.permanentLandmark,
        permanentPincode: editFormData.permanentPincode,
        permanentCity: editFormData.permanentCity,
        permanentState: editFormData.permanentState,
        permanentArea: editFormData.permanentArea
      };

      await makePermissionAwareRequest(`/employee/${selectedEmployee._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      toast({
        title: "Employee updated",
        description: `${editFormData.name} has been updated successfully.`
      });

      await fetchEmployees();
      handleDialogOpenChange(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Failed to update employee",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (employee: Employee, event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setEmployeeToDelete(employee);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await makePermissionAwareRequest(`/employee/${employeeToDelete._id}`, {
        method: 'DELETE'
      });
      setEmployees((prev) => prev.filter((emp) => emp._id !== employeeToDelete._id));
      toast({
        title: "Employee deleted",
        description: `${employeeToDelete.name} has been removed.`
      });
      if (selectedEmployee?._id === employeeToDelete._id) {
        handleDialogOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Failed to delete employee",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-sm text-gray-600">Manage employee records and information</p>
              </div>
            </div>
            <Button
              onClick={() => fetchEmployees()}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
                  placeholder="Search employees by name, email, code, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {filteredEmployees.length} Employees
              </span>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Employees ({filteredEmployees.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Employee</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Contact</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Designation</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4">Joined</TableHead>
                  <TableHead className="font-medium text-gray-700 py-3 px-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-600">Loading employees...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="h-6 w-6 text-gray-400" />
                        <span className="text-gray-500">No employees found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee) => (
                    <TableRow 
                      key={employee._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.employeeCode}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 mt-1">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="text-sm text-gray-900">{employee.designation}</div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(employee.dateOfJoining)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeClick(employee);
                            }}
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEditClick(employee, e)}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                            title="Edit Employee"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDeleteClick(employee, e)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                            title="Delete Employee"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Simple Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Details - {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              {isEditMode ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                        <Input
                          value={editFormData.name}
                          onChange={(e) => handleEditInputChange('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Employee Code</Label>
                        <Input value={selectedEmployee.employeeCode} disabled />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <Input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditInputChange('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <Input
                          value={editFormData.phone}
                          onChange={(e) => handleEditInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Alternative Phone</Label>
                        <Input
                          value={editFormData.alternativePhone}
                          onChange={(e) => handleEditInputChange('alternativePhone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Designation</Label>
                        <Input
                          value={editFormData.designation}
                          onChange={(e) => handleEditInputChange('designation', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Work Experience</Label>
                        <Input
                          value={editFormData.workExperience}
                          onChange={(e) => handleEditInputChange('workExperience', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Salary</Label>
                        <Input
                          value={editFormData.salary}
                          onChange={(e) => handleEditInputChange('salary', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                        <Input
                          type="date"
                          value={editFormData.dateOfBirth}
                          onChange={(e) => handleEditInputChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date of Joining</Label>
                        <Input
                          type="date"
                          value={editFormData.dateOfJoining}
                          onChange={(e) => handleEditInputChange('dateOfJoining', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Identification & Additional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Aadhar No.</Label>
                        <Input
                          value={editFormData.aadharNo}
                          onChange={(e) => handleEditInputChange('aadharNo', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">PAN No.</Label>
                        <Input
                          value={editFormData.panNo}
                          onChange={(e) => handleEditInputChange('panNo', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                        <Input
                          value={editFormData.qualification}
                          onChange={(e) => handleEditInputChange('qualification', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Address Type</Label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editFormData.addressType}
                          onChange={(e) => handleEditInputChange('addressType', e.target.value)}
                        >
                          <option value="present">Present Address</option>
                          <option value="permanent">Permanent Address</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">GST</Label>
                        <Input
                          value={editFormData.gst}
                          onChange={(e) => handleEditInputChange('gst', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Website</Label>
                        <Input
                          value={editFormData.website}
                          onChange={(e) => handleEditInputChange('website', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Present Address</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Locality</Label>
                        <Input
                          value={editFormData.locality}
                          onChange={(e) => handleEditInputChange('locality', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Building/Flat No.</Label>
                        <Input
                          value={editFormData.buildingFlatNo}
                          onChange={(e) => handleEditInputChange('buildingFlatNo', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Landmark</Label>
                        <Input
                          value={editFormData.landmark}
                          onChange={(e) => handleEditInputChange('landmark', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Pincode</Label>
                        <Input
                          value={editFormData.pincode}
                          onChange={(e) => handleEditInputChange('pincode', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">City</Label>
                        <Input
                          value={editFormData.city}
                          onChange={(e) => handleEditInputChange('city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">State</Label>
                        <Input
                          value={editFormData.state}
                          onChange={(e) => handleEditInputChange('state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Area</Label>
                        <Input
                          value={editFormData.area}
                          onChange={(e) => handleEditInputChange('area', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Permanent Address</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Locality</Label>
                        <Input
                          value={editFormData.permanentLocality}
                          onChange={(e) => handleEditInputChange('permanentLocality', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Building/Flat No.</Label>
                        <Input
                          value={editFormData.permanentBuildingFlatNo}
                          onChange={(e) => handleEditInputChange('permanentBuildingFlatNo', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Landmark</Label>
                        <Input
                          value={editFormData.permanentLandmark}
                          onChange={(e) => handleEditInputChange('permanentLandmark', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Pincode</Label>
                        <Input
                          value={editFormData.permanentPincode}
                          onChange={(e) => handleEditInputChange('permanentPincode', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">City</Label>
                        <Input
                          value={editFormData.permanentCity}
                          onChange={(e) => handleEditInputChange('permanentCity', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">State</Label>
                        <Input
                          value={editFormData.permanentState}
                          onChange={(e) => handleEditInputChange('permanentState', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Area</Label>
                        <Input
                          value={editFormData.permanentArea}
                          onChange={(e) => handleEditInputChange('permanentArea', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEmployee}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Employee Code</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.employeeCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Alternative Phone</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.alternativePhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Designation</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.designation}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedEmployee.dateOfBirth)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date of Joining</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedEmployee.dateOfJoining)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Present Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Locality</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.locality}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Building/Flat No.</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.buildingFlatNo}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Landmark</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.landmark}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Pincode</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.pincode}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">City</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.city}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">State</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.state}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Area</Label>
                        <p className="text-gray-900">{selectedEmployee.presentAddress.area}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Permanent Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Locality</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.locality}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Building/Flat No.</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.buildingFlatNo}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Landmark</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.landmark}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Pincode</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.pincode}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">City</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.city}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">State</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.state}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Area</Label>
                        <p className="text-gray-900">{selectedEmployee.permanentAddress.area}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.qualification}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Work Experience</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.workExperience}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Salary</Label>
                    <p className="text-sm text-gray-900">₹{selectedEmployee.salary}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Aadhar No.</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.aadharNo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">PAN No.</Label>
                    <p className="text-sm text-gray-900">{selectedEmployee.panNo}</p>
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              {selectedEmployee.references && selectedEmployee.references.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.references.map((ref, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Name</Label>
                              <p className="text-gray-900">{ref.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Relation</Label>
                              <p className="text-gray-900">{ref.relation}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Mobile</Label>
                              <p className="text-gray-900">{ref.mobile}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEmployee.photoFilePath && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Photo</Label>
                        <div className="mt-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEmployee.photoFilePath} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              View Photo
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedEmployee.cvFilePath && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">CV</Label>
                        <div className="mt-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEmployee.cvFilePath} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              View CV
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedEmployee.aadharCardFilePath && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Aadhar Card</Label>
                        <div className="mt-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEmployee.aadharCardFilePath} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              View Aadhar
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedEmployee.panCardFilePath && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">PAN Card</Label>
                        <div className="mt-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEmployee.panCardFilePath} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              View PAN
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => {
        if (!open) {
          setEmployeeToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete?.name}? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeManagement;
