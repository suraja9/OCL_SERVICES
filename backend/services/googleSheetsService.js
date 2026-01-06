import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Google Sheets Service for syncing settlement data
 */
class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }

  /**
   * Initialize Google Sheets API client
   */
  async initialize() {
    try {
      // Path to service account credentials
      const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error('Google credentials file not found. Please add google-credentials.json to the backend directory.');
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      // Create auth client
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Create sheets client
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });

      return true;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Sync medicine booking data to Google Sheets in Excel format
   * @param {Array} bookings - Array of booking documents with populated fields
   */
  /**
   * Map booking status to Google Sheets status format
   * @param {string} bookingStatus - Status from booking
   * @returns {string} - Mapped status for Google Sheets
   */
  mapBookingStatus(bookingStatus) {
    const statusMap = {
      'delivered': 'DLVD',
      'arrived': 'ARRIVED',
      'Arrived at Hub': 'ARRIVED',
      'in_transit': 'IN TRANSIT',
      'confirmed': 'CONFIRMED',
      'pending': 'PENDING',
      'Booked': 'BOOKED',
      'Ready to Dispatch': 'READY TO DISPATCH',
      'cancelled': 'CANCELLED'
    };
    return statusMap[bookingStatus] || bookingStatus.toUpperCase() || 'PENDING';
  }

  async syncMedicineBookings(bookings) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not configured in environment variables');
      }

      const sheetName = 'Medicine_Deliveries';

      // Check if sheet exists, create if not
      await this.ensureSheetExists(sheetName);

      // Read existing sheet data
      let existingRows = [];
      let existingDataMap = new Map(); // Map of docket number -> row index
      let totalsStartRow = -1; // Track where totals rows start
      let hasHeader = false;
      
      try {
        const existingData = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:AI`,
        });
        
        if (existingData.data.values && existingData.data.values.length > 0) {
          existingRows = existingData.data.values;
          
          // Check if first row is header
          const firstRow = existingRows[0] || [];
          hasHeader = firstRow.includes('STATUS') && firstRow.includes('Docket No.');
          
          if (hasHeader) {
            // Find header row and totals start row
            const headers = firstRow;
            const docketNoIndex = headers.indexOf('Docket No.');
            
            // Build map of docket numbers to row indices (skip header row)
            for (let i = 1; i < existingRows.length; i++) {
              const row = existingRows[i];
              if (row && row.length > docketNoIndex && row[docketNoIndex]) {
                const docketNo = String(row[docketNoIndex]).trim();
                // Check if this is a totals row (has "WILL PAY", "NOT PAID", etc. in Payment Upd column)
                const paymentUpdIndex = headers.indexOf('Payment Upd');
                if (paymentUpdIndex >= 0 && row[paymentUpdIndex] && 
                    ['WILL PAY', 'NOT PAID', 'PAID', 'PAID @'].includes(String(row[paymentUpdIndex]).trim())) {
                  if (totalsStartRow === -1) {
                    totalsStartRow = i;
                  }
                  break;
                }
                if (docketNo && !isNaN(parseInt(docketNo))) {
                  existingDataMap.set(docketNo, i);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('No existing data found or error reading sheet, will create new:', error.message);
      }

      // Prepare header row with all columns from Excel
      const headers = [
        'STATUS', 'DSTN:', 'Pckup Dt:', 'AWB Dt:', 'Forwarding Dt:', 'Arrived Dt.', 'DLV DT.',
        'Co-Loader', 'Co-Loader Bus No.', 'Co-Loader Docket No.', 'CoLdr Mob. No.', 'Docket No.',
        'Sender Add.', 'Sender Ph. No.', 'Recipients', 'ADDRESS', 'DLV Area',
        'M No. 1', 'Mob No. 2', 'Units', 'Weight',
        'TO PAY INR', 'INV No.', 'GST', 'Total',
        'Payment Upd', 'Amount Collected', 'UPI Ref: No.', 'Payment Dt:',
        'Remarks', 'FU Date:', 'FUp Time:', 'Receiver Name', 'Receiver Mob No.', 'POD'
      ];

      // Create header if sheet is empty
      if (!hasHeader && existingRows.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [headers]
          }
        });
        existingRows = [headers];
        hasHeader = true;
      }
      const statusUpdates = []; // Array of {range, value} for status updates
      const newBookings = []; // Bookings that need new rows

      // Track totals
      let totalWeightSum = 0;
      let totalToPaySum = 0;

      // Process each booking
      bookings.forEach(booking => {
        // 1. STATUS - from booking.status (using new mapping function)
        const status = this.mapBookingStatus(booking.status);

        // 2. DSTN (Destination - full city name)
        const dstn = booking.destination?.city || '';

        // 3. Pickup Date (booking creation date)
        const pickupDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GB') : '';

        // 4. AWB Date (same as pickup for now)
        const awbDate = pickupDate;

        // 5. Forwarding Date (dispatch date - from manifest createdAt if available)
        let forwardingDate = '';
        if (booking.manifestId && booking.manifestId.createdAt) {
          forwardingDate = new Date(booking.manifestId.createdAt).toLocaleDateString('en-GB');
        }

        // 6. Arrived Date - set when status is 'arrived' or 'Arrived at Hub'
        let arrivedDate = '';
        if ((booking.status === 'arrived' || booking.status === 'Arrived at Hub') && booking.updatedAt) {
          arrivedDate = new Date(booking.updatedAt).toLocaleDateString('en-GB');
        }

        // 7. Delivery Date (blank for now)
        const deliveryDate = '';

        // 8-11. Co-Loader info
        const coLoader = 'BY BUS'; // Default as requested
        const coLoaderBusNo = booking.coloaderId?.busNumber || '';
        const coLoaderDocketNo = booking.manifestId?.coloaderDocketNo || '';
        const coLoaderMobNo = booking.coloaderId?.phoneNumber || '';

        // 12. Docket No (Consignment Number)
        const docketNo = booking.consignmentNumber || '';

        // 13-14. Sender Info
        let senderAdd = '';
        if (booking.origin) {
          const parts = [];
          if (booking.origin.companyName) parts.push(booking.origin.companyName);
          if (booking.origin.flatBuilding) parts.push(booking.origin.flatBuilding);
          if (booking.origin.locality) parts.push(booking.origin.locality);
          if (booking.origin.city) parts.push(booking.origin.city);
          senderAdd = parts.join(', ');
        }
        const senderPhNo = booking.origin?.mobileNumber || '';

        // 15-16. Recipient Info
        const recipients = booking.destination?.companyName || booking.destination?.name || '';
        let recipientAddress = '';
        if (booking.destination) {
          const parts = [];
          if (booking.destination.flatBuilding) parts.push(booking.destination.flatBuilding);
          if (booking.destination.locality) parts.push(booking.destination.locality);
          if (booking.destination.landmark) parts.push(booking.destination.landmark);
          recipientAddress = parts.join(', ');
        }

        // 17. Delivery Area (locality from destination - the dropdown selected after pincode)
        const dlvArea = booking.destination?.locality || '';

        // 18-19. Mobile Numbers
        const mNo1 = booking.destination?.mobileNumber || '';
        const mobNo2 = ''; // No second mobile in DB

        // 20-21. Units and Weight
        const units = booking.package?.totalPackages || '';
        const weight = parseFloat(booking.shipment?.actualWeight || booking.shipment?.chargeableWeight || 0);
        
        // 22-25. Payment Info
        const toPayINR = parseFloat(booking.charges?.grandTotal || 0);
        const invNo = booking.invoice?.invoiceNumber || '';
        const gst = ''; // Calculate if needed: SGST + CGST + IGST
        const total = booking.charges?.grandTotal || '';

        // Add to totals
        totalWeightSum += weight;
        totalToPaySum += toPayINR;

        // 26-29. Payment Status (blank for now)
        const paymentUpd = '';
        const amountCollected = '';
        const upiRefNo = '';
        const paymentDt = '';

        // 30-35. Delivery Tracking (blank for now)
        const remarks = '';
        const fuDate = '';
        const fupTime = '';
        const receiverName = '';
        const receiverMobNo = '';
        const pod = '';

        // Check if this booking already exists in the sheet
        const docketNoStr = String(docketNo).trim();
        if (docketNoStr && existingDataMap.has(docketNoStr)) {
          // Booking exists - update status only
          const rowIndex = existingDataMap.get(docketNoStr);
          // STATUS is column A (index 0), row is 1-indexed in Google Sheets
          const statusRange = `${sheetName}!A${rowIndex + 1}`;
          statusUpdates.push({
            range: statusRange,
            value: status
          });
        } else {
          // New booking - add to new bookings array
          newBookings.push({
            status, dstn, pickupDate, awbDate, forwardingDate, arrivedDate, deliveryDate,
            coLoader, coLoaderBusNo, coLoaderDocketNo, coLoaderMobNo, docketNo,
            senderAdd, senderPhNo, recipients, recipientAddress, dlvArea,
            mNo1, mobNo2, units, weight,
            toPayINR, invNo, gst, total,
            paymentUpd, amountCollected, upiRefNo, paymentDt,
            remarks, fuDate, fupTime, receiverName, receiverMobNo, pod
          });
        }
      });

      // Update statuses for existing rows
      if (statusUpdates.length > 0) {
        // Batch update statuses
        const updateRequests = statusUpdates.map(update => ({
          range: update.range,
          values: [[update.value]]
        }));

        // Use batchUpdate for multiple status updates
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'USER_ENTERED',
            data: updateRequests
          }
        });
        console.log(`✅ Updated status for ${statusUpdates.length} existing bookings`);
      }

      // Append new bookings if any
      if (newBookings.length > 0) {
        // Determine where to append (before totals rows)
        let appendStartRow = totalsStartRow > 0 ? totalsStartRow : (existingRows.length > 0 ? existingRows.length : 1);
        
        // Prepare new rows data
        const newRows = newBookings.map(booking => [
          booking.status, booking.dstn, booking.pickupDate, booking.awbDate, booking.forwardingDate, 
          booking.arrivedDate, booking.deliveryDate,
          booking.coLoader, booking.coLoaderBusNo, booking.coLoaderDocketNo, booking.coLoaderMobNo, booking.docketNo,
          booking.senderAdd, booking.senderPhNo, booking.recipients, booking.recipientAddress, booking.dlvArea,
          booking.mNo1, booking.mobNo2, booking.units, booking.weight,
          booking.toPayINR, booking.invNo, booking.gst, booking.total,
          booking.paymentUpd, booking.amountCollected, booking.upiRefNo, booking.paymentDt,
          booking.remarks, booking.fuDate, booking.fupTime, booking.receiverName, booking.receiverMobNo, booking.pod
        ]);

        // If totals exist, insert rows before them, otherwise append at the end
        if (totalsStartRow > 0) {
          // Insert empty rows first
          const sheetId = await this.getSheetId(sheetName);
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: [{
                insertDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: totalsStartRow,
                    endIndex: totalsStartRow + newRows.length
                  },
                  inheritFromBefore: false
                }
              }]
            }
          });
        }

        // Write new rows data
        const appendRange = `${sheetName}!A${appendStartRow + 1}`;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: appendRange,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: newRows
          }
        });
        console.log(`✅ Added ${newBookings.length} new bookings to sheet`);
      }

      // Re-read sheet to get updated row count for formatting
      let finalRowCount = existingRows.length;
      if (newBookings.length > 0) {
        finalRowCount += newBookings.length;
      }

      // Format the sheet with colored status cells
      await this.formatMedicineSheet(sheetName, finalRowCount, totalWeightSum, totalToPaySum);

      const updatedCount = statusUpdates.length;
      const addedCount = newBookings.length;
      let message = '';
      if (updatedCount > 0 && addedCount > 0) {
        message = `Updated ${updatedCount} booking statuses and added ${addedCount} new bookings to Google Sheets: ${sheetName}`;
      } else if (updatedCount > 0) {
        message = `Updated ${updatedCount} booking statuses in Google Sheets: ${sheetName}`;
      } else if (addedCount > 0) {
        message = `Added ${addedCount} new bookings to Google Sheets: ${sheetName}`;
      } else {
        message = `No changes needed. All ${bookings.length} bookings are already synced: ${sheetName}`;
      }

      return {
        success: true,
        message: message,
        sheetName,
        rowsUpdated: updatedCount,
        rowsAdded: addedCount,
        totalBookings: bookings.length
      };
    } catch (error) {
      console.error('Error syncing medicine bookings to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Sync settlement data to Google Sheets
   * @param {Object} settlementData - Settlement data to sync
   * @param {number} month - Settlement month
   * @param {number} year - Settlement year
   */
  async syncSettlementData(settlementData, month, year) {
    try {
      if (!this.sheets) {
        await this.initialize();
      }

      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not configured in environment variables');
      }

      const { settlements, grandTotal, totalWeight, totalCommission, oclCharge, remainingBalance, totalTransactions } = settlementData;

      // Get month name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[month - 1];
      const sheetName = `${monthName} ${year}`;

      // Check if sheet exists, create if not
      await this.ensureSheetExists(sheetName);

      // Prepare data rows
      const rows = [
        // Header section
        [`Settlement Statement - ${monthName} ${year}`],
        [''],
        // Summary section
        ['Summary'],
        ['Total Transactions', totalTransactions],
        ['Total Weight (KG)', totalWeight ? totalWeight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'],
        ['Total Commission', `₹${(totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Grand Total (To Pay INR)', `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['OCL Charge', `₹${oclCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Remaining Balance', `₹${remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        [''],
        // Table headers
        ['Date', 'Consignment #', 'Sender', 'Receiver', 'Payment By', 'Weight (KG)', 'Commission (₹)', 'Amount (₹)'],
      ];

      // Add settlement data rows
      settlements.forEach(item => {
        const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        
        rows.push([
          date,
          item.consignmentNumber,
          item.senderName,
          item.receiverName,
          item.paidBy === 'sender' ? 'Sender' : 'Receiver',
          item.weight || 0,
          item.commission || 0,
          item.cost
        ]);
      });

      // Add total row
      rows.push([
        '',
        '',
        '',
        '',
        'Totals:',
        totalWeight || 0,
        totalCommission || 0,
        grandTotal
      ]);

      // Clear and replace the entire sheet content (not append)
      const range = `${sheetName}!A1`;
      
      // Clear existing content first
      try {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:Z`,
        });
      } catch (error) {
        console.log('Sheet might be empty, proceeding...');
      }

      // Update with new data (replaces entire content)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: rows,
        },
      });

      // Format the sheet
      await this.formatSettlementSheet(sheetName, 1, rows.length);

      return {
        success: true,
        message: `Settlement data synced to Google Sheets: ${sheetName}`,
        sheetName,
        rowsAdded: rows.length
      };
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get sheet ID by sheet name
   * @param {string} sheetName - Name of the sheet
   * @returns {number} - Sheet ID
   */
  async getSheetId(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return sheet.properties.gridProperties?.sheetId || sheet.properties.sheetId;
    } catch (error) {
      console.error('Error getting sheet ID:', error);
      throw error;
    }
  }

  /**
   * Ensure sheet exists in the spreadsheet
   * @param {string} sheetName - Name of the sheet
   */
  async ensureSheetExists(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheets = response.data.sheets;
      const sheetExists = sheets.some(sheet => sheet.properties.title === sheetName);

      if (!sheetExists) {
        // Create new sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            }],
          },
        });
      }
    } catch (error) {
      console.error('Error ensuring sheet exists:', error);
      throw error;
    }
  }

  /**
   * Format the settlement sheet with styling
   * @param {string} sheetName - Name of the sheet
   * @param {number} startRow - Starting row number (1-indexed)
   * @param {number} numRows - Number of rows
   */
  async formatSettlementSheet(sheetName, startRow, numRows) {
    try {
      // Get sheet ID
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.gridProperties?.sheetId || sheet.properties.sheetId;

      const requests = [
        // Bold the header row (title) - row 1
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 8,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 14 },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        },
        // Bold summary section - row 3
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 2,
              endRowIndex: 3,
              startColumnIndex: 0,
              endColumnIndex: 8,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        },
        // Bold table headers - row 11 (updated from row 9)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 10,
              endRowIndex: 11,
              startColumnIndex: 0,
              endColumnIndex: 8,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // Auto-resize columns
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 8,
            },
          },
        },
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { requests },
      });
    } catch (error) {
      console.error('Error formatting settlement sheet:', error);
      // Don't throw error for formatting issues
    }
  }

  /**
   * Format the sheet with styling (legacy function for backward compatibility)
   * @param {string} sheetName - Name of the sheet
   * @param {number} startRow - Starting row number (1-indexed)
   * @param {number} numRows - Number of rows
   */
  async formatSheet(sheetName, startRow, numRows) {
    // Use the new settlement sheet formatter
    return this.formatSettlementSheet(sheetName, startRow, numRows);
  }

  /**
   * Format the medicine bookings sheet with styling
   * @param {string} sheetName - Name of the sheet
   * @param {number} numRows - Number of rows
   * @param {number} totalWeightSum - Total weight sum (optional)
   * @param {number} totalToPaySum - Total to pay sum (optional)
   */
  async formatMedicineSheet(sheetName, numRows, totalWeightSum = 0, totalToPaySum = 0) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.gridProperties?.sheetId || sheet.properties.sheetId;

      // Calculate row indices for status cells (Payment Upd column is index 24)
      const totalsRowIndex = numRows - 5; // First totals row
      const willPayRow1 = numRows - 4;
      const willPayRow2 = numRows - 3;
      const notPaidRow = numRows - 2;
      const paidRow = numRows - 1;

      const requests = [
        // Freeze header row
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Format header row - green background with bold black text
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 35,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.286, green: 0.525, blue: 0.91 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Format "WILL PAY" cell (first one) - Green background
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: totalsRowIndex,
              endRowIndex: totalsRowIndex + 1,
              startColumnIndex: 24, // Payment Upd column
              endColumnIndex: 25,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0, green: 1, blue: 0 }, // Bright green
                textFormat: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Format "WILL PAY" cells (rows below totals) - Green background
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: willPayRow1,
              endRowIndex: willPayRow2 + 1,
              startColumnIndex: 24,
              endColumnIndex: 25,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0, green: 1, blue: 0 }, // Bright green
                textFormat: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Format "NOT PAID" cell - Yellow background
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: notPaidRow,
              endRowIndex: notPaidRow + 1,
              startColumnIndex: 24,
              endColumnIndex: 25,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 1, blue: 0 }, // Yellow
                textFormat: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Format "PAID" cell - Purple background
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: paidRow,
              endRowIndex: paidRow + 1,
              startColumnIndex: 24,
              endColumnIndex: 25,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.6, green: 0, blue: 0.6 }, // Purple
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Auto-resize all columns
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 35,
            },
          },
        },
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { requests },
      });
    } catch (error) {
      console.error('Error formatting medicine sheet:', error);
      // Don't throw error for formatting issues
    }
  }

  /**
   * Sync sales forms data to Google Sheets
   * @param {Array} salesForms - Array of sales form documents
   */
  async syncSalesForms(salesForms) {
    try {
      if (!salesForms || salesForms.length === 0) {
        throw new Error('No sales forms provided to sync');
      }

      if (!this.sheets) {
        await this.initialize();
      }

      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not configured in environment variables');
      }

      const sheetName = 'Sales_Forms';

      // Check if sheet exists, create if not
      await this.ensureSheetExists(sheetName);

      // Prepare header row
      const headers = [
        'Submission Date',
        'Company Name',
        'Concern Person',
        'Designation',
        'Phone Number',
        'Alternate Phone',
        'Email Address',
        'Website',
        'Full Address',
        'City',
        'State',
        'Pincode',
        'Type of Business',
        'Type of Shipments',
        'Average Shipment Volume',
        'Most Frequent Routes',
        'Weight Range',
        'Packing Required',
        'Existing Logistics Partners',
        'Current Issues',
        'Vehicles Needed/Month',
        'Type of Vehicle Required',
        'Status',
        'Submitted By',
        'Submission City',
        'Submission State',
        'Submission Country',
        'Submission Full Address',
        'Submission IP',
        'Notes',
        'Updated Date'
      ];

      // Prepare data rows
      const rows = salesForms.map(form => {
        const submissionDate = form.createdAt 
          ? new Date(form.createdAt).toLocaleString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';
        
        const updatedDate = form.updatedAt 
          ? new Date(form.updatedAt).toLocaleString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        return [
          submissionDate,
          form.companyName || '',
          form.concernPersonName || '',
          form.designation || '',
          form.phoneNumber || '',
          form.alternatePhoneNumber || '',
          form.emailAddress || '',
          form.website || '',
          form.fullAddress || '',
          form.city || '',
          form.state || '',
          form.pincode || '',
          form.typeOfBusiness || '',
          form.typeOfShipments || '',
          form.averageShipmentVolume || '',
          form.mostFrequentRoutes || '',
          form.weightRange || '',
          form.packingRequired || '',
          form.existingLogisticsPartners || '',
          form.currentIssues || '',
          form.vehiclesNeededPerMonth || '',
          form.typeOfVehicleRequired || '',
          form.status || 'pending',
          form.submittedByName || '',
          form.submissionCity || '',
          form.submissionState || '',
          form.submissionCountry || '',
          form.submissionFullAddress || '',
          form.submissionIpAddress || '',
          form.notes || '',
          updatedDate
        ];
      });

      // Clear existing content
      try {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:Z`,
        });
      } catch (error) {
        console.log('Sheet might be empty, proceeding...');
      }

      // Write header and data
      const allRows = [headers, ...rows];
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: allRows,
        },
      });

      // Format the sheet
      await this.formatSalesFormsSheet(sheetName, allRows.length);

      return {
        success: true,
        message: `Synced ${salesForms.length} sales forms to Google Sheets: ${sheetName}`,
        sheetName,
        rowsAdded: allRows.length,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`
      };
    } catch (error) {
      console.error('Error syncing sales forms to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Format the sales forms sheet with styling
   * @param {string} sheetName - Name of the sheet
   * @param {number} numRows - Number of rows
   */
  async formatSalesFormsSheet(sheetName, numRows) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.gridProperties?.sheetId || sheet.properties.sheetId;

      const requests = [
        // Freeze header row
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Format header row - blue background with bold white text
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 31,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'WRAP'
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
          },
        },
        // Format status column (column 23, index 22) with color coding
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: numRows,
              startColumnIndex: 22,
              endColumnIndex: 23,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
          },
        },
        // Add alternating row colors for better readability
        ...Array.from({ length: Math.ceil((numRows - 1) / 2) }, (_, i) => ({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1 + (i * 2),
              endRowIndex: Math.min(2 + (i * 2), numRows),
              startColumnIndex: 0,
              endColumnIndex: 31,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        })),
        // Auto-resize all columns
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 31,
            },
          },
        },
        // Set column widths for better visibility
        {
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 31,
            },
            properties: {
              pixelSize: 120
            },
            fields: 'pixelSize'
          }
        }
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { requests },
      });

      // Apply conditional formatting for status column (only if there are data rows)
      if (numRows <= 1) {
        return; // No data rows to format
      }

      const statusConditionalFormatting = [
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: numRows,
                startColumnIndex: 22,
                endColumnIndex: 23,
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'pending' }]
                },
                format: {
                  backgroundColor: { red: 1, green: 0.9, blue: 0.1 }, // Yellow
                  textFormat: { foregroundColor: { red: 0, green: 0, blue: 0 }, bold: true }
                }
              }
            },
            index: 0
          }
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: numRows,
                startColumnIndex: 22,
                endColumnIndex: 23,
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'seen' }]
                },
                format: {
                  backgroundColor: { red: 0.7, green: 0.5, blue: 0.9 }, // Purple
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              }
            },
            index: 1
          }
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: numRows,
                startColumnIndex: 22,
                endColumnIndex: 23,
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'in_progress' }]
                },
                format: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1 }, // Blue
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              }
            },
            index: 2
          }
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: numRows,
                startColumnIndex: 22,
                endColumnIndex: 23,
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'completed' }]
                },
                format: {
                  backgroundColor: { red: 0.1, green: 0.8, blue: 0.3 }, // Green
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              }
            },
            index: 3
          }
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: numRows,
                startColumnIndex: 22,
                endColumnIndex: 23,
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'rejected' }]
                },
                format: {
                  backgroundColor: { red: 1, green: 0.3, blue: 0.3 }, // Red
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              }
            },
            index: 4
          }
        }
      ];

      try {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: { requests: statusConditionalFormatting },
        });
      } catch (error) {
        console.warn('Could not apply conditional formatting:', error);
      }
    } catch (error) {
      console.error('Error formatting sales forms sheet:', error);
      // Don't throw error for formatting issues
    }
  }
}

export default new GoogleSheetsService();
