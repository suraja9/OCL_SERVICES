import express from 'express';
import Invoice from '../models/Invoice.js';
import CorporateData from '../models/CorporateData.js';
import { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import { authenticateCorporate, authenticateAdmin } from '../middleware/auth.js';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Function to generate HTML invoice - matches Invoice.tsx design exactly
const generateHTMLInvoice = (invoiceData, corporate) => {
  // Get logo as base64
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'ocl-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  const formatCurrency = (amount) => {
    const roundedAmount = Math.round(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(roundedAmount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const parsed = new Date(date);
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
    return `${formatDate(firstDay.toISOString())} to ${formatDate(lastDay.toISOString())}`;
  };

  // Function to convert number to words (matches Invoice.tsx)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const convertHundreds = (n) => {
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
  const totalAmount = (invoiceData.shipments || []).reduce((sum, item) => sum + 50 + (item.freightCharges || 0), 0);
  // totalFreight = sum of freightCharges only
  const totalFreight = invoiceData.shipments?.reduce((sum, s) => sum + (s.freightCharges || 0), 0) || 0;
  // fuelCharge = 10% of totalFreight
  const fuelCharge = totalFreight * 0.1;
  // subtotalAfterFuel = totalAmount + fuelCharge (matching Invoice.tsx: summary.totalAmount + fuelCharge)
  const subtotalAfterFuel = totalAmount + fuelCharge;
  
  // GST Logic based on state codes (matching Invoice.tsx)
  const billerState = 'Assam';
  const corporateState = corporate?.state || '';
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

  const invoiceDate = formatDate(invoiceData.invoiceDate || new Date());
  const invoiceNumber = invoiceData.invoiceNumber || getCurrentInvoiceNumber();
  const invoicePeriod = invoiceData.invoicePeriod 
    ? `${formatDate(invoiceData.invoicePeriod.startDate)} to ${formatDate(invoiceData.invoicePeriod.endDate)}`
    : getInvoicePeriod();

  // Generate table rows matching Invoice.tsx structure
  const shipmentRows = (invoiceData.shipments || []).map((shipment, index) => {
    const awbNumber = shipment.consignmentNumber || shipment.bookingReference || '-';
    const weightValue = shipment.weight ? `${shipment.weight} kg` : '-';
    const awbCharge = 50; // Fixed 50rs per AWB
    const freight = formatCurrency(shipment.freightCharges || 0);
    const amount = formatCurrency(awbCharge + (shipment.freightCharges || 0));
    const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';

    return `
      <div class="table-row ${rowClass}">
        <div class="col-1">${index + 1}</div>
        <div class="col-2">${formatDate(shipment.bookingDate)}</div>
        <div class="col-3">${(shipment.serviceType || 'N-DOX') === 'DOX' ? 'DOX' : 'N-DOX'}</div>
        <div class="col-4">${shipment.destination || '-'}</div>
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
      margin: 0;
      padding: 4px;
      background-color: white;
      color: #000;
      font-size: 10px;
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
      align-items: center;
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
      gap: 4px;
      text-align: center;
      justify-content: center;
      padding-top: 8px;
    }
    .contact-info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
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
      font-size: 12px;
    }
    .contact-info-separator {
      color: #9ca3af;
      margin: 0 8px;
    }
    .social-icon {
      width: 16px;
      height: 16px;
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
      font-size: 10px;
      margin-bottom: 4px;
    }
    .biller-card .content {
      color: #000;
      font-size: 10px;
      line-height: 1.4;
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
          <div>www.oclservices.com</div>
          <span class="contact-info-separator">|</span>
          <div>info@oclservices.com</div>
          <span class="contact-info-separator">|</span>
          <div>+91 8453994809</div>
        </div>
        
        <!-- Row 3: Social Media -->
        <div class="contact-info-row">
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E" alt="Facebook" class="social-icon" /><span>@OCL services</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/%3E%3C/svg%3E" alt="Instagram" class="social-icon" /><span>@ocl_services</span></div>
          <span class="contact-info-separator">|</span>
          <div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" alt="LinkedIn" class="social-icon" /><span>@our-courier-and-logistics</span></div>
        </div>
      </div>
      <div class="invoice-badge">
        <div>Invoice</div>
      </div>
    </div>

    <!-- Biller and Bill To Section -->
    <div class="biller-section">
      <div class="biller-card">
        <div class="title">Biller</div>
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
        <div class="title">Bill To</div>
        <div class="content">
          <div class="font-medium">${corporate?.companyName || 'Corporate Client'}</div>
          <div>${corporate?.fullAddress || corporate?.companyAddress || 'Corporate Address'}</div>
          ${corporate?.gstNumber ? `<div>GSTIN/UIN: ${corporate.gstNumber}</div>` : ''}
          ${corporate?.state ? `<div>State: ${corporate.state}</div>` : ''}
          ${corporate?.contactNumber ? `<div>Contact: ${corporate.contactNumber}</div>` : ''}
          ${corporate?.email ? `<div>E-Mail: ${corporate.email}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="invoice-details-grid">
        <div>
          <span style="color: #4b5563;">Invoice Date:</span>
          <span class="font-medium">${invoiceDate}</span>
        </div>
        <div>
          <span style="color: #4b5563;">Invoice No.:</span>
          <span class="font-medium">${invoiceNumber}</span>
        </div>
        <div>
          <span style="color: #4b5563;">Invoice Period:</span>
          <span class="font-medium">${invoicePeriod}</span>
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

// Get settlement summary for corporate
router.get('/summary', authenticateCorporate, async (req, res) => {
  try {
    const summary = await Invoice.getInvoiceSummary(req.corporate._id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Settlement summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settlement summary'
    });
  }
});

// Get all invoices for corporate
router.get('/invoices', authenticateCorporate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { corporateId: req.corporate._id };
    if (status && ['unpaid', 'paid', 'overdue'].includes(status)) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Invoice.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

// Get specific invoice details
router.get('/invoices/:invoiceId', authenticateCorporate, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      corporateId: req.corporate._id
    });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice details'
    });
  }
});

