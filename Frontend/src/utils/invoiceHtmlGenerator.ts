// Utility function to generate invoice HTML that matches Invoice.tsx exactly
// This ensures print, PDF, and display all match perfectly

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

interface InvoiceData {
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
  billerState?: string;
  logoBase64?: string;
}

export const generateInvoiceHTML = (data: InvoiceData): string => {
  const {
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
    billerState = "Assam",
    logoBase64 = ""
  } = data;

  const formatCurrency = (amount: number) => {
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(roundedAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleDateString('en-GB');
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

  // Function to convert number to words (matches Invoice.tsx exactly)
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

  // Calculate values matching Invoice.tsx logic exactly
  // totalAmount = sum of (50 + freightCharges) for each item
  const totalAmount = items.reduce((sum, item) => sum + 50 + item.freightCharges, 0);
  // totalFreight = sum of freightCharges only
  const totalFreight = items.reduce((sum, item) => sum + item.freightCharges, 0);
  // fuelCharge = 10% of totalFreight
  const fuelCharge = totalFreight * 0.1;
  // subtotalAfterFuel = totalAmount + fuelCharge
  const subtotalAfterFuel = totalAmount + fuelCharge;
  
  // GST Logic based on state codes (matching Invoice.tsx exactly)
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

  const finalInvoiceDate = invoiceDate || getCurrentDate();
  const finalInvoiceNumber = invoiceNumber || getCurrentInvoiceNumber();
  const finalInvoicePeriod = invoicePeriod || getInvoicePeriod();

  // Generate table rows
  const shipmentRows = items.map((item, index) => {
    const awbNumber = item.awbNumber || '-';
    const weightValue = item.weight ? `${item.weight} kg` : '-';
    const awbCharge = 50;
    const freight = formatCurrency(item.freightCharges);
    const amount = formatCurrency(awbCharge + item.freightCharges);
    const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';

    return `
      <div class="table-row ${rowClass}">
        <div class="col-1">${index + 1}</div>
        <div class="col-2">${formatDate(item.bookingDate)}</div>
        <div class="col-3">${item.serviceType === 'DOX' ? 'DOX' : 'N-DOX'}</div>
        <div class="col-4">${item.destination}</div>
        <div class="col-5">${awbNumber}</div>
        <div class="col-6">${weightValue}</div>
        <div class="col-7">₹50</div>
        <div class="col-8">-</div>
        <div class="col-9">${freight}</div>
        <div class="col-10">${amount}</div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Invoice</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: white;
      color: #000;
      font-size: 10px;
      padding: 4px;
    }
    .invoice-container {
      max-width: 1280px;
      margin: 0 auto;
      background: white;
      padding: 4px;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .logo-container {
      width: 146px;
      height: 87px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .contact-info {
      flex: 1;
      font-size: 10px;
      display: flex;
      flex-direction: column;
      gap: 0;
      text-align: center;
      justify-content: center;
      align-items: center;
      height: 87px;
      padding: 0;
    }
    .contact-info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .contact-info-row div {
      color: #000;
      line-height: 1.2;
      text-align: center;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .contact-info-row .font-medium {
      font-weight: 500;
    }
    .contact-info-row .font-bold {
      font-weight: bold;
      font-size: 14px;
    }
    .contact-info-row:first-child {
      margin-left: -80px;
    }
    .contact-info-row:nth-child(2) {
      margin-left: -80px;
    }
    .contact-info-row:nth-child(3) {
      margin-left: -80px;
    }
    .contact-info-separator {
      color: #9ca3af;
      margin: 0 8px;
    }
    .social-icon {
      width: 14px;
      height: 14px;
      object-fit: contain;
    }
    .contact-icon {
      width: 12px;
      height: 12px;
      object-fit: contain;
    }
    .invoice-badge {
      background-color: #4a9b8e;
      color: white;
      padding: 20px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 87px;
    }
    .invoice-badge div {
      font-weight: bold;
      font-size: 14px;
    }
    .biller-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 8px;
    }
    .biller-card {
      background-color: #fde2d1;
      border-radius: 4px;
      padding: 8px;
    }
    .biller-card .title {
      font-weight: bold;
      color: #000;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .biller-card .content {
      color: #6b7280;
      font-size: 10px;
      line-height: 1.4;
      padding-left: 8px;
    }
    .biller-card .content div {
      margin-bottom: 2px;
    }
    .biller-card .font-medium {
      font-weight: 500;
    }
    .invoice-details {
      background-color: #f0f0f0;
      border-radius: 4px;
      padding: 6px;
      margin-bottom: 8px;
    }
    .invoice-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      font-size: 10px;
    }
    .invoice-details-grid div {
      color: #4b5563;
    }
    .invoice-details-grid div:first-child {
      text-align: left;
    }
    .invoice-details-grid div:nth-child(2) {
      text-align: center;
    }
    .invoice-details-grid div:last-child {
      text-align: right;
    }
    .invoice-details-grid .font-medium {
      font-weight: 500;
      color: #000;
      margin-left: 4px;
    }
    .table-container {
      margin-bottom: 8px;
    }
    .table-header {
      background-color: #4a9b8e;
      color: white;
      border-radius: 4px;
      padding: 8px;
    }
    .table-header-grid {
      display: grid;
      grid-template-columns: 0.5fr 1.2fr 1fr 1.5fr 1.8fr 1.2fr 0.8fr 0.8fr 1.3fr 1fr;
      gap: 8px;
      font-size: 10px;
      font-weight: 500;
    }
    .table-header-grid div {
      text-align: center;
    }
    .table-header-grid div:last-child {
      text-align: right;
    }
    .table-header-grid div:not(:first-child) {
      border-left: 1px solid rgba(255, 255, 255, 0.3);
    }
    .table-row {
      display: grid;
      grid-template-columns: 0.5fr 1.2fr 1fr 1.5fr 1.8fr 1.2fr 0.8fr 0.8fr 1.3fr 1fr;
      gap: 8px;
      padding: 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-bottom: 1px;
    }
    .row-even {
      background-color: #f0f0f0 !important;
    }
    .row-odd {
      background-color: #fde2d1 !important;
    }
    .table-row div {
      text-align: center;
    }
    .table-row .col-10 {
      text-align: right;
      font-weight: 500;
    }
    .table-row .col-2,
    .table-row .col-3,
    .table-row .col-4,
    .table-row .col-5,
    .table-row .col-6,
    .table-row .col-7,
    .table-row .col-8,
    .table-row .col-9,
    .table-row .col-10 {
      border-left: 1px solid rgba(0, 0, 0, 0.1);
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 8px;
    }
    .total-section .total-label {
      font-weight: bold;
      font-size: 10px;
      margin-right: 8px;
    }
    .total-section .total-box {
      background-color: #4a9b8e;
      color: white;
      padding: 3px 12px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      margin-bottom: 2px;
    }
    .footer-col-2 {
      grid-column: span 2;
    }
    .footer-col-3 {
      grid-column: span 3;
    }
    .footer-col-4 {
      grid-column: span 4;
    }
    .footer-col-5 {
      grid-column: span 5;
    }
    .footer-section {
      margin-bottom: 8px;
    }
    .footer-section .title {
      font-weight: 500;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .footer-section .content {
      background-color: #f0f0f0;
      border-radius: 4px;
      padding: 6px;
      height: 100px;
      font-size: 10px;
      line-height: 1.5;
    }
    .footer-section .content div {
      margin-bottom: 4px;
    }
    .tax-breakdown {
      font-size: 10px;
    }
    .tax-breakdown .tax-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .tax-breakdown .tax-row.border-t {
      border-top: 1px solid rgba(0, 0, 0, 0.2);
      padding-top: 4px;
      margin-top: 4px;
    }
    .tax-breakdown .tax-total-box {
      background-color: #4a9b8e;
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 10px;
    }
    .grand-total-section {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    .grand-total-label {
      font-weight: bold;
      font-size: 14px;
      margin-right: 8px;
    }
    .grand-total-box {
      background-color: #4a9b8e;
      color: white;
      padding: 6px 16px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
    }
    .disclaimer {
      margin-top: 10px;
      padding-top: 16px;
      border-top: 1px solid #d1d5db;
    }
    .disclaimer .title {
      font-weight: 500;
      font-size: 10px;
      margin-bottom: 4px;
      text-align: center;
      color: #4b5563;
    }
    .disclaimer .content {
      font-size: 10px;
      text-align: center;
      color: #4b5563;
    }
    @media print {
      @page {
        margin: 0.5in 0.125in;
        size: A4;
      }
      /* Hide browser print dialog footer elements */
      @page {
        margin-bottom: 0.5in;
      }
      html, body, * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      /* Force all backgrounds to print */
      div, span, section, article {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: 16px;
        background: white !important;
      }
      .invoice-container {
        background: white !important;
        box-shadow: none !important;
      }
      .invoice-badge {
        background-color: #4a9b8e !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .biller-card {
        background-color: #fde2d1 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .table-header {
        background-color: #4a9b8e !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .row-even {
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .row-odd {
        background-color: #fde2d1 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .total-box,
      .tax-total-box,
      .grand-total-box {
        background-color: #4a9b8e !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-details {
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .footer-section .content {
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="logo-container">
        ${logoBase64 ? `<img src="${logoBase64}" alt="OCL Logo" style="width: 146px; height: 87px; object-fit: contain;" />` : '<div style="width:146px;height:87px;background:#f5f5dc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#8b7355;font-size:10px;font-weight:500;">LOGO</div>'}
      </div>
      <div class="contact-info">
        <!-- Row 1: Company Name -->
        <div class="contact-info-row">
          <div class="font-bold">OCL Services</div>
        </div>
        
        <!-- Row 2: Website, Email, Phone -->
        <div class="contact-info-row">
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E" alt="Globe" class="contact-icon" /><span>www.oclservices.com</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/%3E%3Cpolyline points='22,6 12,13 2,6'/%3E%3C/svg%3E" alt="Mail" class="contact-icon" /><span>info@oclservices.com</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/%3E%3C/svg%3E" alt="Phone" class="contact-icon" /><span>+91 8453994809</span></div>
        </div>
        
        <!-- Row 3: Social Media -->
        <div class="contact-info-row">
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E" alt="Facebook" class="social-icon" /><span>@OCL services</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/%3E%3C/svg%3E" alt="Instagram" class="social-icon" /><span>@ocl_services</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" alt="LinkedIn" class="social-icon" /><span>@OCL Services</span></div>
        </div>
      </div>
      <div class="invoice-badge">
        <div>Invoice</div>
      </div>
    </div>

    <!-- Biller and Bill To Section -->
    <div class="biller-section">
      <div class="biller-card">
        <div class="title">Biller,</div>
        <div class="content">
          <div>Our Courier & Logistics Services (I) Pvt.Ltd</div>
          <div>Rehabari, Guwahati, Kamrup</div>
          <div>GSTIN/UIN: 18AACCO3877C1ZE</div>
          <div>State Name: Assam, Code: 18</div>
          <div>Contact: 9085969696</div>
          <div>E-Mail: oclindia2016@gmail.com</div>
        </div>
      </div>
      <div class="biller-card">
        <div class="title">Bill To,</div>
        <div class="content">
          <div class="font-medium">${corporateName}</div>
          <div>${corporateAddress}</div>
          ${corporateGstNumber ? `<div>GSTIN/UIN: ${corporateGstNumber}</div>` : ''}
          ${corporateState ? `<div>State: ${corporateState}</div>` : ''}
          ${corporateContact ? `<div>Contact: ${corporateContact}</div>` : ''}
          ${corporateEmail ? `<div>E-Mail: ${corporateEmail}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="invoice-details-grid">
        <div>
          <span style="color: #4b5563;">Invoice Date:</span>
          <span class="font-medium">${finalInvoiceDate}</span>
        </div>
        <div>
          <span style="color: #4b5563;">Invoice No.:</span>
          <span class="font-medium">${finalInvoiceNumber}</span>
        </div>
        <div>
          <span style="color: #4b5563;">Invoice Period:</span>
          <span class="font-medium">${finalInvoicePeriod}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <div class="table-header">
        <div class="table-header-grid">
          <div>Sl.No.</div>
          <div>Date</div>
          <div>Type</div>
          <div>Destination</div>
          <div>AWB No.</div>
          <div>Weight</div>
          <div>AWB</div>
          <div>Others</div>
          <div>Freight</div>
          <div>Amount</div>
        </div>
      </div>
      ${shipmentRows}
    </div>

    <!-- Total Section -->
    <div class="total-section">
      <div class="total-label">Total</div>
      <div class="total-box">${formatCurrency(totalAmount)}</div>
    </div>

    <!-- Footer Section -->
    <div class="footer-grid">
      <!-- Terms & Condition -->
      <div class="footer-col-5">
        <div class="footer-section">
          <div class="title">Terms & Condition</div>
          <div class="content">
            <div>1. Invoice Amount To Be Paid By Same Days From The Date Of Invoice</div>
            <div>2. Payment Should Be Crossed Account Payee Cheque/Demand Draft or Digital Transfer</div>
            <div>3. Interest @ 3% Per Month Will Be Charged On Payment</div>
          </div>
        </div>
      </div>

      <!-- Bank Details -->
      <div class="footer-col-2">
        <div class="footer-section">
          <div class="title">Bank Details</div>
          <div class="content">
            <div>Bank: SBI</div>
            <div>Acc: 1234567890</div>
            <div>IFSC: SBIN0001234</div>
          </div>
        </div>
      </div>

      <!-- Amount In Words -->
      <div class="footer-col-2">
        <div class="footer-section">
          <div class="title">Amount In Words:</div>
          <div class="content">${grandTotal > 0 ? numberToWords(Math.floor(grandTotal)) : ''}</div>
        </div>
      </div>

      <!-- Tax Breakdown -->
      <div class="footer-col-3">
        <div class="footer-section">
          <div class="tax-breakdown">
            <div class="tax-row">
              <span>Fuel Charge:</span>
              <span>${formatCurrency(fuelCharge)}</span>
            </div>
            <div class="tax-row border-t">
              <span style="font-weight: 600;">Total:</span>
              <span class="tax-total-box">${formatCurrency(subtotalAfterFuel)}</span>
            </div>
            <div class="tax-row">
              <span>SGST:</span>
              <span>${formatCurrency(sgst)}</span>
            </div>
            <div class="tax-row">
              <span>CGST:</span>
              <span>${formatCurrency(cgst)}</span>
            </div>
            <div class="tax-row">
              <span>IGST:</span>
              <span>${formatCurrency(igst)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grand Total -->
    <div class="grand-total-section" style="margin-top: 0; padding-top: 0;">
      <div class="grand-total-label">Grand Total</div>
      <div class="grand-total-box">${formatCurrency(grandTotal)}</div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <div class="title">Disclaimer:</div>
      <div class="content">This Is a Computer Generated Invoice and does not require any official signature. Kindly notify us immediately in case you find any discrepancy in the details of transactions.</div>
    </div>
  </div>
</body>
</html>
  `;
};

