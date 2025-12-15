import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/contexts/UserAuthContext";
import UserLogin from "./UserLogin";
import {
  Package,
  MapPin,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Building,
  FileText,
  Weight,
  Ruler,
  Shield,
  DollarSign,
  Image as ImageIcon,
  Globe,
  Gift,
  Heart,
  Lock,
  Download,
  Printer,
  X
} from "lucide-react";

interface ContactSupportProps {
  isDarkMode: boolean;
}

interface Booking {
  _id: string;
  bookingReference: string;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  paymentStatus?: "paid" | "unpaid";
  origin: {
    name: string;
    mobileNumber: string;
    email?: string;
    companyName?: string;
    flatBuilding?: string;
    locality: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district: string;
    state: string;
    gstNumber?: string;
    alternateNumbers?: string[];
    addressType?: string;
    birthday?: string;
    anniversary?: string;
    website?: string;
    otherAlternateNumber?: string;
  };
  destination: {
    name: string;
    mobileNumber: string;
    email?: string;
    companyName?: string;
    flatBuilding?: string;
    locality: string;
    landmark?: string;
    pincode: string;
    area?: string;
    city: string;
    district: string;
    state: string;
    gstNumber?: string;
    alternateNumbers?: string[];
    addressType?: string;
    birthday?: string;
    anniversary?: string;
    website?: string;
    otherAlternateNumber?: string;
  };
  shipment: {
    natureOfConsignment: string;
    insurance: string;
    riskCoverage: string;
    packagesCount: string;
    materials?: string;
    others?: string;
    description?: string;
    declaredValue?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    insuranceCompanyName?: string;
    insurancePolicyNumber?: string;
    insurancePolicyDate?: string;
    insuranceValidUpto?: string;
    insurancePremiumAmount?: string;
    insuranceDocumentName?: string;
    insuranceDocument?: string;
    declarationDocumentName?: string;
    declarationDocument?: string;
  };
  packageImages?: string[];
  shippingMode?: string;
  serviceType?: string;
  calculatedPrice?: number;
  basePrice?: number;
  gstAmount?: number;
  pickupCharge?: number;
  totalAmount?: number;
  actualWeight?: number;
  volumetricWeight?: number;
  chargeableWeight?: number;
  originServiceable?: boolean;
  destinationServiceable?: boolean;
  originAddressInfo?: string;
  destinationAddressInfo?: string;
  createdAt: string;
  updatedAt: string;
}

const COMPANY_DETAILS = {
  name: "Our Courier & Logistics",
  location: "Rehabari, Guwahati, Assam 781008",
  gstin: " 18AJRPG5984B1ZV",
  state: "Assam",
  stateCode: "18",
  phone: "+91 76360 96733",
  email: "info@oclservices.com",
  website: "www.oclservices.com",
};