// Generate invoice for unpaid shipments (Admin only)
router.post('/generate-invoice', authenticateAdmin, async (req, res) => {
  try {
    const { corporateId, startDate, endDate, shipments } = req.body;
    
    // Validate required fields
    if (!corporateId || !startDate || !endDate || !shipments || !Array.isArray(shipments)) {
      return res.status(400).json({
        success: false,
        error: 'Corporate ID, date range, and shipments are required'
      });
    }
    
    // Get corporate details
    const corporate = await CorporateData.findById(corporateId);
    if (!corporate) {
      return res.status(404).json({
        success: false,
        error: 'Corporate not found'
      });
    }
    
    // Check if invoice already exists for this period
    const existingInvoice = await Invoice.findOne({
      corporateId: corporateId,
      'invoicePeriod.startDate': new Date(startDate),
      'invoicePeriod.endDate': new Date(endDate)
    });
    
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        error: 'Invoice already exists for this period'
      });
    }
    
    // Get corporate pricing to get fuel charge percentage
    const CorporatePricing = (await import('../models/CorporatePricing.js')).default;
    const pricing = await CorporatePricing.findOne({ 
      corporateClient: corporateId,
      status: 'approved'
    });
    
    // Use fuel charge percentage from pricing, default to 15% if not found
    const fuelChargePercentage = pricing?.fuelChargePercentage || 15;
    
    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    
    // Calculate totals
    let subtotal = 0;
    let awbChargesTotal = 0;
    let fuelSurchargeTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    
    const processedShipments = shipments.map(shipment => {
      const freightCharges = parseFloat(shipment.freightCharges) || 0;
      const awbCharge = 50; // 50rs per AWB
      const fuelSurcharge = freightCharges * (fuelChargePercentage / 100); // Dynamic fuel surcharge percentage
      const cgst = freightCharges * 0.09; // 9% CGST
      const sgst = freightCharges * 0.09; // 9% SGST
      const totalAmount = freightCharges + awbCharge + fuelSurcharge + cgst + sgst;
      
      subtotal += freightCharges;
      awbChargesTotal += awbCharge;
      fuelSurchargeTotal += fuelSurcharge;
      cgstTotal += cgst;
      sgstTotal += sgst;
      
      return {
        consignmentNumber: shipment.consignmentNumber,
        bookingDate: new Date(shipment.bookingDate),
        destination: shipment.destination,
        serviceType: shipment.serviceType === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: parseFloat(shipment.weight) || 0,
        freightCharges: freightCharges,
        awbCharge: awbCharge,
        fuelSurcharge: fuelSurcharge,
        cgst: cgst,
        sgst: sgst,
        totalAmount: totalAmount
      };
    });
    
    const grandTotal = subtotal + awbChargesTotal + fuelSurchargeTotal + cgstTotal + sgstTotal;
    
    // Create invoice
    const invoice = new Invoice({
      invoiceNumber: invoiceNumber,
      corporateId: corporateId,
      companyName: corporate.companyName,
      companyAddress: corporate.fullAddress,
      gstNumber: corporate.gstNumber,
      state: corporate.state,
      stateCode: '18', // Default to Assam
      contactNumber: corporate.contactNumber,
      email: corporate.email,
      invoicePeriod: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      shipments: processedShipments,
      subtotal: subtotal,
      awbChargesTotal: awbChargesTotal,
      fuelSurchargeTotal: fuelSurchargeTotal,
      fuelChargePercentage: fuelChargePercentage,
      cgstTotal: cgstTotal,
      sgstTotal: sgstTotal,
      grandTotal: grandTotal,
      amountInWords: '', // Will be set by pre-save middleware
      status: 'unpaid',
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // 30 days from now
      termsAndConditions: [
        'Invoice Amount To Be Paid By Same Days From The Date Of Invoice',
        'Payment Should Be Crossed Account Payee Cheque/Demand Draft or Digital Transfer Our Courier & Logistics Services (I) Pvt.Ltd',
        'Interest @ 3% Per Month Will Be Charged On Payment'
      ],
      createdBy: req.admin._id
    });
    
    await invoice.save();
    
    // Mark shipments as invoiced
    const shipmentIds = shipments.map(s => s._id);
    await ConsignmentUsage.markAsInvoiced(shipmentIds, invoice._id);
    
    console.log(`✅ Invoice generated: ${invoiceNumber} for ${corporate.companyName}`);
    
    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        dueDate: invoice.dueDate,
        invoiceId: invoice._id
      }
    });
    
  } catch (error) {
    console.error('Generate invoice error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate invoice'
      });
    }
  }
});

