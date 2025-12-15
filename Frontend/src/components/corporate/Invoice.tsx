import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import oclLogo from "@/assets/ocl-logo.png";
import facebookIcon from "@/Icon-images/facebook.png";
import instagramIcon from "@/Icon-images/instagram.png";
import linkedinIcon from "@/Icon-images/linkedin.png";

interface InvoiceItem {
  _id: string;
  consignmentNumber: number;
  bookingDate: string;
  serviceType: string;
  destination: string;
  awbNumber?: string;
  weight: number;
  freightCharges: number;
  totalAmount: number;
}

interface InvoiceSummary {
  totalBills: number;
  totalAmount: number;
  totalFreight: number;
  gstAmount: number;
}

interface InvoiceProps {
  items: InvoiceItem[];
  summary: InvoiceSummary;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoicePeriod?: string;
  corporateName?: string;
  corporateAddress?: string;
  corporateGstNumber?: string;
  corporateState?: string;
  corporateContact?: string;
  corporateEmail?: string;
  billerState?: string; // State code of the company issuing the invoice
  isDarkMode?: boolean;
}

const Invoice: React.FC<InvoiceProps> = ({
  items,
  summary,
  invoiceNumber,
  invoiceDate,
  invoicePeriod,
  corporateName = "Corporate Client",
  corporateAddress = "Corporate Address",
  corporateGstNumber = "",
  corporateState = "",
  corporateContact = "",
  corporateEmail = "",
  billerState = "Assam", // Default to Assam
  isDarkMode = false
}) => {
  const formatCurrency = (amount: number) => {
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(roundedAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB');
  };

  const getCurrentInvoiceNumber = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const currentYearShort = String(currentYear).slice(-2);
    const nextYearShort = String(nextYear).slice(-2);
    // Fallback serial number (will be replaced by actual invoice number from backend)
    const serial = '00001';
    return `${currentYearShort}-${nextYearShort}/${serial}`;
  };

  const getInvoicePeriod = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${formatDate(firstDay.toISOString())} - ${formatDate(lastDay.toISOString())}`;
  };

  // Function to convert number to words
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

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

    let result = '';
    let scaleIndex = 0;
    
    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkWords = convertHundreds(chunk);
        if (scaleIndex > 0) {
          result = chunkWords + ' ' + scales[scaleIndex] + ' ' + result;
        } else {
          result = chunkWords;
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return result.trim() + ' Rupees Only';
  };

  // Calculate values matching the HTML generator exactly
  // totalAmount = sum of (50 + freightCharges) for each item
  const totalAmount = items.reduce((sum, item) => sum + 50 + item.freightCharges, 0);
  // totalFreight = sum of freightCharges only
  const totalFreight = items.reduce((sum, item) => sum + item.freightCharges, 0);
  // fuelCharge = 10% of totalFreight
  const fuelCharge = totalFreight * 0.1;
  // subtotalAfterFuel = totalAmount + fuelCharge
  const subtotalAfterFuel = totalAmount + fuelCharge;
  
  // GST Logic based on state codes
  const isSameState = billerState.toLowerCase() === corporateState.toLowerCase();
  let cgst, sgst, igst;
  
  if (isSameState) {
    // Same state: CGST + SGST (9% each), IGST = 0%
    cgst = subtotalAfterFuel * 0.09;
    sgst = subtotalAfterFuel * 0.09;
    igst = 0;
  } else {
    // Different states: IGST (18%), CGST + SGST = 0%
    cgst = 0;
    sgst = 0;
    igst = subtotalAfterFuel * 0.18;
  }
  
  const grandTotal = subtotalAfterFuel + cgst + sgst + igst;

  return (
    <div className={cn(
      "p-1 max-w-5xl mx-auto font-sans text-[10px]",
      isDarkMode ? "bg-slate-900" : "bg-white"
    )}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-2">
        {/* Logo */}
        <div className="w-[146px] h-[87px] flex items-center justify-center">
          <img 
            src={oclLogo} 
            alt="OCL Logo" 
            className="h-full w-full object-contain"
          />
        </div>

        {/* Company Contact Info - Centered */}
        <div className={cn(
          "flex-1 text-[10px] space-y-0.5 text-center flex flex-col justify-center items-center h-[87px]",
          isDarkMode ? "text-slate-200" : "text-black"
        )}>
          {/* Row 1: Company Name */}
          <div className="font-bold text-[14px] -ml-12">OCL Services</div>
          
          {/* Row 2: Website, Email, Phone */}
          <div className="flex items-center justify-center gap-3 -ml-20">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>www.oclservices.com</span>
            </div>
            <span className={isDarkMode ? "text-slate-500" : "text-gray-400"}>|</span>
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>info@oclservices.com</span>
            </div>
            <span className={isDarkMode ? "text-slate-500" : "text-gray-400"}>|</span>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>+91 8453994809</span>
            </div>
          </div>
          
          {/* Row 3: Social Media */}
          <div className="flex items-center justify-center gap-3 -ml-20">
            <div className="flex items-center gap-1.5">
              <img src={facebookIcon} alt="Facebook" className="w-3.5 h-3.5" />
              <span>@OCL services</span>
            </div>
            <span className={isDarkMode ? "text-slate-500" : "text-gray-400"}>|</span>
            <div className="flex items-center gap-1.5">
              <img src={instagramIcon} alt="Instagram" className="w-3.5 h-3.5" />
              <span>@ocl_services</span>
            </div>
            <span className={isDarkMode ? "text-slate-500" : "text-gray-400"}>|</span>
            <div className="flex items-center gap-1.5">
              <img src={linkedinIcon} alt="LinkedIn" className="w-3.5 h-3.5" />
              <span>@OCL Services</span>
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="bg-[#4a9b8e] text-white px-4 py-5 rounded flex items-center justify-center h-[87px]">
          <div className="font-bold text-[16px]">Invoice</div>
        </div>
      </div>

      {/* Biller and Bill To Section */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Biller */}
        <div className={cn(
          "rounded p-2",
          isDarkMode ? "bg-slate-800/60" : "bg-[#fde2d1]"
        )}>
          <div className={cn(
            "font-bold text-[11px] mb-1",
            isDarkMode ? "text-slate-200" : "text-black"
          )}>Biller,</div>
          <div className={cn(
            "text-[10px] pl-2",
            isDarkMode ? "text-slate-400" : "text-gray-500"
          )}>
            <div>Our Courier & Logistics Services (I) Pvt.Ltd</div>
            <div>Rehabari, Guwahati, Kamrup</div>
            <div>GSTIN/UIN: 18AACCO3877C1ZE</div>
            <div>State Name: Assam, Code: 18</div>
            <div>Contact: 9085969696</div>
            <div>E-Mail: oclindia2016@gmail.com</div>
          </div>
        </div>

        {/* Bill To */}
        <div className={cn(
          "rounded p-2",
          isDarkMode ? "bg-slate-800/60" : "bg-[#fde2d1]"
        )}>
          <div className={cn(
            "font-bold text-[11px] mb-1",
            isDarkMode ? "text-slate-200" : "text-black"
          )}>Bill To,</div>
          <div className={cn(
            "text-[10px] pl-2",
            isDarkMode ? "text-slate-400" : "text-gray-500"
          )}>
            <div className="font-medium">{corporateName}</div>
            <div>{corporateAddress}</div>
            {corporateGstNumber && <div>GSTIN/UIN: {corporateGstNumber}</div>}
            {corporateState && <div>State: {corporateState}</div>}
            {corporateContact && <div>Contact: {corporateContact}</div>}
            {corporateEmail && <div>E-Mail: {corporateEmail}</div>}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
          <div className={cn(
            "rounded p-1.5 mb-2",
            isDarkMode ? "bg-slate-800/40" : "bg-[#f0f0f0]"
          )}>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div className="text-left">
            <span className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Invoice Date:</span>
            <span className={cn(
              "ml-1 font-medium",
              isDarkMode ? "text-slate-200" : ""
            )}>{invoiceDate || getCurrentDate()}</span>
          </div>
          <div className="text-center">
            <span className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Invoice No.:</span>
            <span className={cn(
              "ml-1 font-medium",
              isDarkMode ? "text-slate-200" : ""
            )}>{invoiceNumber || getCurrentInvoiceNumber()}</span>
          </div>
          <div className="text-right">
            <span className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Invoice Period:</span>
            <span className={cn(
              "ml-1 font-medium",
              isDarkMode ? "text-slate-200" : ""
            )}>{invoicePeriod || getInvoicePeriod()}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-2">
        {/* Table Header */}
        <div className="bg-[#4a9b8e] text-white rounded p-2">
          <div className="grid grid-cols-10 text-[10px] font-medium" style={{
            gridTemplateColumns: '0.5fr 1.2fr 1fr 1.5fr 1.8fr 1.2fr 0.8fr 0.8fr 1.3fr 1fr',
            gap: '8px'
          }}>
            <div className="text-center">Sl.No.</div>
            <div className="border-l border-gray-300 text-center">Date</div>
            <div className="border-l border-gray-300 text-center">Type</div>
            <div className="border-l border-gray-300 text-center">Destination</div>
            <div className="border-l border-gray-300 text-center">AWB No.</div>
            <div className="border-l border-gray-300 text-center">Weight</div>
            <div className="border-l border-gray-300 text-center">AWB</div>
            <div className="border-l border-gray-300 text-center">Others</div>
            <div className="border-l border-gray-300 text-center">Freight</div>
            <div className="border-l border-gray-300 text-right">Amount</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-0.5">
          {items.map((item, index) => (
            <div
              key={item._id}
              className={cn(
                "grid grid-cols-10 p-2 rounded text-[10px]",
                isDarkMode
                  ? index % 2 === 0 ? "bg-slate-800/40" : "bg-slate-800/60"
                  : index % 2 === 0 ? "bg-[#f0f0f0]" : "bg-[#fde2d1]"
              )}
              style={{
                gridTemplateColumns: '0.5fr 1.2fr 1fr 1.5fr 1.8fr 1.2fr 0.8fr 0.8fr 1.3fr 1fr',
                gap: '8px'
              }}
            >
              <div className={cn(
                "text-center",
                isDarkMode ? "text-slate-200" : ""
              )}>{index + 1}</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{formatDate(item.bookingDate)}</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{item.serviceType === 'DOX' ? 'DOX' : 'N-DOX'}</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{item.destination}</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{item.awbNumber || '-'}</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{item.weight} kg</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>₹50</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>-</div>
              <div className={cn(
                "border-l text-center",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{formatCurrency(item.freightCharges)}</div>
              <div className={cn(
                "border-l text-right font-medium",
                isDarkMode ? "border-slate-600 text-slate-200" : "border-gray-300"
              )}>{formatCurrency(50 + item.freightCharges)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Section */}
      <div className="flex justify-end items-center mb-2">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "font-bold text-[10px]",
            isDarkMode ? "text-slate-200" : ""
          )}>Total</div>
          <div className="bg-[#4a9b8e] text-white px-3 py-0.5 rounded font-medium text-[10px]">
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="grid grid-cols-12 gap-2 mb-0.5">
        {/* Terms & Condition */}
        <div className="col-span-5">
          <div className={cn(
            "font-medium text-[10px] mb-1",
            isDarkMode ? "text-slate-200" : ""
          )}>Terms & Condition</div>
          <div className={cn(
            "rounded p-1.5 h-[100px] text-[10px] leading-tight",
            isDarkMode ? "bg-slate-800/40 text-slate-300" : "bg-[#f0f0f0]"
          )}>
            <div className="mb-1">1. Invoice Amount To Be Paid By Same Days From The Date Of Invoice</div>
            <div className="mb-1">2. Payment Should Be Crossed Account Payee Cheque/Demand Draft or Digital Transfer</div>
            <div>3. Interest @ 3% Per Month Will Be Charged On Payment</div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="col-span-2">
          <div className={cn(
            "font-medium text-[10px] mb-1",
            isDarkMode ? "text-slate-200" : ""
          )}>Bank Details</div>
          <div className={cn(
            "rounded p-1.5 h-[100px] text-[10px]",
            isDarkMode ? "bg-slate-800/40 text-slate-300" : "bg-[#f0f0f0]"
          )}>
            <div>Bank: SBI</div>
            <div>Acc: 1234567890</div>
            <div>IFSC: SBIN0001234</div>
          </div>
        </div>

        {/* Amount In Words */}
        <div className="col-span-2">
          <div className={cn(
            "font-medium text-[10px] mb-1",
            isDarkMode ? "text-slate-200" : ""
          )}>Amount In Words:</div>
          <div className={cn(
            "rounded p-1.5 h-[100px] text-[10px]",
            isDarkMode ? "bg-slate-800/40 text-slate-300" : "bg-[#f0f0f0]"
          )}>
            {grandTotal > 0 ? numberToWords(Math.floor(grandTotal)) : ''}
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="col-span-3">
          <div className={cn(
            "space-y-1 text-[10px]",
            isDarkMode ? "text-slate-300" : ""
          )}>
            <div className="flex justify-between">
              <span>Fuel Charge:</span>
              <span>{formatCurrency(fuelCharge)}</span>
            </div>
            <div className={cn(
              "flex justify-between items-center border-t pt-1",
              isDarkMode ? "border-slate-600" : "border-gray-200"
            )}>
              <span className="font-semibold">Total:</span>
              <div className="bg-[#4a9b8e] text-white px-2 py-0.5 rounded font-bold text-[10px]">
                {formatCurrency(subtotalAfterFuel)}
              </div>
            </div>
            <div className="flex justify-between">
              <span>SGST:</span>
              <span>{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST:</span>
              <span>{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST:</span>
              <span>{formatCurrency(igst)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex justify-end items-center">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "font-bold text-[14px]",
            isDarkMode ? "text-slate-200" : ""
          )}>Grand Total</div>
          <div className="bg-[#4a9b8e] text-white px-4 py-1.5 rounded font-bold text-[14px]">
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className={cn(
        "mt-2 pt-2 border-t",
        isDarkMode ? "border-slate-700" : "border-gray-300"
      )}>
        <div className={cn(
          "text-[10px] text-center",
          isDarkMode ? "text-slate-400" : "text-gray-600"
        )}>
          <div className="font-medium mb-1">Disclaimer:</div>
          <div>This Is a Computer Generated Invoice and does not require any official signature. Kindly notify us immediately in case you find any discrepancy in the details of transactions.</div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