const MyBooking: React.FC<ContactSupportProps> = ({ isDarkMode }) => {
  const { isAuthenticated, customer, isLoading: authLoading } = useUserAuth();
  
  // Door pickup charge constants (exclusive of GST)
  const DOOR_PICKUP_CHARGE = 100;
  const PICKUP_CHARGE_GST_RATE = 0.18; // 18% GST
  const PICKUP_CHARGE_GST = DOOR_PICKUP_CHARGE * PICKUP_CHARGE_GST_RATE; // ₹18
  const TOTAL_PICKUP_CHARGE = DOOR_PICKUP_CHARGE + PICKUP_CHARGE_GST; // ₹118
  
  // Helper function to calculate total pickup charge with GST
  // If pickupCharge is provided, assume it's the base amount and add GST
  // Otherwise, use the default TOTAL_PICKUP_CHARGE
  const getTotalPickupCharge = (pickupCharge?: number): number => {
    if (pickupCharge !== undefined && pickupCharge !== null) {
      // If pickupCharge is provided, add GST to it
      return pickupCharge + (pickupCharge * PICKUP_CHARGE_GST_RATE);
    }
    return TOTAL_PICKUP_CHARGE;
  };

  // Function to convert number to words (Indian format)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Rupees Only';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        result += teens[n - 10] + ' ';
        return result.trim();
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result.trim();
    };
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = '';
    let remaining = integerPart;
    
    // Crore
    if (remaining >= 10000000) {
      const crore = Math.floor(remaining / 10000000);
      result += convertHundreds(crore) + ' Crore ';
      remaining %= 10000000;
    }
    
    // Lakh
    if (remaining >= 100000) {
      const lakh = Math.floor(remaining / 100000);
      result += convertHundreds(lakh) + ' Lakh ';
      remaining %= 100000;
    }
    
    // Thousand
    if (remaining >= 1000) {
      const thousand = Math.floor(remaining / 1000);
      result += convertHundreds(thousand) + ' Thousand ';
      remaining %= 1000;
    }
    
    // Hundreds, Tens, Ones
    if (remaining > 0) {
      result += convertHundreds(remaining) + ' ';
    }
    
    result = result.trim() + ' Rupees';
    
    // Add paise if exists
    if (decimalPart > 0) {
      result += ' and ' + convertHundreds(decimalPart) + ' Paise';
    }
    
    return result + ' Only';
  };
  
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    if (!customer?._id) {
      setError("Please login to view your bookings");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/customer-booking?onlineCustomerId=${customer._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setBookings(data.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [customer?._id, toast]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      setLoading(false);
      return;
    }
    
    fetchBookings();
  }, [isAuthenticated, authLoading, fetchBookings]);

  useEffect(() => {
    if (!isAuthenticated || !customer?._id) {
      return;
    }

    const handleBookingCreated = () => {
      fetchBookings();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online-booking:created", handleBookingCreated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online-booking:created", handleBookingCreated);
      }
    };
  }, [isAuthenticated, customer?._id, fetchBookings]);

  const toggleRow = (bookingId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Pending",
        className: isDarkMode
          ? "bg-yellow-500/20 text-yellow-200 border-yellow-500/40"
          : "bg-yellow-100 text-yellow-700 border-yellow-300",
        icon: Clock,
      },
      confirmed: {
        label: "Confirmed",
        className: isDarkMode
          ? "bg-blue-500/20 text-blue-200 border-blue-500/40"
          : "bg-blue-100 text-blue-700 border-blue-300",
        icon: CheckCircle,
      },
      in_transit: {
        label: "In Transit",
        className: isDarkMode
          ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
          : "bg-purple-100 text-purple-700 border-purple-300",
        icon: Truck,
      },
      delivered: {
        label: "Delivered",
        className: isDarkMode
          ? "bg-green-500/20 text-green-200 border-green-500/40"
          : "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelled",
        className: isDarkMode
          ? "bg-red-500/20 text-red-200 border-red-500/40"
          : "bg-red-100 text-red-700 border-red-300",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
          config.className
        )}
      >
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;

    const normalized = status.toLowerCase();
    const isPaid = normalized === "paid";

    return (
      <Badge
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold tracking-wide border uppercase",
          isPaid
            ? isDarkMode
              ? "bg-green-500/20 text-green-200 border-green-500/40 hover:!bg-green-500/20"
              : "bg-green-100 text-green-700 border-green-200 hover:!bg-green-100"
            : isDarkMode
            ? "bg-red-500/15 text-red-200 border-red-500/40 hover:!bg-red-500/15"
            : "bg-red-100 text-red-700 border-red-200 hover:!bg-red-100"
        )}
      >
        {isPaid ? "Payment Paid" : "Payment Unpaid"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

const getConsignmentValue = (reference?: string) => {
  if (!reference) return "";
  const digitsOnly = reference.replace(/[^0-9]/g, "");
  return digitsOnly || reference.trim();
};

const getBarcodeUrl = (reference?: string) => {
  const value = getConsignmentValue(reference) || "OCL";
  return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(value)}&translate-esc=on`;
};

const getInvoiceNumber = (booking: Booking) => {
  const createdDate = new Date(booking.createdAt);
  const currentYear = createdDate.getFullYear();
  const nextYear = currentYear + 1;
  const fiscalYear = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;

  const numericPart =
    booking.bookingReference?.replace(/\D/g, "") ||
    booking._id.slice(-5);

  const serial = numericPart.slice(-5).padStart(5, "0");

  return `${fiscalYear}/${serial}`;
};

  const handleDownloadInvoice = useCallback(async () => {
    if (!selectedInvoiceBooking || !invoiceContentRef.current) {
      return;
    }

    try {
      setDownloadingInvoice(true);
      const scale =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 2, 2)
          : 2;

      const canvas = await html2canvas(invoiceContentRef.current, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${selectedInvoiceBooking.bookingReference}.pdf`);
      toast({
        title: "Invoice downloaded",
        description: `${selectedInvoiceBooking.bookingReference} saved as PDF.`,
      });
    } catch (err) {
      console.error("Error downloading invoice:", err);
      toast({
        title: "Download failed",
        description: "We could not generate the invoice PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(false);
    }
  }, [invoiceContentRef, selectedInvoiceBooking, toast]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={cn(
              "h-8 w-8 animate-spin",
              isDarkMode ? "text-blue-400" : "text-blue-600"
            )}
          />
          <p
            className={cn(
              "text-sm",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
            )}
          >
            {authLoading ? "Checking authentication..." : "Loading your bookings..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px] bg-transparent">
          <Card
            className={cn(
              "transition",
              isDarkMode
                ? "border-slate-800/60 bg-slate-900/70"
                : "border-slate-200 bg-white"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center py-8">
                <Lock
                  className={cn(
                    "h-16 w-16",
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  )}
                />
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-1",
                      isDarkMode ? "text-white" : "text-slate-900"
                    )}
                  >
                    Login Required
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                    )}
                  >
                    Please login to view your bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="max-w-md p-0 border-0 bg-transparent">
            <UserLogin
              isDarkMode={isDarkMode}
              onLoginSuccess={() => {
                setShowLoginDialog(false);
                fetchBookings();
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
        </div>
        <Card
          className={cn(
            "transition",
            isDarkMode
              ? "border-red-500/40 bg-red-500/10"
              : "border-red-200 bg-red-50"
          )}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <XCircle
                className={cn(
                  "h-12 w-12",
                  isDarkMode ? "text-red-400" : "text-red-600"
                )}
              />
              <div>
                <h3
                  className={cn(
                    "text-lg font-semibold mb-1",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  Error Loading Bookings
                </h3>
                <p
                  className={cn(
                    "text-sm",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                  )}
                >
                  {error}
                </p>
              </div>
              <Button
                onClick={fetchBookings}
                className="mt-2"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-transparent w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
        </div>
        <Button
          onClick={fetchBookings}
          variant="outline"
          size="sm"
          className={cn(
            "border shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
            isDarkMode
              ? "!border-slate-700 bg-slate-800 text-slate-200 hover:!bg-slate-800 hover:!text-slate-200 hover:!border-slate-700 hover:!shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
              : "!border-slate-200 bg-white text-slate-600 hover:!bg-white hover:!text-slate-600 hover:!border-slate-200 hover:!shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
          )}
        >
          Refresh
        </Button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card
          className={cn(
            "transition",
            isDarkMode
              ? "border-slate-800/60 bg-slate-900/70"
              : "border-slate-200 bg-white"
          )}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 text-center py-8">
              <Package
                className={cn(
                  "h-16 w-16",
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                )}
              />
              <div>
                <h3
                  className={cn(
                    "text-lg font-semibold mb-1",
                    isDarkMode ? "text-white" : "text-slate-900"
                  )}
                >
                  No Bookings Yet
                </h3>
                <p
                  className={cn(
                    "text-sm",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                  )}
                >
                  You haven't made any bookings yet. Create your first booking
                  to get started!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expandedRows.has(booking._id);
            return (
              <Card
                key={booking._id}
                className={cn(
                  "transition-all duration-200 border shadow-[rgba(0,0,0,0.15)_0px_3px_3px_0px]",
                  isDarkMode
                    ? "!border-slate-800/60 bg-slate-900/70 hover:!border-slate-800/60"
                    : "!border-slate-200 bg-white hover:!border-slate-200"
                )}
              >
                <CardHeader
                  className="cursor-pointer py-3 px-4"
                  onClick={() => toggleRow(booking._id)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-2">
                    <div className="space-y-1 min-w-0">
                      {/* First Line: Booking ID and Package Count */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CardTitle
                          className={cn(
                            "text-sm sm:text-base font-semibold break-words",
                            isDarkMode ? "text-white" : "text-slate-900"
                          )}
                        >
                          {booking.bookingReference}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Package
                            className={cn(
                              "h-3.5 w-3.5 flex-shrink-0",
                              isDarkMode ? "text-purple-400" : "text-purple-600"
                            )}
                          />
                          <p
                            className={cn(
                              "text-xs sm:text-[10px] font-medium",
                              isDarkMode ? "text-slate-200" : "text-slate-700"
                            )}
                          >
                            {booking.shipment.packagesCount}
                          </p>
                        </div>
                      </div>
                      {/* Second Line: Route */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1">
                          <MapPin
                            className={cn(
                              "h-3.5 w-3.5 flex-shrink-0",
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            )}
                          />
                          <p
                            className={cn(
                              "text-xs sm:text-[10px] font-medium",
                              isDarkMode ? "text-slate-200" : "text-slate-700"
                            )}
                          >
                            {booking.origin.city} → {booking.destination.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Center: Price, Quantity, and Payment Status */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      {/* First Row: Price */}
                      {booking.calculatedPrice && (
                        <div className="flex items-center gap-0.5">
                          <span
                            className={cn(
                              "text-xs sm:text-[10px] font-medium",
                              isDarkMode ? "text-green-400" : "text-green-600"
                            )}
                          >
                            ₹
                          </span>
                          <p
                            className={cn(
                              "text-xs sm:text-[10px] font-medium",
                              isDarkMode ? "text-slate-200" : "text-slate-700"
                            )}
                          >
                            {(booking.calculatedPrice ? booking.calculatedPrice + getTotalPickupCharge(booking.pickupCharge) : getTotalPickupCharge(booking.pickupCharge)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {/* Second Row: Payment Status */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 sm:ml-auto">
                      <p
                        className={cn(
                          "text-xs sm:text-[10px] whitespace-nowrap",
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        )}
                      >
                        {formatShortDate(booking.createdAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceBooking(booking);
                          }}
                          className={cn(
                            "h-8 sm:h-7 px-3 sm:px-2 text-xs border shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]",
                            isDarkMode
                              ? "!border-slate-700 bg-slate-800 text-slate-200 hover:!bg-slate-800 hover:!text-slate-200 hover:!border-slate-700 hover:!shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
                              : "!border-slate-200 bg-white text-slate-600 hover:!bg-white hover:!text-slate-600 hover:!border-slate-200 hover:!shadow-[rgba(0,0,0,0.16)_0px_3px_6px,rgba(0,0,0,0.23)_0px_3px_6px]"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1.5 sm:mr-1" />
                          <span className="sm:hidden">Invoice</span>
                          <span className="hidden sm:inline">Invoice</span>
                        </Button>
                        <button 
                          className="p-1.5 sm:p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(booking._id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp
                              className={cn(
                                "h-5 w-5 sm:h-4 sm:w-4",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              )}
                            />
                          ) : (
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 sm:h-4 sm:w-4",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              )}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 pt-3">
                      {/* Origin Details - Complete */}
                      <div 
                        className={cn(
                          "rounded-xl overflow-hidden",
                        isDarkMode
                            ? "bg-slate-800/40 border border-slate-700/50"
                            : "bg-[#F7FAFD] border border-slate-200/60"
                        )}
                        style={{
                          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                        }}
                      >
                        <div 
                          className={cn(
                            "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                            isDarkMode 
                              ? "bg-blue-900/30 border-b border-blue-800/40" 
                              : "bg-blue-50 border-b border-blue-100"
                          )}
                        >
                          <MapPin
                            className={cn(
                              "h-4 w-4",
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            )}
                          />
                          <h3
                            className={cn(
                              "text-sm font-semibold",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}
                          >
                            Origin / Sender Details
                          </h3>
                        </div>
                        <div className="space-y-4 px-5 pb-4">
                          {/* First Row: Name, Mobile Number, Email */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Name:
                            </p>
                            <p
                              className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.origin.name}
                            </p>
                          </div>
                            <div className="text-center md:text-left lg:text-center">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Mobile Number:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.origin.mobileNumber}
                              </p>
                            </div>
                            <div className="text-left md:text-right lg:text-right">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Email:
                              </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                {booking.origin.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          {/* Second Row: Address, Address Type */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left min-w-0">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Address:
                              </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                                style={{ 
                                  wordBreak: "break-word", 
                                  overflowWrap: "break-word",
                                  whiteSpace: "normal"
                                }}
                              >
                                {(() => {
                                  const addressParts = [
                                booking.origin.flatBuilding,
                                booking.origin.locality,
                                booking.origin.landmark,
                                    booking.origin.area,
                                    booking.origin.city,
                                    booking.origin.district,
                                    booking.origin.state,
                                    booking.origin.pincode ? ` - ${booking.origin.pincode}` : null
                                  ].filter(Boolean);
                                  
                                  const addressString = addressParts.join(", ");
                                  const words = addressString.split(/(\s+)/);
                                  const wordsOnly = words.filter(w => w.trim().length > 0);
                                  
                                  const chunks = [];
                                  for (let i = 0; i < wordsOnly.length; i += 5) {
                                    chunks.push(wordsOnly.slice(i, i + 5).join(" "));
                                  }
                                  
                                  return chunks.map((chunk, index) => (
                                    <React.Fragment key={index}>
                                      {chunk}
                                      {index < chunks.length - 1 && <br />}
                                    </React.Fragment>
                                  ));
                                })()}
                            </p>
                          </div>
                            <div className="text-center md:text-left lg:text-center">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Address Type:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.origin.addressType || "N/A"}
                              </p>
                            </div>
                            <div className="hidden lg:block"></div>
                            </div>
                              </div>
                            </div>

                      {/* Destination Details - Complete */}
                      <div 
                                className={cn(
                          "rounded-xl overflow-hidden",
                                    isDarkMode
                            ? "bg-slate-800/40 border border-slate-700/50"
                            : "bg-[#F7FAFD] border border-slate-200/60"
                        )}
                        style={{
                          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                        }}
                      >
                        <div 
                                className={cn(
                            "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                                    isDarkMode
                              ? "bg-green-900/30 border-b border-green-800/40" 
                              : "bg-green-50 border-b border-green-100"
                          )}
                        >
                          <MapPin
                            className={cn(
                              "h-4 w-4",
                              isDarkMode ? "text-green-400" : "text-green-600"
                            )}
                          />
                          <h3
                            className={cn(
                              "text-sm font-semibold",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}
                          >
                            Destination / Receiver Details
                          </h3>
                        </div>
                        <div className="space-y-4 px-5 pb-4">
                          {/* First Row: Name, Mobile Number, Email */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Name:
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.destination.name}
                            </p>
                          </div>
                            <div className="text-center md:text-left lg:text-center">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Mobile Number:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.destination.mobileNumber}
                              </p>
                            </div>
                            <div className="text-left md:text-right lg:text-right">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Email:
                              </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                {booking.destination.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          {/* Second Row: Address, Address Type */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left min-w-0">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Address:
                              </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                                style={{ 
                                  wordBreak: "break-word", 
                                  overflowWrap: "break-word",
                                  whiteSpace: "normal"
                                }}
                              >
                                {(() => {
                                  const addressParts = [
                                booking.destination.flatBuilding,
                                booking.destination.locality,
                                booking.destination.landmark,
                                    booking.destination.area,
                                    booking.destination.city,
                                    booking.destination.district,
                                    booking.destination.state,
                                    booking.destination.pincode ? ` - ${booking.destination.pincode}` : null
                                  ].filter(Boolean);
                                  
                                  const addressString = addressParts.join(", ");
                                  const words = addressString.split(/(\s+)/);
                                  const wordsOnly = words.filter(w => w.trim().length > 0);
                                  
                                  const chunks = [];
                                  for (let i = 0; i < wordsOnly.length; i += 5) {
                                    chunks.push(wordsOnly.slice(i, i + 5).join(" "));
                                  }
                                  
                                  return chunks.map((chunk, index) => (
                                    <React.Fragment key={index}>
                                      {chunk}
                                      {index < chunks.length - 1 && <br />}
                                    </React.Fragment>
                                  ));
                                })()}
                            </p>
                          </div>
                            <div className="text-center md:text-left lg:text-center">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                )}
                              >
                                Address Type:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.destination.addressType || "N/A"}
                              </p>
                            </div>
                            <div className="hidden lg:block"></div>
                            </div>
                              </div>
                            </div>

                      {/* Shipment Details - Complete */}
                      <div 
                                className={cn(
                          "rounded-xl overflow-hidden",
                                    isDarkMode
                            ? "bg-slate-800/40 border border-slate-700/50"
                            : "bg-[#F7FAFD] border border-slate-200/60"
                        )}
                        style={{
                          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                        }}
                      >
                        <div 
                                className={cn(
                            "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                                    isDarkMode
                              ? "bg-purple-900/30 border-b border-purple-800/40" 
                              : "bg-purple-50 border-b border-purple-100"
                          )}
                        >
                          <Package
                            className={cn(
                              "h-4 w-4",
                              isDarkMode ? "text-purple-400" : "text-purple-600"
                            )}
                          />
                          <h3
                            className={cn(
                              "text-sm font-semibold",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}
                          >
                            Shipment Details
                          </h3>
                        </div>
                        <div className="space-y-4 px-5 pb-4">
                          {/* Row 1: Nature of Consignment, Insurance, Risk Coverage */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Nature of Consignment:
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.shipment.natureOfConsignment}
                            </p>
                          </div>
                            <div className="text-center md:text-left lg:text-center">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Insurance:
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.shipment.insurance}
                            </p>
                          </div>
                            <div className="text-left md:text-right lg:text-right">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Risk Coverage:
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.shipment.riskCoverage}
                            </p>
                          </div>
                          </div>
                          {/* Row 2: Packages Count, Materials, Others */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="text-left">
                            <p
                              className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                              )}
                            >
                                Packages Count:
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                              )}
                            >
                              {booking.shipment.packagesCount}
                            </p>
                          </div>
                            {booking.shipment.materials ? (
                              <div className="text-center md:text-left lg:text-center">
                              <p
                                className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                  )}
                                >
                                  Materials:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.shipment.materials}
                              </p>
                            </div>
                            ) : (
                              <div className="hidden lg:block"></div>
                          )}
                            {booking.shipment.others ? (
                              <div className="text-left md:text-right lg:text-right">
                              <p
                                className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                  )}
                                >
                                  Others:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.shipment.others}
                              </p>
                            </div>
                            ) : (
                              <div className="hidden lg:block"></div>
                            )}
                          </div>
                          {/* Row 3: Weight, Length, Width */}
                          {(booking.shipment.weight || booking.shipment.length || booking.shipment.width) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                              {booking.shipment.weight ? (
                                <div className="text-left">
                              <p
                                className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Weight:
                                  </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                  {booking.shipment.weight} kg
                                </p>
                              </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                          )}
                              {booking.shipment.length ? (
                                <div className="text-center md:text-left lg:text-center">
                              <p
                                className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Length:
                                  </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                  {booking.shipment.length} cm
                                </p>
                              </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                          )}
                              {booking.shipment.width ? (
                                <div className="text-left md:text-right lg:text-right">
                              <p
                                className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Width:
                                  </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                  {booking.shipment.width} cm
                                </p>
                              </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                            </div>
                          )}
                          {/* Row 4: Height, Content Description, Declared Value */}
                          {(booking.shipment.height || booking.shipment.description || booking.shipment.declaredValue) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                              {booking.shipment.height ? (
                                <div className="text-left">
                              <p
                                className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Height:
                                  </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                  {booking.shipment.height} cm
                                </p>
                              </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                              {booking.shipment.description ? (
                                <div className="text-center md:text-left lg:text-center">
                                  <p
                                    className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Content Description:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.shipment.description}
                                  </p>
                                </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                              {booking.shipment.declaredValue ? (
                                <div className="text-left md:text-right lg:text-right">
                                  <p
                                    className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Declared Value:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    ₹{parseFloat(booking.shipment.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                            </div>
                          )}
                        </div>
                        </div>

                        {/* Insurance Details */}
                        {booking.shipment.insuranceCompanyName && (
                        <div 
                          className={cn(
                            "rounded-xl overflow-hidden",
                            isDarkMode
                              ? "bg-slate-800/40 border border-slate-700/50"
                              : "bg-[#F7FAFD] border border-slate-200/60"
                          )}
                          style={{
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                          }}
                        >
                          <div 
                            className={cn(
                              "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                              isDarkMode 
                                ? "bg-indigo-900/30 border-b border-indigo-800/40" 
                                : "bg-indigo-50 border-b border-indigo-100"
                            )}
                          >
                              <Shield
                                className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-blue-400" : "text-blue-600"
                                )}
                              />
                              <h4
                                className={cn(
                                  "text-sm font-semibold",
                                  isDarkMode ? "text-white" : "text-slate-900"
                                )}
                              >
                                Insurance Details
                              </h4>
                            </div>
                          <div className="space-y-4 px-5 pb-4">
                            {/* Row 1: Insurance Company, Policy Number, Policy Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                              <div className="text-left">
                                <p
                                  className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                  )}
                                >
                                  Insurance Company:
                                </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                  )}
                                >
                                  {booking.shipment.insuranceCompanyName}
                                </p>
                              </div>
                              {booking.shipment.insurancePolicyNumber ? (
                                <div className="text-center md:text-left lg:text-center">
                                  <p
                                    className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Policy Number:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.shipment.insurancePolicyNumber}
                                  </p>
                                </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                              {booking.shipment.insurancePolicyDate ? (
                                <div className="text-left md:text-right lg:text-right">
                                  <p
                                    className={cn(
                                      "text-[10px] font-semibold mb-1",
                                      isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                    )}
                                  >
                                    Policy Date:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                      isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.shipment.insurancePolicyDate}
                                  </p>
                                </div>
                              ) : (
                                <div className="hidden lg:block"></div>
                              )}
                            </div>
                            {/* Row 2: Valid Upto, Premium Amount, Insurance Document */}
                            {(booking.shipment.insuranceValidUpto || booking.shipment.insurancePremiumAmount || booking.shipment.insuranceDocument) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                                {booking.shipment.insuranceValidUpto ? (
                                  <div className="text-left">
                                  <p
                                    className={cn(
                                        "text-[10px] font-semibold mb-1",
                                        isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                      )}
                                    >
                                      Valid Upto:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                        isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.shipment.insuranceValidUpto}
                                  </p>
                                </div>
                                ) : (
                                  <div className="hidden lg:block"></div>
                              )}
                                {booking.shipment.insurancePremiumAmount ? (
                                  <div className="text-center md:text-left lg:text-center">
                                  <p
                                    className={cn(
                                        "text-[10px] font-semibold mb-1",
                                        isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                      )}
                                    >
                                      Premium Amount:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                        isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    ₹{booking.shipment.insurancePremiumAmount}
                                  </p>
                                </div>
                                ) : (
                                  <div className="hidden lg:block"></div>
                              )}
                                {booking.shipment.insuranceDocument ? (
                                  <div className="text-left md:text-right lg:text-right">
                                  <p
                                    className={cn(
                                        "text-[10px] font-semibold mb-1",
                                        isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                      )}
                                    >
                                      Insurance Document:
                                  </p>
                                  <button
                                    onClick={() => setSelectedImage(booking.shipment.insuranceDocument!)}
                                    className={cn(
                                        "text-sm underline inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                                      isDarkMode
                                        ? "text-blue-300 hover:text-blue-200"
                                        : "text-blue-600 hover:text-blue-700"
                                    )}
                                  >
                                    View Document
                                  </button>
                                </div>
                                ) : (
                                  <div className="hidden lg:block"></div>
                                )}
                              </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Declaration Document */}
                        {booking.shipment.declarationDocument && (
                        <div 
                          className={cn(
                            "rounded-xl overflow-hidden",
                            isDarkMode
                              ? "bg-slate-800/40 border border-slate-700/50"
                              : "bg-[#F7FAFD] border border-slate-200/60"
                          )}
                          style={{
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                          }}
                        >
                          <div 
                            className={cn(
                              "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                              isDarkMode 
                                ? "bg-emerald-900/30 border-b border-emerald-800/40" 
                                : "bg-emerald-50 border-b border-emerald-100"
                            )}
                          >
                              <FileText
                                className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-green-400" : "text-green-600"
                                )}
                              />
                              <h4
                                className={cn(
                                  "text-sm font-semibold",
                                  isDarkMode ? "text-white" : "text-slate-900"
                                )}
                              >
                                Declaration Document
                              </h4>
                            </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start px-5 pb-4">
                              {booking.shipment.declarationDocumentName && (
                              <div className="text-left">
                                  <p
                                    className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode ? "text-slate-300" : "text-[#6A7A89]"
                                  )}
                                >
                                  Document Name:
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.shipment.declarationDocumentName}
                                  </p>
                                </div>
                              )}
                            <div className="hidden lg:block"></div>
                            <div className="text-left md:text-right lg:text-right">
                                <button
                                  onClick={() => setSelectedImage(booking.shipment.declarationDocument!)}
                                  className={cn(
                                  "text-sm underline inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                                    isDarkMode
                                      ? "text-green-300 hover:text-green-200"
                                      : "text-green-600 hover:text-green-700"
                                  )}
                                >
                                  View Declaration Document
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Package Images */}
                      {booking.packageImages &&
                        booking.packageImages.length > 0 && (
                          <div className={cn(
                            "p-3",
                            isDarkMode
                              ? "bg-slate-800/20"
                              : "bg-slate-50/50"
                          )}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <ImageIcon
                                className={cn(
                                  "h-4 w-4",
                                  isDarkMode ? "text-purple-400" : "text-purple-600"
                                )}
                              />
                              <h3
                                className={cn(
                                  "text-sm font-semibold",
                                  isDarkMode ? "text-white" : "text-slate-900"
                                )}
                              >
                                Package Images ({booking.packageImages.length})
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {booking.packageImages.map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative group overflow-hidden rounded cursor-pointer flex-1 min-w-[100px] sm:min-w-0"
                                  onClick={() => setSelectedImage(imageUrl)}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Package ${index + 1}`}
                                    className="w-full h-20 sm:h-20 object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span
                                      className={cn(
                                        "text-white text-xs font-medium"
                                      )}
                                    >
                                      View Full Size
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Shipping & Pricing Information */}
                      <div 
                        className={cn(
                          "rounded-xl overflow-hidden",
                        isDarkMode
                            ? "bg-slate-800/40 border border-slate-700/50"
                            : "bg-[#F7FAFD] border border-slate-200/60"
                        )}
                        style={{
                          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                        }}
                      >
                        <div 
                          className={cn(
                            "flex items-center gap-1.5 mb-4 px-5 py-2 rounded-t-xl",
                            isDarkMode 
                              ? "bg-orange-900/30 border-b border-orange-800/40" 
                              : "bg-orange-50 border-b border-orange-100"
                          )}
                        >
                          <Truck
                            className={cn(
                              "h-4 w-4",
                              isDarkMode ? "text-orange-400" : "text-orange-600"
                            )}
                          />
                          <h3
                            className={cn(
                              "text-sm font-semibold",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}
                          >
                            Shipping & Pricing Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start px-5 pb-4">
                          {booking.shippingMode && (
                            <div className="text-left">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-[#6A7A89]"
                                )}
                              >
                                Shipping Mode:
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.shippingMode
                                  .replace("by", "")
                                  .toUpperCase()}
                              </p>
                            </div>
                          )}
                          {booking.serviceType && (
                            <div className="text-center md:text-left lg:text-center">
                              <p
                                className={cn(
                                  "text-[10px] font-semibold mb-1",
                                  isDarkMode
                                    ? "text-slate-300"
                                    : "text-[#6A7A89]"
                                )}
                              >
                                Service Type:
                              </p>
                              <p
                                className={cn(
                                  "text-xs capitalize",
                                  isDarkMode ? "text-white" : "text-[#1A2E45]"
                                )}
                              >
                                {booking.serviceType}
                              </p>
                            </div>
                          )}
                          {booking.calculatedPrice !== null &&
                            booking.calculatedPrice !== undefined && (
                              <div className="text-left md:text-right lg:text-right">
                                <p
                                  className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-[#6A7A89]"
                                  )}
                                >
                                  Total Amount:
                                </p>
                                  <p
                                    className={cn(
                                      "text-xs font-semibold",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    ₹{(booking.calculatedPrice ? booking.calculatedPrice + getTotalPickupCharge(booking.pickupCharge) : getTotalPickupCharge(booking.pickupCharge)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                              </div>
                            )}
                          {booking.actualWeight !== null &&
                            booking.actualWeight !== undefined && (
                              <div className="text-left">
                                <p
                                  className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-[#6A7A89]"
                                  )}
                                >
                                  Actual Weight:
                                </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.actualWeight} kg
                                  </p>
                              </div>
                            )}
                          {booking.volumetricWeight !== null &&
                            booking.volumetricWeight !== undefined && (
                              <div className="text-center md:text-left lg:text-center">
                                <p
                                  className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-[#6A7A89]"
                                  )}
                                >
                                  Volumetric Weight:
                                </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.volumetricWeight} kg
                                  </p>
                              </div>
                            )}
                          {booking.chargeableWeight !== null &&
                            booking.chargeableWeight !== undefined && (
                              <div className="text-left md:text-right lg:text-right">
                                <p
                                  className={cn(
                                    "text-[10px] font-semibold mb-1",
                                    isDarkMode
                                      ? "text-slate-300"
                                      : "text-[#6A7A89]"
                                  )}
                                >
                                  Chargeable Weight:
                                </p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                    isDarkMode ? "text-white" : "text-[#1A2E45]"
                                    )}
                                  >
                                    {booking.chargeableWeight} kg
                                  </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className={cn(
                        "p-2",
                        isDarkMode
                          ? "bg-slate-800/40"
                          : "bg-slate-200/60"
                      )}>
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <div className="flex items-center gap-1">
                            <Calendar
                              className={cn(
                                "h-3 w-3",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium",
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              )}
                            >
                              Created:
                            </span>
                            <span
                              className={cn(
                                isDarkMode ? "text-slate-200" : "text-slate-700"
                              )}
                            >
                              {formatDate(booking.createdAt)}
                            </span>
                          </div>
                          {booking.updatedAt !== booking.createdAt && (
                            <div className="flex items-center gap-1">
                              <Clock
                                className={cn(
                                  "h-3 w-3",
                                  isDarkMode ? "text-slate-200" : "text-slate-700"
                                )}
                              />
                              <span
                                className={cn(
                                  "font-medium",
                                  isDarkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                )}
                              >
                                Updated:
                              </span>
                              <span
                                className={cn(
                                  isDarkMode ? "text-slate-200" : "text-slate-700"
                                )}
                              >
                                {formatDate(booking.updatedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Image/Document Modal Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl w-full p-0 mx-2 sm:mx-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>View Document</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              {selectedImage.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedImage}
                  className="w-full h-[80vh] border-0"
                  title="Document Viewer"
                />
              ) : (
                <img
                  src={selectedImage}
                  alt="Document"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!selectedInvoiceBooking} onOpenChange={(open) => !open && setSelectedInvoiceBooking(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-0 shadow-none bg-white print:bg-white print:max-h-full print:overflow-visible [&>button]:hidden mx-2 sm:mx-auto">
          <DialogHeader className={cn("sticky top-0 z-10 bg-white dark:bg-slate-900 p-3 sm:p-4 print:hidden", isDarkMode ? "border-slate-700" : "border-slate-200")}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <DialogTitle className={cn("text-base sm:text-lg font-semibold break-words", isDarkMode ? "text-white" : "text-slate-900")}>
                Invoice - {selectedInvoiceBooking?.bookingReference}
              </DialogTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedInvoiceBooking) {
                      window.print();
                    }
                  }}
                  className={cn(
                    "flex-1 sm:flex-initial h-9 sm:h-8",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={!selectedInvoiceBooking || downloadingInvoice}
                  className={cn(
                    "flex-1 sm:flex-initial h-9 sm:h-8",
                    isDarkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {downloadingInvoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoiceBooking && (
            <div
              id="invoice-content"
              ref={invoiceContentRef}
              className={cn("p-3 sm:p-6 print:p-3", isDarkMode ? "bg-slate-900 print:bg-white" : "bg-white")}
            >
              {/* Invoice Section - Compressed Design (Same as BookNow.tsx) */}
              <div className="max-w-3xl mx-auto print:max-w-full">
                <div className={cn(
                  'bg-white p-3 sm:p-4 print:p-3',
                  isDarkMode ? 'bg-slate-800 print:bg-white' : 'bg-white'
                )}>
                  {/* Header Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-start">
                      <div className="flex items-start">
                        <img
                          src="/assets/ocl-logo.png"
                          alt="OCL Logo"
                          className="h-24 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ocl-logo.png';
                          }}
                        />
                      </div>
                      <div
                        className={cn(
                          "text-xs sm:text-[10px] space-y-1.5",
                          isDarkMode ? "text-slate-200" : "text-slate-700"
                        )}
                      >
                        <div className="space-y-0.5 sm:text-right">
                          <p
                            className={cn(
                              "text-sm sm:text-xs font-semibold",
                              isDarkMode ? "text-white" : "text-slate-900"
                            )}
                          >
                            Invoice Details
                          </p>
                          <p>Invoice No.: {getInvoiceNumber(selectedInvoiceBooking)}</p>
                          <p>Created: {formatShortDate(selectedInvoiceBooking.createdAt)}</p>
                        </div>
                        <div className="space-y-0.5 sm:text-right">
                          <p>
                            Consignment No.: {selectedInvoiceBooking.bookingReference || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid gap-4 mb-3 pb-2 grid-cols-1 sm:grid-cols-2 text-xs sm:text-[10px]",
                      isDarkMode ? "text-slate-200" : "text-slate-700"
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className={cn("text-xs font-semibold", isDarkMode ? "text-white" : "text-slate-900")}>
                        {COMPANY_DETAILS.name}
                      </p>
                      <p>{COMPANY_DETAILS.location}</p>
                      <p>GSTIN: {COMPANY_DETAILS.gstin}</p>
                      <p>State: {COMPANY_DETAILS.state} (Code: {COMPANY_DETAILS.stateCode})</p>
                    </div>
                    <div className="space-y-0.5 sm:text-right">
                      <p>Email: {COMPANY_DETAILS.email}</p>
                      <p>Phone: {COMPANY_DETAILS.phone}</p>
                      <p>Website: {COMPANY_DETAILS.website}</p>
                      <p>Contact: 03612637373, 8453994809</p>
                    </div>
                  </div>

                  {/* Sender and Recipient Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    {/* From Section */}
                    <div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">From - Sender Information</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoiceBooking.origin.name || 'N/A'}</div>
                        <div>{selectedInvoiceBooking.origin.flatBuilding || ''} {selectedInvoiceBooking.origin.locality || ''}</div>
                        <div>{selectedInvoiceBooking.origin.area || ''}, {selectedInvoiceBooking.origin.city || ''}, {selectedInvoiceBooking.origin.state || ''}</div>
                        <div>PIN: {selectedInvoiceBooking.origin.pincode || 'N/A'}</div>
                        {selectedInvoiceBooking.origin.mobileNumber && (
                          <div>Phone: {selectedInvoiceBooking.origin.mobileNumber}</div>
                        )}
                      </div>
                    </div>

                    {/* To Section */}
                    <div className="sm:text-right">
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">To - Recipient Information</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoiceBooking.destination.name || 'N/A'}</div>
                        <div>{selectedInvoiceBooking.destination.flatBuilding || ''} {selectedInvoiceBooking.destination.locality || ''}</div>
                        <div>{selectedInvoiceBooking.destination.area || ''}, {selectedInvoiceBooking.destination.city || ''}, {selectedInvoiceBooking.destination.state || ''}</div>
                        <div>PIN: {selectedInvoiceBooking.destination.pincode || 'N/A'}</div>
                        {selectedInvoiceBooking.destination.mobileNumber && (
                          <div>Phone: {selectedInvoiceBooking.destination.mobileNumber}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Shipping mode</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          {selectedInvoiceBooking.serviceType === 'priority' ? 'Priority' : 'Standard'}
                          {selectedInvoiceBooking.shippingMode &&
                            ` - ${
                              selectedInvoiceBooking.shippingMode === 'byAir' || selectedInvoiceBooking.shippingMode === 'air'
                                ? 'Air'
                                : selectedInvoiceBooking.shippingMode === 'byTrain' || selectedInvoiceBooking.shippingMode === 'train'
                                ? 'Train'
                                : 'Road'
                            }`}
                        </div>
                      </div>
                      <div className="text-left sm:text-center">
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Weight</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          {selectedInvoiceBooking.shipment.weight || '0'} kg
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-[10px] text-slate-500 mb-0.5">Declared Value</div>
                        <div className="text-xs sm:text-[10px] font-semibold text-slate-700">
                          ₹
                          {selectedInvoiceBooking.shipment.declaredValue
                            ? parseFloat(selectedInvoiceBooking.shipment.declaredValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barcode Section */}
                  <div className="mb-3 pb-2">
                    <div className="grid gap-4 sm:grid-cols-[1fr] items-center">
                      <div className="bg-slate-100 p-3 rounded flex items-center justify-center w-full" style={{ minHeight: '80px' }}>
                        <div className="text-center space-y-1.5 w-full">
                          <div className="text-[9px] text-slate-500">Barcode</div>
                          <img
                            src={getBarcodeUrl(selectedInvoiceBooking.bookingReference)}
                            alt={`Barcode for ${getConsignmentValue(selectedInvoiceBooking.bookingReference)}`}
                            className="mx-auto h-16 w-full object-contain mix-blend-multiply"
                            style={{ maxWidth: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                      {/* <div className="flex flex-col items-center justify-center gap-1">
                        <img
                          src="/assets/ocl-logo.png"
                          alt="OCL Logo"
                          className="h-16 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ocl-logo.png';
                          }}
                        />
                        <div className="text-[10px] font-semibold text-slate-700">OCL</div>
                      </div> */}

                  {/* Bill To and Payment Details - Two Column Layout */}
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Column - Bill To */}
                    <div>
                      <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Bill To</div>
                      <div className="text-xs sm:text-[10px] text-slate-600 leading-tight">
                        <div className="font-medium">{selectedInvoiceBooking.destination.name || 'N/A'}</div>
                        <div>Phone: {selectedInvoiceBooking.destination.mobileNumber || 'N/A'}</div>
                        <div>{selectedInvoiceBooking.destination.flatBuilding || ''} {selectedInvoiceBooking.destination.locality || ''}</div>
                        <div>{selectedInvoiceBooking.destination.area || ''}, {selectedInvoiceBooking.destination.city || ''}, {selectedInvoiceBooking.destination.state || ''}</div>
                        <div>PIN: {selectedInvoiceBooking.destination.pincode || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Right Column - Payment Details */}
                    <div className="text-left sm:text-right">
                      <div className="text-xs sm:text-[10px] font-bold text-black">
                        <div>{selectedInvoiceBooking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</div>
                      </div>
                      {selectedInvoiceBooking.calculatedPrice !== null && selectedInvoiceBooking.calculatedPrice !== undefined && (
                        <div className="text-base sm:text-[18px] font-bold text-black mt-1">
                          <div>₹{(selectedInvoiceBooking.calculatedPrice ? selectedInvoiceBooking.calculatedPrice + getTotalPickupCharge(selectedInvoiceBooking.pickupCharge) : getTotalPickupCharge(selectedInvoiceBooking.pickupCharge)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details - Price Breakdown */}
                  <div className="mb-3">
                    
                    {/* Price Breakdown */}
                    {selectedInvoiceBooking.calculatedPrice !== null && selectedInvoiceBooking.calculatedPrice !== undefined && (
                      <div className="mt-2 pt-2">
                        <div className="text-xs sm:text-[9px] text-slate-600 space-y-0.5">
                          {(() => {
                            // Use backend data if available, otherwise calculate
                            const basePrice = selectedInvoiceBooking.basePrice ?? (selectedInvoiceBooking.calculatedPrice / 1.18);
                            const pickupChargeBase = selectedInvoiceBooking.pickupCharge ?? DOOR_PICKUP_CHARGE;
                            const subtotal = basePrice + pickupChargeBase; // Base Price + Pickup Charge (both without GST)
                            const gstAmount = subtotal * 0.18; // GST on Subtotal
                            const totalAmount = subtotal + gstAmount; // Subtotal + GST
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span>Base Price:</span>
                                  <span>₹{basePrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pickup Charge (excl. GST):</span>
                                  <span>₹{pickupChargeBase.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST (18%):</span>
                                  <span>₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-black pt-0.5">
                                  <span>Total Amount:</span>
                                  <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-[9px] text-slate-600 italic pt-1 gap-1">
                                  <span>Amount in Words:</span>
                                  <span className="text-left sm:text-right break-words">{numberToWords(totalAmount)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item Description */}
                  <div className="mb-3">
                    <div className="text-xs sm:text-[10px] font-semibold text-slate-700 mb-1">Item Description:</div>
                    <div className="text-xs sm:text-[10px] text-slate-600">
                      {selectedInvoiceBooking.shipment.natureOfConsignment === 'DOX' ? 'Document' : selectedInvoiceBooking.shipment.natureOfConsignment === 'NON-DOX' ? 'Parcel' : selectedInvoiceBooking.shipment.natureOfConsignment || 'Document'}
                    </div>
                  </div>

                  {/* Disclaimers */}
                  <div className="mb-3 space-y-1">
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Personal/Used goods, Not for Sale No Commercial Value.
                    </div>
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Please note that the final charges may be subject to revision if the actual weight differs from the declared weight, or if any additional charges are applicable for the shipment. For any queries or updates, please contact us at{' '}
                      <a
                        href="mailto:info@oclservices.com"
                        className={cn(
                          "underline font-medium hover:opacity-80 transition-opacity",
                          isDarkMode ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-700"
                        )}
                      >
                        info@oclservices.com
                      </a>
                    </div>
                    <div className="text-xs sm:text-[9px] text-slate-600 leading-tight">
                      Movement of content is subject to our list of Dangerous Goods and Prohibited Items.
                    </div>
                  </div>

                  {/* Computer Generated Invoice Note */}
                  <div className={cn(
                    "mb-3 p-2 rounded border",
                    isDarkMode 
                      ? "bg-yellow-500/10 border-yellow-500/30" 
                      : "bg-yellow-50 border-yellow-200"
                  )}>
                    <div className={cn(
                      "text-xs sm:text-[9px] leading-tight",
                      isDarkMode ? "text-yellow-200" : "text-yellow-800"
                    )}>
                      <span className="font-bold">*</span> This is computer generated invoice and does not require official signature. Kindly notify us immediately in case you find any discrepancy in the details of transaction.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBooking;