// Mark invoice as paid (Admin only)
router.patch('/invoices/:invoiceId/mark-paid', authenticateAdmin, async (req, res) => {
  try {
    const { paymentMethod, paymentReference } = req.body;
    
    if (!paymentMethod || !paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Payment method and reference are required'
      });
    }
    
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    await invoice.markAsPaid(paymentMethod, paymentReference);
    invoice.lastModifiedBy = req.admin._id;
    await invoice.save();
    
    console.log(`✅ Invoice ${invoice.invoiceNumber} marked as paid`);
    
    res.json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference
      }
    });
    
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark invoice as paid'
    });
  }
});

// Get unpaid shipments for invoice generation (Admin only)
router.get('/unpaid-shipments/:corporateId', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    // Get unpaid shipments from consignment usage
    const unpaidShipments = await ConsignmentUsage.findUnpaidForInvoice(
      req.params.corporateId, 
      startDate, 
      endDate
    );
    
    // Format shipment data for invoice
    const formattedShipments = unpaidShipments.map(usage => {
      const bookingData = usage.bookingData;
      return {
        _id: usage._id,
        consignmentNumber: usage.consignmentNumber,
        bookingDate: usage.usedAt,
        destination: bookingData.destinationData?.city || 'N/A',
        serviceType: bookingData.shipmentData?.natureOfConsignment === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: bookingData.shipmentData?.actualWeight || bookingData.shipmentData?.chargeableWeight || 0,
        freightCharges: usage.freightCharges || 0,
        totalAmount: usage.totalAmount || 0
      };
    });
    
    res.json({
      success: true,
      data: {
        shipments: formattedShipments,
        totalShipments: formattedShipments.length,
        totalAmount: formattedShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      }
    });
    
  } catch (error) {
    console.error('Get unpaid shipments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unpaid shipments'
    });
  }
});

