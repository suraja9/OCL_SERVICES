import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Download,
  DollarSign,
  Clock,
  Truck,
  List,
  Calendar,
  Filter,
  X,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Invoice from './Invoice';
import { generateInvoiceHTML } from '@/utils/invoiceHtmlGenerator';
import oclLogo from "@/assets/ocl-logo.png";


interface UnpaidBill {
  _id: string;
  consignmentNumber: number;
  bookingReference: string;
  bookingDate: string;
  destination: string;
  serviceType: string;
  weight: number;
  freightCharges: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

interface UnpaidBillsSummary {
  totalBills: number;
  totalAmount: number;
  totalFreight: number;
  gstAmount: number;
}

interface SettlementSectionProps {
  isDarkMode?: boolean;
}

const SettlementSection: React.FC<SettlementSectionProps> = ({ isDarkMode = false }) => {
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBill[]>([]);
  const [unpaidBillsSummary, setUnpaidBillsSummary] = useState<UnpaidBillsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get current month and year for default values
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [corporateProfile, setCorporateProfile] = useState<any>(null);
  const { toast } = useToast();

  // Generate month and year options
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate year options (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Helper function to get start and end dates for a month
  const getMonthDateRange = (month: string, year: string) => {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    // Start date: first day of the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    // End date: last day of the month (monthNum gives us the first day of next month, so 0 gives us last day of current month)
    const endDate = new Date(yearNum, monthNum, 0);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    fetchCorporateProfile();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      fetchUnpaidBills(startDate, endDate);
    }
  }, [selectedMonth, selectedYear]);