// Get consolidated invoice for admin (Admin only) - One invoice with all consignments
router.get('/admin/consolidated-invoice', authenticateAdmin, async (req, res) => {
  try {
    const { corporateId } = req.query;
    console.log('Admin consolidated invoice request - corporateId:', corporateId);
    
    if (!corporateId) {
      return res.status(400).json({
        success: false,
        error: 'Corporate ID is required'
      });
    }
    
    let actualCorporateId;
    
    // corporateId can be either ObjectId or string corporateId (like A00001)
    if (corporateId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      console.log('Using corporateId as ObjectId:', corporateId);
      actualCorporateId = corporateId;
    } else {
      // It's a string corporateId, need to find the actual ObjectId
      console.log('Looking up corporate by string corporateId:', corporateId);
      const CorporateData = (await import('../models/CorporateData.js')).default;
      const corporate = await CorporateData.findOne({ corporateId: corporateId });
      if (corporate) {
        console.log('Found corporate:', corporate.companyName, 'ObjectId:', corporate._id);
        actualCorporateId = corporate._id;
      } else {
        console.log('Corporate not found for corporateId:', corporateId);
        return res.json({
          success: true,
          data: {
            consolidatedInvoice: null,
            summary: {
              totalBills: 0,
              totalAmount: 0,
              totalFreight: 0,
              gstAmount: 0
            }
          }
        });
      }
    }
    
    // Get unpaid FP shipments (same query as corporate settlement)
    const query = {
      corporateId: actualCorporateId,
      paymentStatus: 'unpaid',
      paymentType: 'FP', // Only FP shipments are included in settlement
      status: 'active'
    };
    
    console.log('Querying ConsignmentUsage with:', query);
    
    const ConsignmentUsage = (await import('../models/ConsignmentAssignment.js')).ConsignmentUsage;
    const unpaidShipments = await ConsignmentUsage.find(query)
      .sort({ usedAt: 1 }) // Sort by date ascending
      .lean();
    
    console.log('Found unpaid shipments:', unpaidShipments.length);
    
    if (unpaidShipments.length === 0) {
      return res.json({
        success: true,
        data: {
          consolidatedInvoice: null,
          summary: {
            totalBills: 0,
            totalAmount: 0,
            totalFreight: 0,
            gstAmount: 0
          }
        }
      });
    }
    
    // Get corporate details
    const CorporateData = (await import('../models/CorporateData.js')).default;
    const corporate = await CorporateData.findById(actualCorporateId);
    
    // Format all shipments into a single consolidated invoice
    const shipments = unpaidShipments.map(usage => {
      const bookingData = usage.bookingData;
      return {
        _id: usage._id,
        consignmentNumber: usage.consignmentNumber,
        bookingReference: usage.bookingReference,
        bookingDate: usage.usedAt,
        destination: bookingData.destinationData?.city || 'N/A',
        serviceType: bookingData.shipmentData?.natureOfConsignment === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: bookingData.shipmentData?.actualWeight || bookingData.shipmentData?.chargeableWeight || 0,
        freightCharges: usage.freightCharges || 0,
        totalAmount: usage.totalAmount || 0,
        status: usage.status,
        paymentStatus: usage.paymentStatus
      };
    });
    
    // Calculate totals
    const totalAmount = unpaidShipments.reduce((sum, usage) => sum + (usage.totalAmount || 0), 0);
    const totalFreight = unpaidShipments.reduce((sum, usage) => sum + (usage.freightCharges || 0), 0);
    
    // Create consolidated invoice
    const consolidatedInvoice = {
      _id: `consolidated-${actualCorporateId}`,
      invoiceNumber: (() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;
        const currentYearShort = String(currentYear).slice(-2);
        const nextYearShort = String(nextYear).slice(-2);
        // Temporary serial for consolidated invoice (not saved to DB)
        const serial = '00001';
        return `${currentYearShort}-${nextYearShort}/${serial}`;
      })(),
      corporateId: actualCorporateId,
      companyName: corporate?.companyName || 'Unknown Company',
      companyAddress: corporate?.companyAddress || 'Unknown Address',
      gstNumber: corporate?.gstNumber || '',
      state: corporate?.state || 'Unknown',
      contactNumber: corporate?.contactNumber || '',
      email: corporate?.email || '',
      invoiceDate: new Date().toISOString(),
      invoicePeriod: {
        startDate: shipments.length > 0 ? shipments[0].bookingDate : new Date().toISOString(),
        endDate: shipments.length > 0 ? shipments[shipments.length - 1].bookingDate : new Date().toISOString()
      },
      shipments: shipments,
      subtotal: totalFreight,
      fuelSurchargeTotal: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      grandTotal: totalAmount,
      status: 'unpaid',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      amountInWords: 'Amount in words'
    };
    
    res.json({
      success: true,
      data: {
        consolidatedInvoice: consolidatedInvoice,
        summary: {
          totalBills: unpaidShipments.length,
          totalAmount: totalAmount,
          totalFreight: totalFreight,
          gstAmount: totalAmount - totalFreight
        }
      }
    });
    
  } catch (error) {
    console.error('Get admin consolidated invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consolidated invoice'
    });
  }
});

// Get all invoices (Admin only)
router.get('/admin/invoices', authenticateAdmin, async (req, res) => {
  try {
    const { corporateId, status, page = 1, limit = 10 } = req.query;
    console.log('Admin invoices request - corporateId:', corporateId, 'status:', status);
    
    const query = {};
    if (corporateId) {
      // corporateId can be either ObjectId or string corporateId (like A00001)
      // First try to find by ObjectId, if that fails, find by string corporateId
      if (corporateId.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId
        console.log('Using corporateId as ObjectId:', corporateId);
        query.corporateId = corporateId;
      } else {
        // It's a string corporateId, need to find the actual ObjectId
        console.log('Looking up corporate by string corporateId:', corporateId);
        const CorporateData = (await import('../models/CorporateData.js')).default;
        const corporate = await CorporateData.findOne({ corporateId: corporateId });
        if (corporate) {
          console.log('Found corporate:', corporate.companyName, 'ObjectId:', corporate._id);
          query.corporateId = corporate._id;
        } else {
          console.log('Corporate not found for corporateId:', corporateId);
          // Corporate not found, return empty result
          return res.json({
            success: true,
            data: {
              invoices: [],
              pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: parseInt(limit)
              }
            }
          });
        }
      }
    }
    if (status && ['unpaid', 'paid', 'overdue'].includes(status)) {
      query.status = status;
    }
    
    console.log('Final query:', query);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .populate('corporateId', 'companyName corporateId email contactNumber')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Invoice.countDocuments(query);
    console.log('Found invoices:', invoices.length, 'Total:', total);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

// Get overdue invoices (Admin only)
router.get('/admin/overdue', authenticateAdmin, async (req, res) => {
  try {
    const overdueInvoices = await Invoice.findOverdue()
      .populate('corporateId', 'companyName corporateId email contactNumber')
      .sort({ dueDate: 1 })
      .lean();
    
    res.json({
      success: true,
      data: overdueInvoices
    });
    
  } catch (error) {
    console.error('Get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue invoices'
    });
  }
});

// Get unpaid bills for corporate (Corporate users)
router.get('/unpaid-bills', authenticateCorporate, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.usedAt = {};
      if (startDate) {
        dateFilter.usedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        dateFilter.usedAt.$lt = endDateObj;
      }
    }
    
    // Get unpaid FP shipments with date filter (TP shipments are excluded from settlement)
    const query = {
      corporateId: req.corporate._id,
      paymentStatus: 'unpaid',
      paymentType: 'FP', // Only FP shipments are included in settlement
      status: 'active',
      ...dateFilter
    };
    
    const unpaidShipments = await ConsignmentUsage.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ConsignmentUsage.countDocuments(query);
    
    // Format shipment data for display
    const formattedBills = unpaidShipments.map(usage => {
      const bookingData = usage.bookingData;
      return {
        _id: usage._id,
        consignmentNumber: usage.consignmentNumber,
        bookingReference: usage.bookingReference,
        bookingDate: usage.usedAt,
        destination: bookingData.destinationData?.city || 'N/A',
        serviceType: bookingData.shipmentData?.natureOfConsignment === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: bookingData.shipmentData?.actualWeight || bookingData.shipmentData?.chargeableWeight || 0,
        freightCharges: usage.freightCharges || 0,
        totalAmount: usage.totalAmount || 0,
        status: usage.status,
        paymentStatus: usage.paymentStatus
      };
    });
    
    // Calculate totals
    const totalAmount = unpaidShipments.reduce((sum, usage) => sum + (usage.totalAmount || 0), 0);
    const totalFreight = unpaidShipments.reduce((sum, usage) => sum + (usage.freightCharges || 0), 0);
    
    res.json({
      success: true,
      data: {
        bills: formattedBills,
        summary: {
          totalBills: total,
          totalAmount: totalAmount,
          totalFreight: totalFreight,
          gstAmount: totalAmount - totalFreight
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get unpaid bills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unpaid bills'
    });
  }
});