  const fetchCorporateProfile = async () => {
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch('/api/corporate/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCorporateProfile(data.corporate);
      }
    } catch (error) {
      console.error('Error fetching corporate profile:', error);
    }
  };


  const fetchUnpaidBills = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: '1',
        limit: '1000'
      });
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      // Fetch unpaid bills with optional date filtering
      const response = await fetch(`/api/settlement/unpaid-bills?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('corporateToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnpaidBills(data.data.bills);
        setUnpaidBillsSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch unpaid bills",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const getMonthName = (monthValue: string) => {
    const month = months.find(m => m.value === monthValue);
    return month ? month.label : '';
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch('/api/settlement/download-consolidated-invoice', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('corporateToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        
        // Check if the response is actually a PDF
        if (blob.type !== 'application/pdf' && blob.size === 0) {
          throw new Error('Invalid PDF response');
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `consolidated-invoice-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Downloading consolidated invoice",
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download consolidated invoice",
        variant: "destructive"
      });
    }
  };

  const handlePrintInvoice = async () => {
    if (unpaidBills.length === 0 || !corporateProfile) {
      toast({
        title: "Print Error",
        description: "No invoice data available",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert logo to base64
      let logoBase64 = '';
      try {
        const response = await fetch(oclLogo);
        const blob = await response.blob();
        const reader = new FileReader();
        logoBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error loading logo:', error);
      }

      // Generate invoice HTML using the same generator as PDF
      const invoiceHTML = generateInvoiceHTML({
        items: unpaidBills.map(bill => ({
          _id: bill._id,
          consignmentNumber: bill.consignmentNumber,
          bookingDate: bill.bookingDate,
          serviceType: bill.serviceType,
          destination: bill.destination,
          awbNumber: bill.bookingReference,
          weight: bill.weight,
          freightCharges: bill.freightCharges,
          totalAmount: bill.totalAmount
        })),
        summary: unpaidBillsSummary || {
          totalBills: 0,
          totalAmount: 0,
          totalFreight: 0,
          gstAmount: 0
        },
        corporateName: corporateProfile?.companyName || "Corporate Client",
        corporateAddress: corporateProfile?.companyAddress || corporateProfile?.fullAddress || "Corporate Address",
        corporateGstNumber: corporateProfile?.gstNumber || "",
        corporateState: corporateProfile?.state || "",
        corporateContact: corporateProfile?.contactNumber || "",
        corporateEmail: corporateProfile?.email || "",
        billerState: "Assam",
        logoBase64: logoBase64
      });

      // Create a new window with the invoice HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Print Error",
          description: "Please allow popups to print invoice",
          variant: "destructive"
        });
        return;
      }

      printWindow.document.open();
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for all resources (especially images) to load before printing
      printWindow.onload = () => {
        // Additional delay to ensure all styles are applied
        setTimeout(() => {
          printWindow.print();
          // Don't close immediately, let user cancel if needed
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 300);
      };
      
      // Fallback in case onload doesn't fire
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Print invoice error:', error);
      toast({
        title: "Print Error",
        description: "Failed to generate print invoice",
        variant: "destructive"
      });
    }
  };




  if (loading) {
    return (
      <div className={cn(
        "min-h-screen -m-6 p-8",
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950"
          : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"
      )}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="px-4">
            <h1 className={cn(
              "text-3xl font-bold bg-clip-text text-transparent mb-1",
              isDarkMode
                ? "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                : "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
            )}>
              Statement
            </h1>
            <p className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>Manage your financial settlements and billing information</p>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className={cn(
                "animate-spin rounded-full h-10 w-10 border-3 mx-auto mb-4",
                isDarkMode
                  ? "border-purple-500/30 border-t-purple-400"
                  : "border-purple-200 border-t-purple-600"
              )}></div>
              <p className={cn(
                "font-medium",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>Loading settlement data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen -m-6 p-8",
      isDarkMode
        ? "bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950"
        : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20"
    )}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4">
          <div>
            <h1 className={cn(
              "text-3xl font-bold bg-clip-text text-transparent mb-1",
              isDarkMode
                ? "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                : "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
            )}>
              Statement
            </h1>
            <p className={cn(
              "text-sm font-medium",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>View and manage your consolidated invoice with all unpaid bills</p>
          </div>
          {unpaidBills.length > 0 && (
            <div className="flex flex-wrap gap-3 lg:ml-auto">
              <Button
                onClick={handlePrintInvoice}
                className={cn(
                  "h-11 px-6 text-white shadow-[rgba(0,0,0,0.19)_0px_10px_20px,rgba(0,0,0,0.23)_0px_6px_6px] transition-all duration-300 border-0 font-medium rounded-xl",
                  isDarkMode
                    ? "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700"
                    : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                )}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-[rgba(0,0,0,0.19)_0px_10px_20px,rgba(0,0,0,0.23)_0px_6px_6px] transition-all duration-300 border-0 font-medium rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        {/* Premium Month/Year Filter Section */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 px-4 py-0.5">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg bg-gradient-to-br border",
              isDarkMode
                ? "from-blue-500/20 to-purple-500/20 border-blue-500/30"
                : "from-blue-500/10 to-purple-500/10 border-blue-200/50"
            )}>
              <Calendar className={cn(
                "h-3.5 w-3.5",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )} />
            </div>
            <span className={cn(
              "text-xs font-semibold",
              isDarkMode ? "text-slate-300" : "text-slate-700"
            )}>Filter by Month</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-[160px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className={cn(
                  "h-9 text-xs w-full focus:outline-none rounded-lg transition-all duration-200 shadow-sm hover:shadow-md",
                  "focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode
                    ? "bg-slate-800/60 border-slate-600 text-slate-200 focus:border-blue-500"
                    : "bg-white/80 border-slate-200 focus:border-blue-400 text-slate-700"
                )}>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent className={cn(
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                )}>
                  {months.map((month) => (
                    <SelectItem 
                      key={month.value} 
                      value={month.value}
                      className={cn(
                        isDarkMode
                          ? "text-slate-200 focus:bg-slate-700"
                          : "text-slate-700 focus:bg-slate-100"
                      )}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-[120px]">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className={cn(
                  "h-9 text-xs w-full focus:outline-none rounded-lg transition-all duration-200 shadow-sm hover:shadow-md",
                  "focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode
                    ? "bg-slate-800/60 border-slate-600 text-slate-200 focus:border-blue-500"
                    : "bg-white/80 border-slate-200 focus:border-blue-400 text-slate-700"
                )}>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className={cn(
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                )}>
                  {years.map((year) => (
                    <SelectItem 
                      key={year.value} 
                      value={year.value}
                      className={cn(
                        isDarkMode
                          ? "text-slate-200 focus:bg-slate-700"
                          : "text-slate-700 focus:bg-slate-100"
                      )}
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="px-4 pb-0.5 -mt-0.5">
          <div className={cn(
            "p-3.5 border rounded-xl text-xs font-medium shadow-sm",
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-blue-700/60 text-blue-300"
              : "bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-200/60 text-blue-700"
          )}>
            <span>
              Showing invoices for: <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
            </span>
          </div>
        </div>

        {/* Premium Invoice Container */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl backdrop-blur-xl shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px] border",
          isDarkMode
            ? "bg-slate-900/70 border-slate-700/50"
            : "bg-white/70 border-white/40"
        )}>
          <div className={cn(
            "absolute inset-0",
            isDarkMode
              ? "bg-gradient-to-br from-slate-800/50 via-transparent to-slate-900/30"
              : "bg-gradient-to-br from-slate-50/50 via-transparent to-blue-50/30"
          )}></div>
          <div className="relative p-6 lg:p-8">
            {unpaidBills.length === 0 ? (
              <div className="text-center py-16">
                <div className={cn(
                  "inline-flex p-4 rounded-2xl mb-4",
                  isDarkMode
                    ? "bg-gradient-to-br from-slate-800 to-slate-900"
                    : "bg-gradient-to-br from-slate-100 to-slate-50"
                )}>
                  <Receipt className={cn(
                    "h-12 w-12",
                    isDarkMode ? "text-slate-600" : "text-slate-300"
                  )} />
                </div>
                <h3 className={cn(
                  "text-lg font-semibold mb-2",
                  isDarkMode ? "text-slate-200" : "text-slate-800"
                )}>No unpaid bills found</h3>
                <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>All your shipments have been invoiced</p>
              </div>
            ) : (
              <Invoice
                items={unpaidBills.map(bill => ({
                  _id: bill._id,
                  consignmentNumber: bill.consignmentNumber,
                  bookingDate: bill.bookingDate,
                  serviceType: bill.serviceType,
                  destination: bill.destination,
                  awbNumber: bill.bookingReference,
                  weight: bill.weight,
                  freightCharges: bill.freightCharges,
                  totalAmount: bill.totalAmount
                }))}
                summary={unpaidBillsSummary || {
                  totalBills: 0,
                  totalAmount: 0,
                  totalFreight: 0,
                  gstAmount: 0
                }}
                corporateName={corporateProfile?.companyName || "Corporate Client"}
                corporateAddress={corporateProfile?.companyAddress || "Corporate Address"}
                corporateGstNumber={corporateProfile?.gstNumber || ""}
                corporateState={corporateProfile?.state || ""}
                corporateContact={corporateProfile?.contactNumber || ""}
                corporateEmail={corporateProfile?.email || ""}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettlementSection;