// Generate consolidated invoice from unpaid bills (Corporate users)
router.post('/generate-invoice', authenticateCorporate, async (req, res) => {
  try {
    const { bills } = req.body;
    
    // Validate required fields
    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bills array is required and must not be empty'
      });
    }
    
    // Get all unpaid FP shipments for this corporate (TP shipments are excluded from settlement)
    const unpaidShipments = await ConsignmentUsage.find({
      _id: { $in: bills },
      corporateId: req.corporate._id,
      paymentStatus: 'unpaid',
      paymentType: 'FP', // Only FP shipments are included in settlement
      status: 'active'
    }).lean();
    
    if (unpaidShipments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No unpaid bills found for the specified IDs'
      });
    }
    
    // Get corporate details
    const corporate = await CorporateData.findById(req.corporate._id);
    if (!corporate) {
      return res.status(404).json({
        success: false,
        error: 'Corporate not found'
      });
    }
    
    // Get corporate pricing to get fuel charge percentage
    const CorporatePricing = (await import('../models/CorporatePricing.js')).default;
    const pricing = await CorporatePricing.findOne({ 
      corporateClient: req.corporate._id,
      status: 'approved'
    });
    
    // Use fuel charge percentage from pricing, default to 15% if not found
    const fuelChargePercentage = pricing?.fuelChargePercentage || 15;
    
    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    
    // Calculate totals
    let subtotal = 0;
    let awbChargesTotal = 0;
    let fuelSurchargeTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    
    let periodStartDate = null;
    let periodEndDate = null;

    const processedShipments = unpaidShipments.map(usage => {
      const bookingData = usage.bookingData || {};
      const rawBookingDate = bookingData.bookingDate || usage.usedAt || usage.createdAt;
      const bookingDateObj = rawBookingDate ? new Date(rawBookingDate) : null;
      if (bookingDateObj && !Number.isNaN(bookingDateObj.getTime())) {
        if (!periodStartDate || bookingDateObj < periodStartDate) {
          periodStartDate = bookingDateObj;
        }
        if (!periodEndDate || bookingDateObj > periodEndDate) {
          periodEndDate = bookingDateObj;
        }
      }

      const freightCharges = parseFloat(usage.freightCharges) || 0;
      const awbCharge = 50; // 50rs per AWB
      const fuelSurcharge = freightCharges * (fuelChargePercentage / 100); // Dynamic fuel surcharge percentage
      const cgst = freightCharges * 0.09; // 9% CGST
      const sgst = freightCharges * 0.09; // 9% SGST
      const totalAmount = freightCharges + awbCharge + fuelSurcharge + cgst + sgst;
      
      subtotal += freightCharges;
      awbChargesTotal += awbCharge;
      fuelSurchargeTotal += fuelSurcharge;
      cgstTotal += cgst;
      sgstTotal += sgst;
      
      return {
        consignmentNumber: usage.consignmentNumber,
        bookingDate: bookingDateObj ? bookingDateObj.toISOString() : null,
        destination: bookingData.destinationData?.city || 'N/A',
        serviceType: bookingData.shipmentData?.natureOfConsignment === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: bookingData.shipmentData?.actualWeight || bookingData.shipmentData?.chargeableWeight || 0,
        freightCharges: freightCharges,
        awbCharge: awbCharge,
        fuelSurcharge: fuelSurcharge,
        cgst: cgst,
        sgst: sgst,
        totalAmount: totalAmount
      };
    });
    
    const grandTotal = subtotal + awbChargesTotal + fuelSurchargeTotal + cgstTotal + sgstTotal;
    const totalBeforeTax = subtotal + awbChargesTotal + fuelSurchargeTotal;
    
    // Create invoice
    const invoice = new Invoice({
      invoiceNumber: invoiceNumber,
      corporateId: req.corporate._id,
      companyName: corporate.companyName,
      companyAddress: corporate.fullAddress,
      gstNumber: corporate.gstNumber,
      state: corporate.state,
      stateCode: '18', // Default to Assam
      contactNumber: corporate.contactNumber,
      email: corporate.email,
      invoicePeriod: {
        startDate: new Date(Math.min(...unpaidShipments.map(s => new Date(s.usedAt)))),
        endDate: new Date(Math.max(...unpaidShipments.map(s => new Date(s.usedAt))))
      },
      shipments: processedShipments,
      subtotal: subtotal,
      awbChargesTotal: awbChargesTotal,
      fuelSurchargeTotal: fuelSurchargeTotal,
      fuelChargePercentage: fuelChargePercentage,
      cgstTotal: cgstTotal,
      sgstTotal: sgstTotal,
      grandTotal: grandTotal,
      amountInWords: '', // Will be set by pre-save middleware
      status: 'unpaid',
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // 30 days from now
      termsAndConditions: [
        'Invoice Amount To Be Paid By Same Days From The Date Of Invoice',
        'Payment Should Be Crossed Account Payee Cheque/Demand Draft or Digital Transfer Our Courier & Logistics Services (I) Pvt.Ltd',
        'Interest @ 3% Per Month Will Be Charged On Payment'
      ],
      createdBy: req.corporate._id
    });
    
    await invoice.save();
    
    // Mark shipments as invoiced
    const shipmentIds = unpaidShipments.map(s => s._id);
    await ConsignmentUsage.markAsInvoiced(shipmentIds, invoice._id);
    
    console.log(`✅ Consolidated invoice generated: ${invoiceNumber} for ${corporate.companyName}`);
    
    res.json({
      success: true,
      message: 'Consolidated invoice generated successfully',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        dueDate: invoice.dueDate,
        invoiceId: invoice._id,
        totalBills: unpaidShipments.length
      }
    });
    
  } catch (error) {
    console.error('Generate consolidated invoice error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate consolidated invoice'
      });
    }
  }
});

// Download consolidated invoice (Corporate users)
router.get('/download-consolidated-invoice', authenticateCorporate, async (req, res) => {
  try {
    // Get all unpaid FP bills for this corporate (TP shipments are excluded from settlement)
    const unpaidShipments = await ConsignmentUsage.findUnpaidFPByCorporate(req.corporate._id).lean();
    
    if (unpaidShipments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No unpaid bills found'
      });
    }
    
    // Get corporate details
    const corporate = await CorporateData.findById(req.corporate._id);
    if (!corporate) {
      return res.status(404).json({
        success: false,
        error: 'Corporate not found'
      });
    }
    
    // Calculate totals matching Invoice.tsx logic exactly
    let periodStartDate = null;
    let periodEndDate = null;
    
    const processedShipments = unpaidShipments.map(usage => {
      const bookingData = usage.bookingData || {};
      const rawBookingDate = bookingData.bookingDate || usage.usedAt || usage.createdAt;
      const bookingDateObj = rawBookingDate ? new Date(rawBookingDate) : null;
      if (bookingDateObj && !Number.isNaN(bookingDateObj.getTime())) {
        if (!periodStartDate || bookingDateObj < periodStartDate) {
          periodStartDate = bookingDateObj;
        }
        if (!periodEndDate || bookingDateObj > periodEndDate) {
          periodEndDate = bookingDateObj;
        }
      }
      
      const freightCharges = parseFloat(usage.freightCharges) || 0;
      
      return {
        consignmentNumber: usage.consignmentNumber,
        bookingReference: usage.bookingReference,
        bookingDate: bookingDateObj ? bookingDateObj.toISOString() : usage.usedAt,
        destination: bookingData.destinationData?.city || 'N/A',
        serviceType: bookingData.shipmentData?.natureOfConsignment === 'DOX' ? 'DOX' : 'NON-DOX',
        weight: bookingData.shipmentData?.actualWeight || bookingData.shipmentData?.chargeableWeight || 0,
        freightCharges: freightCharges
      };
    });
    
    // Calculate totals matching Invoice.tsx exactly:
    // totalAmount = sum of (50 + freightCharges) for each item
    const totalAmount = processedShipments.reduce((sum, item) => sum + 50 + (item.freightCharges || 0), 0);
    // totalFreight = sum of freightCharges only
    const totalFreight = processedShipments.reduce((sum, item) => sum + (item.freightCharges || 0), 0);
    // fuelCharge = 10% of totalFreight (matching Invoice.tsx)
    const fuelCharge = totalFreight * 0.1;
    // subtotalAfterFuel = totalAmount + fuelCharge
    const subtotalAfterFuel = totalAmount + fuelCharge;
    
    // GST Logic based on state codes (matching Invoice.tsx exactly)
    const billerState = 'Assam';
    const corporateState = corporate?.state || '';
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
    
    // Create temporary invoice data for PDF generation (matching Invoice.tsx structure)
    const invoiceData = {
      invoiceNumber: (() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;
        const currentYearShort = String(currentYear).slice(-2);
        const nextYearShort = String(nextYear).slice(-2);
        // Temporary serial for consolidated invoice (not saved to DB)
        const serial = '00001';
        return `${currentYearShort}-${nextYearShort}/${serial}`;
      })(),
      invoiceDate: new Date(),
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      companyName: corporate.companyName,
      companyAddress: corporate.fullAddress,
      gstNumber: corporate.gstNumber,
      contactNumber: corporate.contactNumber,
      email: corporate.email,
      shipments: processedShipments,
      // Note: These fields are for reference only, actual calculations done in generateHTMLInvoice
      subtotal: totalFreight,
      awbChargesTotal: processedShipments.length * 50,
      fuelSurchargeTotal: fuelCharge,
      fuelChargePercentage: 10, // Fixed 10% to match Invoice.tsx
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: igst,
      totalBeforeTax: subtotalAfterFuel,
      grandTotal: grandTotal,
      invoicePeriod: {
        startDate: periodStartDate ? periodStartDate.toISOString() : null,
        endDate: periodEndDate ? periodEndDate.toISOString() : null
      },
      status: 'pending'
    };
    
    // Generate HTML invoice
    const htmlInvoice = generateHTMLInvoice(invoiceData, corporate);
    
    let browser;
    try {
      const { default: puppeteer } = await import('puppeteer');
      const executablePath = puppeteer.executablePath
        ? puppeteer.executablePath()
        : undefined;
      
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlInvoice, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('screen');
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.125in',
          bottom: '0.5in',
          left: '0.125in'
        },
        printBackground: true
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="consolidated-invoice-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
      return;
      
    } catch (error) {
      console.error('Primary PDF generation error (puppeteer):', error);
      if (browser) {
        await browser.close().catch(() => {});
        browser = null;
      }
      
      try {
        const htmlPdf = require('html-pdf');
        const fallbackBuffer = await new Promise((resolve, reject) => {
          htmlPdf
            .create(htmlInvoice, {
              format: 'A4',
              border: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
              },
              type: 'pdf',
              timeout: 30000
            })
            .toBuffer((err, buffer) => {
              if (err) {
                return reject(err);
              }
              resolve(buffer);
            });
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="consolidated-invoice-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(fallbackBuffer);
        return;
        
      } catch (fallbackError) {
        console.error('Fallback PDF generation error (html-pdf):', fallbackError);
        res.status(500).json({
          success: false,
          error: 'Failed to generate consolidated invoice PDF',
          details: fallbackError.message || 'Unknown error'
        });
        return;
      }
      
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
    
  } catch (error) {
    console.error('Download consolidated invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download consolidated invoice'
    });
  }
});

export default router;

