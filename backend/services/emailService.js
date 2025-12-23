import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import S3Service from './s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EmailService {
  constructor() {
    this.oauth2Client = null;
    this.transporter = null;
    this.isInitialized = false;
    this.initializeEmailService();
  }

  async initializeEmailService() {
    try {
      // Try SMTP first if credentials are available
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('📧 Using Gmail SMTP configuration...');
        this.initializeSMTPFallback();
      } else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        console.log('📧 Using Google OAuth configuration...');
        await this.initializeOAuth();
      } else {
        console.log('⚠️ No email credentials found, using default SMTP fallback');
        this.initializeSMTPFallback();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      console.log('🔄 Falling back to SMTP configuration...');
      this.initializeSMTPFallback();
      this.isInitialized = true;
    }
  }

  async initializeOAuth() {
    try {
      // Initialize OAuth2 client (using the same client as login)
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID, // This should be your login OAuth client ID
        process.env.GOOGLE_CLIENT_SECRET, // This should be your login OAuth client secret
        'urn:ietf:wg:oauth:2.0:oob' // For installed applications
      );

      // Set refresh token if available
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
      }

      // Create transporter with OAuth2
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
          clientId: this.oauth2Client._clientId,
          clientSecret: this.oauth2Client._clientSecret,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: null // Will be set automatically
        }
      });

      console.log('✅ Google OAuth email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google OAuth email service:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  initializeSMTPFallback() {
    console.log('🔄 Falling back to SMTP configuration...');
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'your-email@gmail.com',
          pass: process.env.SMTP_PASS || 'your-app-password'
        }
      });
      console.log('✅ SMTP transporter created successfully');
    } catch (error) {
      console.error('❌ Failed to create SMTP transporter:', error);
      throw error;
    }
  }

  // Derive invoice number in the same way as the customer dashboard
  getInvoiceNumberFromBooking(booking = {}) {
    if (!booking || typeof booking !== 'object') {
      return '—';
    }

    const providedInvoice =
      booking?.shipment?.invoiceNumber ||
      booking?.invoiceNumber;

    if (providedInvoice && String(providedInvoice).trim() !== '') {
      return String(providedInvoice).trim();
    }

    const dateSource = booking.createdAt || booking.bookingDate || booking.updatedAt;
    const parsedDate = dateSource ? new Date(dateSource) : new Date();
    const referenceDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const currentYear = referenceDate.getFullYear();
    const nextYear = currentYear + 1;
    const fiscalYear = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;

    const bookingReferenceDigits = booking.bookingReference
      ? String(booking.bookingReference).replace(/\D/g, '')
      : '';

    const fallbackSerial = bookingReferenceDigits ||
      (booking._id ? String(booking._id).slice(-5) : '') ||
      '00000';

    const serial = fallbackSerial.slice(-5).padStart(5, '0');

    return `${fiscalYear}/${serial}`;
  }

  // Generate OAuth2 authorization URL for initial setup
  generateAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      console.log('✅ OAuth2 tokens obtained successfully');
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('Add this to your .env file: GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);

      return tokens;
    } catch (error) {
      console.error('❌ Error getting tokens:', error);
      throw error;
    }
  }

  // Generate HTML email template for pricing approval
  generatePricingApprovalEmail(pricingData, approvalUrl, rejectionUrl) {
    const { name, clientName, clientCompany, doxPricing, nonDoxSurfacePricing, nonDoxAirPricing, priorityPricing, reversePricing } = pricingData;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Corporate Pricing Approval - ${name}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                border:1px solid black;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            .pricing-section {
                margin: 25px 0;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
            }
            .pricing-header {
                background-color: #f8f9fa;
                padding: 15px 20px;
                font-weight: bold;
                color: #495057;
                border-bottom: 1px solid #e0e0e0;
            }
            .pricing-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
            }
            .pricing-table th,
            .pricing-table td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
            }
            .pricing-table th {
                background-color: #f8f9fa;
                font-weight: 600;
                color: #495057;
            }
            .pricing-table tr:hover {
                background-color: #f8f9fa;
            }
            .action-buttons {
                text-align: center;
                margin: 40px 0;
                padding: 30px;
                background-color: #f8f9fa;
                border-radius: 8px;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                margin: 0 10px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
            }
            .btn-approve {
                background-color: #28a745;
                color: white;
            }
            .btn-approve:hover {
                background-color: #218838;
                transform: translateY(-2px);
            }
            .btn-reject {
                background-color: #dc3545;
                color: white;
            }
            .btn-reject:hover {
                background-color: #c82333;
                transform: translateY(-2px);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .company-info {
                margin: 20px 0;
                padding: 20px;
                background-color: #e3f2fd;
                border-radius: 8px;
                border-left: 4px solid #2196f3;
            }
            .urgent-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Corporate Pricing Approval</h1>
                <p>OCL Services</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear ${clientName || 'Valued Client'},
                </div>
                
                <p>We are pleased to present the corporate pricing proposal for <strong>${clientCompany || 'your company'}</strong>. Please review the pricing details below and take action to approve or reject this proposal.</p>
                
                

                <div class="company-info">
                    <h3>📊 Pricing Proposal: ${name}</h3>
                    <p><strong>Proposal Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Company:</strong> ${clientCompany || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${clientName || 'N/A'}</p>
                </div>

                ${this.generatePricingTables(doxPricing, nonDoxSurfacePricing, nonDoxAirPricing, priorityPricing, reversePricing)}

                <div class="action-buttons">
                    <h3>🎯 Take Action</h3>
                    <p>Please review the pricing details above and choose your response:</p>
                    <a href="${approvalUrl}" class="btn btn-approve">✅ Approve Pricing</a>
                    <a href="${rejectionUrl}" class="btn btn-reject">❌ Reject Pricing</a>
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h4>📞 Need Help?</h4>
                    <p>If you have any questions about this pricing proposal, please contact our corporate team:</p>
                    <ul>
                        <li><strong>Email:</strong> corporate@oclcourier.com</li>
                        <li><strong>Phone:</strong> +91-XXX-XXXX-XXXX</li>
                        <li><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated message from OCL.</p>
                <p>Please do not reply to this email. For support, contact us at info@oclservices.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate pricing tables HTML
  generatePricingTables(doxPricing, nonDoxSurfacePricing, nonDoxAirPricing, priorityPricing, reversePricing) {
    let html = '';

    // DOX Pricing Table
    if (doxPricing) {
      html += `
        <div class="pricing-section">
          <div class="pricing-header">📦 Standard Service - DOX Pricing</div>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Weight Range</th>
                <th>Assam</th>
                <th>NE by Surface</th>
                <th>NE by Air (Agent Import)</th>
                <th>Rest of India</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(doxPricing).map(([weight, prices]) => `
                <tr>
                  <td><strong>${weight}</strong></td>
                  <td>₹${prices.assam || 0}</td>
                  <td>₹${prices.neBySurface || 0}</td>
                  <td>₹${prices.neByAirAgtImp || 0}</td>
                  <td>₹${prices.restOfIndia || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // NON DOX Surface Pricing
    if (nonDoxSurfacePricing) {
      html += `
        <div class="pricing-section">
          <div class="pricing-header">🚛 NON DOX Surface Pricing</div>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Assam</th>
                <th>NE by Surface</th>
                <th>NE by Air (Agent Import)</th>
                <th>Rest of India</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>₹${nonDoxSurfacePricing.assam || 0}</td>
                <td>₹${nonDoxSurfacePricing.neBySurface || 0}</td>
                <td>₹${nonDoxSurfacePricing.neByAirAgtImp || 0}</td>
                <td>₹${nonDoxSurfacePricing.restOfIndia || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // NON DOX Air Pricing
    if (nonDoxAirPricing) {
      html += `
        <div class="pricing-section">
          <div class="pricing-header">✈️ NON DOX Air Pricing</div>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Assam</th>
                <th>NE by Surface</th>
                <th>NE by Air (Agent Import)</th>
                <th>Rest of India</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>₹${nonDoxAirPricing.assam || 0}</td>
                <td>₹${nonDoxAirPricing.neBySurface || 0}</td>
                <td>₹${nonDoxAirPricing.neByAirAgtImp || 0}</td>
                <td>₹${nonDoxAirPricing.restOfIndia || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // Priority Pricing
    if (priorityPricing) {
      html += `
        <div class="pricing-section">
          <div class="pricing-header">⚡ Priority Service - DOX Pricing</div>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Weight Range</th>
                <th>Assam</th>
                <th>NE by Surface</th>
                <th>NE by Air (Agent Import)</th>
                <th>Rest of India</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(priorityPricing).map(([weight, prices]) => `
                <tr>
                  <td><strong>${weight}</strong></td>
                  <td>₹${prices.assam || 0}</td>
                  <td>₹${prices.neBySurface || 0}</td>
                  <td>₹${prices.neByAirAgtImp || 0}</td>
                  <td>₹${prices.restOfIndia || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Reverse Pricing
    if (reversePricing) {
      html += `
        <div class="pricing-section">
          <div class="pricing-header">🔄 Reverse Pricing (To Assam & North East)</div>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>By Road (Normal)</th>
                <th>By Road (Priority)</th>
                <th>By Train (Normal)</th>
                <th>By Train (Priority)</th>
                <th>By Flight (Normal)</th>
                <th>By Flight (Priority)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>To Assam</strong></td>
                <td>₹${reversePricing.toAssam?.byRoad?.normal || 0}</td>
                <td>₹${reversePricing.toAssam?.byRoad?.priority || 0}</td>
                <td>₹${reversePricing.toAssam?.byTrain?.normal || 0}</td>
                <td>₹${reversePricing.toAssam?.byTrain?.priority || 0}</td>
                <td>₹${reversePricing.toAssam?.byFlight?.normal || 0}</td>
                <td>₹${reversePricing.toAssam?.byFlight?.priority || 0}</td>
              </tr>
              <tr>
                <td><strong>To North East</strong></td>
                <td>₹${reversePricing.toNorthEast?.byRoad?.normal || 0}</td>
                <td>₹${reversePricing.toNorthEast?.byRoad?.priority || 0}</td>
                <td>₹${reversePricing.toNorthEast?.byTrain?.normal || 0}</td>
                <td>₹${reversePricing.toNorthEast?.byTrain?.priority || 0}</td>
                <td>₹${reversePricing.toNorthEast?.byFlight?.normal || 0}</td>
                <td>₹${reversePricing.toNorthEast?.byFlight?.priority || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    return html;
  }

  // Send pricing approval email
  async sendPricingApprovalEmail(pricingData, approvalUrl, rejectionUrl) {
    try {
      const { clientEmail, clientName, name } = pricingData;

      if (!clientEmail) {
        throw new Error('Client email is required to send approval email');
      }

      // Ensure email service is initialized
      if (!this.isInitialized) {
        await this.initializeEmailService();
      }

      if (!this.transporter) {
        throw new Error('Email service not properly initialized');
      }

      // Ensure OAuth2 access token is fresh
      if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);

          // Update transporter with new access token
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
              clientId: this.oauth2Client._clientId,
              clientSecret: this.oauth2Client._clientSecret,
              refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
              accessToken: credentials.access_token
            }
          });
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
        }
      }

      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to: clientEmail,
        subject: `📋 Corporate Pricing Approval Required - ${name}`,
        html: this.generatePricingApprovalEmail(pricingData, approvalUrl, rejectionUrl),
        text: this.generateTextVersion(pricingData, approvalUrl, rejectionUrl),
        attachments: []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Pricing approval email sent to ${clientEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: clientEmail
      };
    } catch (error) {
      console.error('❌ Error sending pricing approval email:', error);
      throw error;
    }
  }

  // Generate text version of the email
  generateTextVersion(pricingData, approvalUrl, rejectionUrl) {
    const { name, clientName, clientCompany } = pricingData;

    return `
Corporate Pricing Approval - ${name}

Dear ${clientName || 'Valued Client'},

We are pleased to present the corporate pricing proposal for ${clientCompany || 'your company'}.

Please review the pricing details and take action:

APPROVE: ${approvalUrl}
REJECT: ${rejectionUrl}

This proposal requires your response within 7 days.

For questions, contact us at:
- Email: corporate@oclcourier.com
- Phone: +91-XXX-XXXX-XXXX

Best regards,
OCL Services Team
    `;
  }

  // Generate HTML email template for corporate registration completion
  generateCorporateRegistrationEmail(corporateData) {
    const { corporateId, companyName, email, contactNumber, username, password } = corporateData;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Corporate Registration Complete - ${companyName}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            .credentials-section {
                margin: 25px 0;
                border: 2px solid #28a745;
                border-radius: 8px;
                overflow: hidden;
                background-color: #f8fff9;
            }
            .credentials-header {
                background-color: #28a745;
                padding: 15px 20px;
                font-weight: bold;
                color: white;
                text-align: center;
            }
            .credentials-content {
                padding: 20px;
            }
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-label {
                font-weight: 600;
                color: #495057;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: #e9ecef;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
                color: #495057;
            }
            .company-info {
                margin: 20px 0;
                padding: 20px;
                background-color: #e3f2fd;
                border-radius: 8px;
                border-left: 4px solid #2196f3;
            }
            .important-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s ease;
            }
            .login-button:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Registration Complete!</h1>
                <p>OCL Services</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear ${companyName} Team,
                </div>
                
                <p>Congratulations! Your corporate registration with OCL Services has been successfully completed.</p>
                
                <div class="company-info">
                    <h3>📋 Registration Details</h3>
                    <p><strong>Corporate ID:</strong> ${corporateId}</p>
                    <p><strong>Company Name:</strong> ${companyName}</p>
                    <p><strong>Contact Email:</strong> ${email}</p>
                    <p><strong>Contact Number:</strong> ${contactNumber}</p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="credentials-section">
                    <div class="credentials-header">
                        🔐 Your Login Credentials
                    </div>
                    <div class="credentials-content">
                        <div class="credential-item">
                            <span class="credential-label">Username:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Password:</span>
                            <span class="credential-value">${password}</span>
                        </div>
                    </div>
                </div>

                <div class="important-notice">
                    <strong>🔒 Important Security Notice:</strong>
                    <ul>
                        <li>Please save these credentials in a secure location</li>
                        <li>We recommend changing your password after first login</li>
                        <li>Do not share these credentials with unauthorized personnel</li>
                        <li>Your username is your ${email.includes('@') ? 'email address' : 'phone number'}</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/corporate-login" class="login-button">
                        🚀 Access Your Dashboard
                    </a>
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h4>📞 Need Help?</h4>
                    <p>If you have any questions or need assistance, please contact our corporate team:</p>
                    <ul>
                        <li><strong>Email:</strong> corporate@oclcourier.com</li>
                        <li><strong>Phone:</strong> +91-XXX-XXXX-XXXX</li>
                        <li><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated message from OCL Services.</p>
                <p>Please do not reply to this email. For support, contact us at info@oclservices.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send corporate registration completion email
  async sendCorporateRegistrationEmail(corporateData) {
    try {
      const { email, companyName, corporateId } = corporateData;

      if (!email) {
        throw new Error('Corporate email is required to send registration email');
      }

      // Ensure email service is initialized
      if (!this.isInitialized) {
        await this.initializeEmailService();
      }

      if (!this.transporter) {
        throw new Error('Email service not properly initialized');
      }

      // Ensure OAuth2 access token is fresh
      if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);

          // Update transporter with new access token
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
              clientId: this.oauth2Client._clientId,
              clientSecret: this.oauth2Client._clientSecret,
              refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
              accessToken: credentials.access_token
            }
          });
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
        }
      }

      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to: email,
        subject: `🎉 Corporate Registration Complete - ${companyName} (${corporateId})`,
        html: this.generateCorporateRegistrationEmail(corporateData),
        text: this.generateCorporateRegistrationTextVersion(corporateData),
        attachments: []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Corporate registration email sent to ${email}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: email
      };
    } catch (error) {
      console.error('❌ Error sending corporate registration email:', error);
      throw error;
    }
  }

  // Generate text version of corporate registration email
  generateCorporateRegistrationTextVersion(corporateData) {
    const { corporateId, companyName, email, contactNumber, username, password } = corporateData;

    return `
Corporate Registration Complete - ${companyName}

Dear ${companyName} Team,

Congratulations! Your corporate registration with OCL Services has been successfully completed.

REGISTRATION DETAILS:
- Corporate ID: ${corporateId}
- Company Name: ${companyName}
- Contact Email: ${email}
- Contact Number: ${contactNumber}
- Registration Date: ${new Date().toLocaleDateString()}

YOUR LOGIN CREDENTIALS:
- Username: ${username}
- Password: ${password}

IMPORTANT SECURITY NOTICE:
- Please save these credentials in a secure location
- We recommend changing your password after first login
- Do not share these credentials with unauthorized personnel
- Your username is your ${email.includes('@') ? 'email address' : 'phone number'}

LOGIN URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/corporate-login

For questions or assistance, contact our corporate team:
- Email: corporate@oclcourier.com
- Phone: +91-XXX-XXXX-XXXX
- Business Hours: Monday - Friday, 9:00 AM - 6:00 PM

Best regards,
OCL Services Team
    `;
  }

  // Send approval confirmation email
  async sendApprovalConfirmationEmail(pricingData, action) {
    try {
      const { clientEmail, clientName, name } = pricingData;

      const subject = action === 'approved'
        ? `✅ Pricing Approved - ${name}`
        : `❌ Pricing Rejected - ${name}`;

      const message = action === 'approved'
        ? `Your pricing proposal "${name}" has been approved and is now active.`
        : `Your pricing proposal "${name}" has been rejected. Please contact us for further discussion.`;

      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to: clientEmail,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${action === 'approved' ? '#28a745' : '#dc3545'};">
              ${action === 'approved' ? '✅ Approved' : '❌ Rejected'}
            </h2>
            <p>Dear ${clientName || 'Valued Client'},</p>
            <p>${message}</p>
            <p>Thank you for your business with OCL Services.</p>
            <hr>
            <p><small>This is an automated message. For support, contact us at info@oclservices.com</small></p>
          </div>
        `,
        text: `Dear ${clientName || 'Valued Client'},\n\n${message}\n\nThank you for your business with OCL Services.`,
        attachments: []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to ${clientEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: clientEmail
      };
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      throw error;
    }
  }

  // Generate HTML email template for employee registration completion
  generateEmployeeRegistrationEmail(employeeData) {
    const { employeeId, name, email, phone, username, password } = employeeData;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Registration Complete - ${name}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            .credentials-section {
                margin: 25px 0;
                border: 2px solid #28a745;
                border-radius: 8px;
                overflow: hidden;
                background-color: #f8fff9;
            }
            .credentials-header {
                background-color: #28a745;
                padding: 15px 20px;
                font-weight: bold;
                color: white;
                text-align: center;
            }
            .credentials-content {
                padding: 20px;
            }
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-label {
                font-weight: 600;
                color: #495057;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: #e9ecef;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
                color: #495057;
            }
            .employee-info {
                margin: 20px 0;
                padding: 20px;
                background-color: #e3f2fd;
                border-radius: 8px;
                border-left: 4px solid #2196f3;
            }
            .important-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s ease;
            }
            .login-button:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Employee Registration Complete!</h1>
                <p>OCL Services</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear ${name},
                </div>
                
                <p>Congratulations! Your employee registration with OCL Services has been successfully completed.</p>
                
                <div class="employee-info">
                    <h3>📋 Registration Details</h3>
                    <p><strong>Employee ID:</strong> ${employeeId}</p>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="credentials-section">
                    <div class="credentials-header">
                        🔐 Your Login Credentials
                    </div>
                    <div class="credentials-content">
                        <div class="credential-item">
                            <span class="credential-label">Username:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">Password:</span>
                            <span class="credential-value">${password}</span>
                        </div>
                    </div>
                </div>

                <div class="important-notice">
                    <strong>🔒 Important Security Notice:</strong>
                    <ul>
                        <li>Please save these credentials in a secure location</li>
                        <li>You will be required to change your password on first login</li>
                        <li>Do not share these credentials with unauthorized personnel</li>
                        <li>Your username is your email address</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/office-login" class="login-button">
                        🚀 Access Your Dashboard
                    </a>
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h4>📞 Need Help?</h4>
                    <p>If you have any questions or need assistance, please contact our HR team:</p>
                    <ul>
                        <li><strong>Email:</strong> hr@oclcourier.com</li>
                        <li><strong>Phone:</strong> +91-XXX-XXXX-XXXX</li>
                        <li><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated message from OCL Services.</p>
                <p>Please do not reply to this email. For support, contact us at info@oclservices.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send employee registration completion email
  async sendEmployeeRegistrationEmail(employeeData) {
    try {
      const { email, name, employeeId } = employeeData;

      if (!email) {
        throw new Error('Employee email is required to send registration email');
      }

      // Ensure email service is initialized
      if (!this.isInitialized) {
        await this.initializeEmailService();
      }

      if (!this.transporter) {
        throw new Error('Email service not properly initialized');
      }

      // Ensure OAuth2 access token is fresh
      if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);

          // Update transporter with new access token
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
              clientId: this.oauth2Client._clientId,
              clientSecret: this.oauth2Client._clientSecret,
              refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
              accessToken: credentials.access_token
            }
          });
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
        }
      }

      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to: email,
        subject: `🎉 Employee Registration Complete - ${name} (${employeeId})`,
        html: this.generateEmployeeRegistrationEmail(employeeData),
        text: this.generateEmployeeRegistrationTextVersion(employeeData),
        attachments: []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Employee registration email sent to ${email}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: email
      };
    } catch (error) {
      console.error('❌ Error sending employee registration email:', error);
      throw error;
    }
  }

  // Generate text version of employee registration email
  generateEmployeeRegistrationTextVersion(employeeData) {
    const { employeeId, name, email, phone, username, password } = employeeData;

    return `
Employee Registration Complete - ${name}

Dear ${name},

Congratulations! Your employee registration with OCL Services has been successfully completed.

REGISTRATION DETAILS:
- Employee ID: ${employeeId}
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Registration Date: ${new Date().toLocaleDateString()}

YOUR LOGIN CREDENTIALS:
- Username: ${username}
- Password: ${password}

IMPORTANT SECURITY NOTICE:
- Please save these credentials in a secure location
- You will be required to change your password on first login
- Do not share these credentials with unauthorized personnel
- Your username is your email address

LOGIN URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/office-login

For questions or assistance, contact our HR team:
- Email: hr@oclcourier.com
- Phone: +91-XXX-XXXX-XXXX
- Business Hours: Monday - Friday, 9:00 AM - 6:00 PM

Best regards,
OCL Services Team
    `;
  }

  // Validate image URLs before using them in emails
  async validateImageUrls(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }

    // Remove duplicates first
    const uniqueUrls = [...new Set(imageUrls.filter(url => url && typeof url === 'string'))];

    const validatedUrls = [];
    for (const imageUrl of uniqueUrls) {
      try {
        // Check if URL is valid
        new URL(imageUrl);
        validatedUrls.push(imageUrl);
        console.log(`✅ Valid image URL: ${imageUrl.substring(0, 50)}...`);
      } catch (error) {
        console.warn(`⚠️ Invalid image URL: ${imageUrl}`, error.message);
        // Skip invalid URLs
      }
    }

    return validatedUrls;
  }

  // Generate HTML email template for shipment confirmation (Office Booking - uses BookNow design)
  async generateShipmentConfirmationEmail(shipmentData, packageImageAttachments = []) {
    const {
      consignmentNumber,
      invoiceNumber,
      receiverCompanyName,
      receiverConcernPerson,
      destinationCity,
      bookingDate,
      senderCompanyName,
      senderConcernPerson,
      recipientConcernPerson,
      recipientPinCode,
      recipientMobileNumber,
      invoiceValue,
      packageImages,
      invoiceImages,
      // Map shipmentData to bookingData structure
      originData,
      destinationData,
      shipmentData: shipmentDetails,
      detailsData
    } = shipmentData;

    // Map shipmentData to bookingData-like structure for the email template
    const origin = originData || {
      name: senderConcernPerson,
      companyName: senderCompanyName,
      mobileNumber: shipmentData.senderMobileNumber || '',
      email: shipmentData.senderEmail || '',
      city: shipmentData.originCity || '',
      state: shipmentData.originState || '',
      pincode: shipmentData.originPincode || '',
      flatBuilding: shipmentData.originAddressLine1 || '',
      locality: shipmentData.originAddressLine2 || ''
    };

    const destination = destinationData || {
      name: recipientConcernPerson,
      companyName: receiverCompanyName,
      mobileNumber: recipientMobileNumber,
      city: destinationCity,
      pincode: recipientPinCode,
      state: shipmentData.destinationState || '',
      flatBuilding: shipmentData.destinationAddressLine1 || '',
      locality: shipmentData.destinationAddressLine2 || ''
    };

    const shipment = shipmentDetails || {};
    const detailsCharges = detailsData || {};

    const parseCharge = (value) => {
      if (value === null || value === undefined || value === '') return 0;

      // Handle string values - remove commas and whitespace, then parse
      if (typeof value === 'string') {
        const cleaned = value.toString().replace(/,/g, '').trim();
        if (cleaned === '' || cleaned === '0' || cleaned === '0.00') return 0;
        const num = parseFloat(cleaned);
        return Number.isFinite(num) ? num : 0;
      }

      // Handle number values
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const chargesConfig = [
      { key: 'freightCharge', label: 'Freight Charge' },
      { key: 'awbCharge', label: 'AWB Charge' },
      { key: 'localCollection', label: 'Local Collection' },
      { key: 'doorDelivery', label: 'Door Delivery' },
      { key: 'loadingUnloading', label: 'Loading & Unloading' },
      { key: 'demurrageCharge', label: 'Demurrage Charge' },
      { key: 'ddaCharge', label: 'ODA Charge' },
      { key: 'hamaliCharge', label: 'Hamali Charge' },
      { key: 'packingCharge', label: 'Packing Charge' },
      { key: 'otherCharge', label: 'Other Charge' },
      { key: 'fuelCharge', label: 'Fuel Charge' },
      { key: 'sgstAmount', label: 'SGST' },
      { key: 'cgstAmount', label: 'CGST' },
      { key: 'igstAmount', label: 'IGST' }
    ];

    const priceBreakdown = chargesConfig
      .map(({ key, label }) => ({
        label,
        value: parseCharge(detailsCharges?.[key])
      }))
      .filter((item) => item.value > 0);

    // Get total from detailsData only (no invoice value fallback)
    const invoiceTotalValue =
      parseCharge(detailsCharges?.grandTotal) ||
      parseCharge(detailsCharges?.total) ||
      0;

    // Office bookings don't have pickup charge
    const pickupCharge = 0;
    const basePrice = null;
    const gstAmount = null;
    const totalAmount = null;
    const calculatedPrice = null;
    const paymentStatus = 'unpaid'; // Office bookings are typically unpaid
    const paymentMethod = null;
    const shippingMode = null;
    const serviceType = null;
    const bookingReference = consignmentNumber;

    const invoiceNumberForEmail = invoiceNumber || this.getInvoiceNumberFromBooking({ invoiceNumber, consignmentNumber });

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '—';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const safe = (value, fallback = '—') =>
      value && String(value).trim() !== '' ? value : fallback;

    // Calculate estimated delivery date
    const estimatedDeliveryDate = bookingDate
      ? new Date(new Date(bookingDate).getTime() + 5 * 24 * 60 * 60 * 1000)
      : null;
    const formattedDeliveryDate = estimatedDeliveryDate
      ? estimatedDeliveryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const bookingDateDisplay = formatDateTime(bookingDate);
    const [bookedOn, bookedTime] = bookingDateDisplay && bookingDateDisplay.includes(',')
      ? bookingDateDisplay.split(',').map((part) => part.trim())
      : [bookingDateDisplay, '—'];

    const paymentState = 'Unpaid'; // Office bookings are unpaid

    const trackingLink = consignmentNumber
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${encodeURIComponent(consignmentNumber)}`
      : process.env.FRONTEND_URL || 'http://localhost:3000';

    // Extract packages count from multiple possible fields
    const packagesCount = shipment.packagesCount ??
      shipment.packageCount ??
      shipment.quantity ??
      shipment.totalPackages ??
      (shipment.totalPackages ? String(shipment.totalPackages) : null) ??
      '—';

    // Extract weight from multiple possible fields (prioritize actualWeight, then chargeableWeight, then volumetricWeight)
    const totalWeight = shipment.actualWeight ??
      shipment.chargeableWeight ??
      shipment.volumetricWeight ??
      shipment.weight ??
      shipment.totalWeight ??
      '—';

    // Format packages count - ensure it shows as number with "pcs"
    const packagesCountDisplay = packagesCount !== '—' && packagesCount !== null && packagesCount !== undefined
      ? `${packagesCount} pcs`
      : '— pcs';

    // Format weight - ensure it shows as number with "kg"
    const totalWeightDisplay = totalWeight !== '—' && totalWeight !== null && totalWeight !== undefined
      ? `${totalWeight} kg`
      : '— kg';
    const insuranceText = safe(
      shipment.insurance ||
      shipment.insuranceStatus ||
      (shipment.isInsured ? 'Insured' : '') ||
      (shipment.insurancePolicyNumber ? `Policy #${shipment.insurancePolicyNumber}` : ''),
      'Not provided'
    );

    const supportEmail = process.env.SUPPORT_EMAIL || 'info@oclservices.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+91 8453 994 809';
    const companyWebsite = process.env.COMPANY_WEBSITE || 'https://oclservices.com';
    const companyGstin = process.env.COMPANY_GSTIN || '18AJRPG5984B1ZV';

    const gstPercent = '18';

    const currencyWithoutSymbol = (value) => formatCurrency(value).replace(/^₹/, '');

    const logoUrl = 'cid:ocl-brand-logo';
    const consignmentNumberValue =
      consignmentNumber && String(consignmentNumber).trim() !== '' ? consignmentNumber : '';

    const hasPackageImages = Array.isArray(packageImageAttachments) && packageImageAttachments.length > 0;
    const packageImagesHtml = hasPackageImages
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" class="package-gallery-table" style="margin:0 auto; width:100%;">
          <tr>
            ${packageImageAttachments
        .slice(0, 4)
        .map(
          (attachment, index) => `
                  <td style="padding:6px; text-align:center;">
                    <img class="package-img" src="cid:${attachment.cid}" alt="Package Image ${index + 1}" width="140" height="140" style="width:140px; height:140px; object-fit:cover; border-radius:0; border:1px solid #E2E8F0; box-shadow:0 2px 6px rgba(15,23,42,0.12); display:block; margin:0 auto;">
                  </td>`
        )
        .join('')}
          </tr>
        </table>`
      : '<div style="text-align:center; color:#94A3B8; font-size:13px; font-style:italic;">No package images available</div>';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed</title>

  <style>
    html,body { margin:0; padding:0; background:#F2F5FF; }
    table { border-collapse:collapse; }
    img { border:0; display:block; outline:none; }
    a { color:inherit; text-decoration:none; }
    .container { width:100%; max-width:640px; }
    .two-col { vertical-align:top; }
    .mobile-center { text-align:center; }
    .package-gallery-table { width:100%; }

    @media only screen and (max-width:600px) {
      body { padding:8px !important; }
      .container { width:100% !important; max-width:100% !important; padding:0 !important; }
      .two-col,
      .mobile-stack { display:block !important; width:100% !important; }
      .mobile-center,
      .center-mobile { text-align:center !important; }
      .mobile-space { margin-top:12px !important; }
      .invoice-table td { display:flex !important; justify-content:space-between; width:100% !important; padding:4px 0 !important; }
      .cta { display:block !important; width:100% !important; text-align:center !important; }
      .booking-title { font-size:20px !important; letter-spacing:1px !important; }
      .booking-meta { font-size:12px !important; line-height:20px !important; }
      .header-logo img { max-width:150px !important; margin:12px auto 0 !important; }
      .package-gallery-table td { display:inline-block !important; width:48% !important; padding:4px !important; }
      .package-gallery-table td:only-child { width:100% !important; text-align:center !important; }
      .package-gallery-table td:nth-child(n+3) { margin-top:8px !important; }
      .package-img { width:100% !important; height:auto !important; max-width:160px !important; }
      .booking-summary { background:transparent !important; border:none !important; }
      .price-summary { background:transparent !important; border:none !important; }
      .booked-section { padding-left:35% !important; }
      .tracking-section { padding-left:20% !important; }
      .barcode-cell { padding-left:5% !important; }
      .estimated-date-cell { padding-left:5% !important; }
      .email-header { background:linear-gradient(135deg,#1a4a7a,#2d6ba8) !important; border-bottom:1px solid #3d7bb8 !important; }
    }

    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; }
  </style>

</head>

<body class="font-sans" style="background:#F2F5FF; margin:0; padding:16px;">
<table width="100%">
<tr><td align="center">

<!-- MAIN CONTAINER -->
<table width="640" class="container"
style="background:#ffffff; border-radius:0; overflow:hidden; box-shadow:0 10px 24px rgba(9,16,31,0.1); border-radius:10px; width:100%; max-width:640px;">

  <!-- HEADER -->
  <tr>
    <td class="email-header" style="padding:22px 28px; border-bottom:1px solid #0D3170; background:linear-gradient(135deg,#062858,#0F4C92);">
      <table width="100%">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; font-size:12px; color:#D9E3FF; font-weight:600; padding-bottom:8px;">
            <a href="${companyWebsite}" style="color:#FFEE9D; text-decoration:none;"><br>https://oclservices.com</a>
          </td>
          <td class="two-col center-mobile mobile-stack" style="width:34%; text-align:center; padding-bottom:8px;">
            <div class="booking-title" style="font-size:18px; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">Shipping Confirmed</div>
          </td>
          <td class="two-col mobile-stack mobile-center header-logo" style="width:33%; text-align:right;">
            <!--[if gte mso 9]><table><tr><td style="padding-top:0;padding-bottom:0;"><![endif]-->
            <img src="${logoUrl}" width="190" style="display:block; margin-left:auto; filter:drop-shadow(0 6px 14px rgba(0,0,0,0.35));">
            <!--[if gte mso 9]></td></tr></table><![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BOOKED TEXT -->
  <tr>
    <td class="booked-section" style="padding:20px 28px; background:linear-gradient(135deg,#F7F3FF,#EEF4FF);">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:left; padding:0px 0;">
            <div style="font-size:14px; font-weight:600; color:#0B1F4A;">${bookedOn}</div>
            <div style="font-size:13px; color:#4B5563; margin-top:4px;">${bookedTime}</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:34%; text-align:center; padding:6px 0;">
            <div class="booking-title" style="font-size:24px; font-weight:800; color:#0B1F4A; text-transform:uppercase; letter-spacing:2px;">Booked</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:right; padding:6px 0;">
            <div style="font-size:20px; font-weight:700; color:#B02800; text-transform:uppercase;">
              Not paid
            </div>
    </td>
  </tr>
      </table>
    </td>
  </tr>

  <!-- ACTION / BARCODE / DELIVERY -->
  <tr>
    <td class="tracking-section" style="padding:18px 24px; background:#0B1433;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-space" style="width:33%; padding:0; vertical-align:middle;">
            <a href="${trackingLink}" class="cta"
              style="display:inline-block; padding:10px 18px; background:linear-gradient(120deg,#FF512F,#DD2476); border-radius:0; color:white; font-weight:600; letter-spacing:0.3px;">
              Track Booking
            </a>
          </td>
          <td class="two-col mobile-stack mobile-center mobile-space barcode-cell" style="width:34%; padding:0; text-align:center; vertical-align:middle;">
            <div style="font-size:10px; color:#8FA0C2; text-transform:uppercase; letter-spacing:1px;">Scan to Track</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(consignmentNumber)}" style="max-width:180px; margin:6px auto 0; display:block;">
            <div style="font-size:10px; color:#c7cede; margin-top:4px;">AWB: ${safe(consignmentNumber)}</div>
          </td>
          <td class="two-col mobile-stack mobile-center estimated-date-cell" style="width:33%; padding:0; text-align:right; vertical-align:middle;">
            <div style="font-size:10px; color:#d9b59e; text-transform:uppercase; letter-spacing:1px;">Estimated Delivery</div>
            <div style="font-size:15px; font-weight:600; color:#FFEBDD; margin-top:4px;">${formattedDeliveryDate}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SHIPMENT DETAILS -->
  <tr><td style="padding-top:0;">
    <div style="
      padding:18px;
      border-radius:0;
      background:linear-gradient(135deg,#FDF3F3,#FFF7E5);
      border:1px solid #FFD9C1;
      box-shadow:0 8px 20px rgba(255,146,76,0.15);
    ">
      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        Hello <strong>${safe(origin.name || origin.companyName || 'Customer')}</strong>,
      </p>

      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        We have received your shipment of <strong>${safe(destination.name || destination.companyName)}</strong>, ${safe(destination.city)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Pin - ${safe(destination.pincode)}, Mob - ${safe(destination.mobileNumber)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Invoice No: <strong>${safe(invoiceNumberForEmail)}</strong>
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Arriving on <strong>${formattedDeliveryDate}</strong>
      </p>

      <p style="font-size:13px; margin:0;">
        Shipping Address:
        <strong>${safe(destination.companyName || destination.name)}, ${destination.city}, ${destination.state}</strong>
      </p>
    </div>
  </td></tr>

  

  <!-- BOOKING SUMMARY -->
  <tr>
    <td style="padding-top:0;">
      <table width="100%" style="border-collapse:collapse; border-spacing:0;">
        <tr>

          <!-- LEFT SUMMARY -->
          <td class="two-col mobile-stack mobile-space booking-summary" style="width:60%; padding:16px; border:1px solid #CFE0FF; background:linear-gradient(135deg,#F6FAFF,#F0F6FF); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; color:#0F172A; margin-bottom:6px;text-decoration:underline;">Booking Summary :</div>

            <table width="100%">
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Consignment No :</td><td style="font-weight:500; color:#7A7A7A">${safe(consignmentNumber)}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Service :</td><td style="font-weight:500; color:#7A7A7A ">${safe(serviceType, 'Standard')}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Packages :</td><td style="font-weight:500; color:#7A7A7A">${packagesCountDisplay}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Weight :</td><td style="font-weight:500; color:#7A7A7A">${totalWeightDisplay}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Insurance :</td><td style="font-weight:500; color:#7A7A7A">${insuranceText}</td></tr>
            </table>
          </td>

          <!-- PRICE SUMMARY -->
          <td class="two-col mobile-stack price-summary" style="width:40%; padding:16px; border:1px solid #FFD5A8; background:linear-gradient(135deg,#FFF8F0,#FFF2E2); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Price Summary :</div>

            <table width="100%" class="invoice-table">
              ${priceBreakdown.length > 0
        ? priceBreakdown.map(item => `
                  <tr>
                    <td style="font-size:12px; color:#7A7A7A; padding:5px 0;">${item.label} :</td>
                    <td align="right" style="font-weight:500;color:#7A7A7A;">${formatCurrency(item.value)}</td>
                  </tr>
                `).join('')
        : `<tr><td colspan="2" style="font-size:11px; color:#7A7A7A; padding:8px 0; font-style:italic; text-align:center;">No charge breakdown provided</td></tr>`
      }
              ${invoiceTotalValue > 0 ? `
              <tr>
                <td style="border-top:1px dashed #F7C393; padding-top:8px; font-weight:700;">Total :</td>
                <td align="right" style="border-top:1px dashed #F7C393; font-size:14px; font-weight:800;">${formatCurrency(invoiceTotalValue)}</td>
              </tr>
              ` : ''}
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

        <!-- PACKAGE GALLERY -->
        <tr><td style="padding-top:0;">
          <div style="padding:16px; background:#FFF3F5; border:1px solid #FFD0D7; border-radius:0; text-decoration:underline;">
            <div style="font-size:13px; font-weight:700; color:#333; margin-bottom:8px;">Package Gallery :</div>
            ${packageImagesHtml}
          </div>
        </td></tr>

        <!-- NEXT STEPS -->
        <tr><td style="padding-top:0;">
          <div style="padding:14px; border-radius:0; background:#ffffff; border:1px solid #DEE5FF;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Next Steps :</div>
            <ol style="font-size:12px; color:#4A5568; padding-left:18px;">
              <li>Our team will coordinate pickup.</li>
              <li>Keep shipment unpacked with documents.</li>
              <li>Tracking updates after hub scan.</li>
            </ol>
          </div>
        </td></tr>

        <!-- SUPPORT -->
        <tr><td style="padding-top:0;">
          <div style="padding:12px 5px; background:#F5F9FF; border:1px solid #DCE6FF; border-radius:0;">
            <table width="100%">
              <tr>
                <td class="mobile-stack mobile-center" align="center" style="font-size:12px; font-weight:700;">
                  Need Assistance? Write to us :
                  <a href="mailto:${supportEmail}" style="color:#0A3A7D">${supportEmail}</a>
                   or Call Us @
                  <a href="tel:${supportPhone}" style="color:#0A3A7D">${supportPhone}</a>
                </td>
                
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- FOOTER -->

        <tr>
      <td style="background:#0A3A7D; color:white; padding:12px 16px; text-align:center; font-size:12px;">
        <div style="margin-top:4px; font-size:11px;">
            This is an automated email from <strong>OCL.</strong>.
            GSTIN: ${companyGstin} - <a href="${companyWebsite}" style="color:white;">${companyWebsite}</a>
          </div>
          </td>
        </tr>


      </table>
    </td>
  </tr>

</table>


<!-- SPACER -->
<table width="100%" style="margin-top:4px; border-collapse:collapse;"><tr><td align="center">
  <table width="640" align="center" style="border-collapse:collapse;">
    <tr>
      <td style="text-align:center; font-size:12px; color:#6B7280;">
        If you didn't make this booking, contact support immediately.
      </td>
    </tr>
  </table>
</td></tr></table>

</td></tr></table>
</body>
</html>
    `;
  }

  // Send shipment confirmation email (Office Booking - uses BookNow design)
  async sendShipmentConfirmationEmail(shipmentData) {
    try {
      const { senderEmail, consignmentNumber } = shipmentData;

      if (!senderEmail) {
        throw new Error('Sender email is required to send shipment confirmation');
      }

      // Ensure email service is initialized
      if (!this.isInitialized) {
        await this.initializeEmailService();
      }

      if (!this.transporter) {
        throw new Error('Email service not properly initialized');
      }

      // Ensure OAuth2 access token is fresh
      if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);

          // Update transporter with new access token
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
              clientId: this.oauth2Client._clientId,
              clientSecret: this.oauth2Client._clientSecret,
              refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
              accessToken: credentials.access_token
            }
          });
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
        }
      }

      // Prepare attachments: package images and logo (like BookNow)
      const packageImages = (shipmentData.packageImages || []).filter(img => img && String(img).trim() !== '');
      let packageImageAttachments = [];

      if (packageImages.length > 0) {
        try {
          const validatedImages = await this.validateImageUrls(packageImages);
          if (validatedImages.length > 0) {
            packageImageAttachments = await S3Service.downloadImagesForEmail(validatedImages);
            console.log(`📧 Attached ${packageImageAttachments.length} package images`);
          }
        } catch (error) {
          console.error('❌ Failed to download package images:', error);
        }
      }

      const attachments = [];
      const logoPath = join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'ocl-logo.png');
      if (existsSync(logoPath)) {
        attachments.push({ filename: 'ocl-logo.png', path: logoPath, cid: 'ocl-brand-logo' });
      }
      packageImageAttachments.forEach(att => attachments.push({
        filename: att.filename, content: att.buffer, cid: att.cid, contentType: att.contentType
      }));

      // Generate email content with error handling
      let emailHtml;
      try {
        emailHtml = await this.generateShipmentConfirmationEmail(shipmentData, packageImageAttachments);
        console.log('✅ Email HTML generated successfully');
      } catch (htmlError) {
        console.error('❌ Error generating email HTML:', htmlError);
        // Fallback to text-only email if HTML generation fails
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>📦 Shipment Confirmed - AWB: ${consignmentNumber}</h2>
            <p>Your shipment has been successfully booked with OCL Services.</p>
            <p>Due to technical issues, images could not be included in this email.</p>
            <p>Please contact support if you need to view your shipment images.</p>
            <hr>
            <p><small>This is an automated message. For support, contact us at info@oclservices.com</small></p>
          </div>
        `;
      }

      const originCity = shipmentData.originCity || shipmentData.originState || 'Origin';
      const destinationCity = shipmentData.destinationCity || shipmentData.destinationState || 'Destination';
      const emailSubject = `${consignmentNumber}  ${originCity} - ${destinationCity}`;

      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to: senderEmail,
        subject: emailSubject,
        html: emailHtml,
        text: this.generateShipmentConfirmationTextVersion(shipmentData),
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Shipment confirmation email sent to ${senderEmail}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        recipient: senderEmail
      };
    } catch (error) {
      console.error('❌ Error sending shipment confirmation email:', error);
      throw error;
    }
  }

  // Generate text version of shipment confirmation email (Office Booking)
  generateShipmentConfirmationTextVersion(shipmentData) {
    const {
      consignmentNumber,
      invoiceNumber,
      receiverCompanyName,
      receiverConcernPerson,
      destinationCity,
      bookingDate,
      senderCompanyName,
      senderConcernPerson,
      recipientConcernPerson,
      recipientPinCode,
      recipientMobileNumber,
      invoiceValue,
      packageImages,
      invoiceImages,
      originData,
      destinationData,
      shipmentData: shipmentDetails,
      detailsData
    } = shipmentData;

    const formatDateTime = (value) => {
      if (!value) return 'NA';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    // Calculate estimated delivery date (booking date + 5 days)
    const estimatedDeliveryDate = bookingDate
      ? new Date(new Date(bookingDate).getTime() + 5 * 24 * 60 * 60 * 1000)
      : null;
    const formattedDeliveryDate = estimatedDeliveryDate
      ? estimatedDeliveryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'NA';

    const senderName = senderCompanyName || senderConcernPerson;
    const receiverDisplay = receiverCompanyName || receiverConcernPerson;

    const origin = originData || {
      name: senderConcernPerson,
      companyName: senderCompanyName,
      mobileNumber: shipmentData.senderMobileNumber || '',
      city: shipmentData.originCity || '',
      state: shipmentData.originState || '',
      pincode: shipmentData.originPincode || ''
    };

    const destination = destinationData || {
      name: recipientConcernPerson,
      companyName: receiverCompanyName,
      mobileNumber: recipientMobileNumber,
      city: destinationCity,
      pincode: recipientPinCode,
      state: shipmentData.destinationState || ''
    };

    const shipment = shipmentDetails || {};
    const chargeDetails = detailsData || {};

    // Extract packages count from multiple possible fields
    const packagesCount = shipment.packagesCount ??
      shipment.packageCount ??
      shipment.quantity ??
      shipment.totalPackages ??
      (shipment.totalPackages ? String(shipment.totalPackages) : null) ??
      'NA';

    // Extract weight from multiple possible fields
    const totalWeight = shipment.actualWeight ??
      shipment.chargeableWeight ??
      shipment.volumetricWeight ??
      shipment.weight ??
      shipment.totalWeight ??
      'NA';

    const parseCharge = (value) => {
      if (value === null || value === undefined || value === '') return 0;

      // Handle string values - remove commas and whitespace, then parse
      if (typeof value === 'string') {
        const cleaned = value.toString().replace(/,/g, '').trim();
        if (cleaned === '' || cleaned === '0' || cleaned === '0.00') return 0;
        const num = parseFloat(cleaned);
        return Number.isFinite(num) ? num : 0;
      }

      // Handle number values
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const chargeLines = [
      { key: 'freightCharge', label: 'Freight Charge' },
      { key: 'awbCharge', label: 'AWB Charge' },
      { key: 'localCollection', label: 'Local Collection' },
      { key: 'doorDelivery', label: 'Door Delivery' },
      { key: 'loadingUnloading', label: 'Loading & Unloading' },
      { key: 'demurrageCharge', label: 'Demurrage Charge' },
      { key: 'ddaCharge', label: 'ODA Charge' },
      { key: 'hamaliCharge', label: 'Hamali Charge' },
      { key: 'packingCharge', label: 'Packing Charge' },
      { key: 'otherCharge', label: 'Other Charge' },
      { key: 'fuelCharge', label: 'Fuel Charge' },
      { key: 'sgstAmount', label: 'SGST' },
      { key: 'cgstAmount', label: 'CGST' },
      { key: 'igstAmount', label: 'IGST' }
    ];

    const priceBreakdownText = chargeLines
      .map(({ key, label }) => {
        const value = parseCharge(chargeDetails?.[key]);
        return value > 0 ? `- ${label}: ${formatCurrency(value)}` : null;
      })
      .filter(Boolean)
      .join('\n');

    // Get total from detailsData only (no invoice value fallback)
    const invoiceTotalValue =
      parseCharge(chargeDetails?.grandTotal) ||
      parseCharge(chargeDetails?.total) ||
      0;

    const invoiceNumberForEmail = invoiceNumber || this.getInvoiceNumberFromBooking({ invoiceNumber, consignmentNumber });

    return `
Booking Confirmed - ${consignmentNumber}

ORDER SUMMARY
- Consignment Number: ${consignmentNumber || 'NA'}
- Invoice Number: ${invoiceNumberForEmail || 'NA'}
- Estimated Delivery: ${formattedDeliveryDate}
- Status: BOOKED
- Payment: Unpaid (Office Booking)

PICKUP DETAILS
- Contact: ${origin.name || origin.companyName || 'NA'} (${origin.mobileNumber || 'NA'})
- Address: ${origin.flatBuilding || ''} ${origin.locality || ''}, ${origin.city || ''}, ${origin.state || ''} ${origin.pincode || ''}

DELIVERY DETAILS
- Contact: ${destination.name || destination.companyName || 'NA'} (${destination.mobileNumber || 'NA'})
- Address: ${destination.flatBuilding || ''} ${destination.locality || ''}, ${destination.city || ''}, ${destination.state || ''} ${destination.pincode || ''}

SHIPMENT INFORMATION
- Consignment Type: ${shipment.natureOfConsignment || 'NA'}
- Packages: ${packagesCount}
- Weight: ${totalWeight} kg
${packageImages && packageImages.length > 0 ? `- Package Images: ${packageImages.length} image(s) attached` : ''}
${invoiceImages && invoiceImages.length > 0 ? `- Invoice Images: ${invoiceImages.length} image(s) attached` : ''}

CHARGE BREAKDOWN
${priceBreakdownText || '- No charge breakdown provided'}
${invoiceTotalValue > 0 ? `- Total: ${formatCurrency(invoiceTotalValue)}` : ''}

NEXT STEPS
- Our team will coordinate pickup as scheduled.
- Keep shipment ready with required documentation.
- Tracking updates will follow once the parcel is dispatched.
- For urgent changes contact support immediately.

TRACK YOUR SHIPMENT:
Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${consignmentNumber}

SUPPORT
Email: info@oclservices.com
Phone: +91 8453 994 809
Website: https://oclservices.com

Thank you for choosing OCL Services.
    `;
  }

  // Generate HTML email for online customer booking confirmation
  async generateOnlineBookingConfirmationEmail(bookingData, packageImageAttachments = []) {
    const {
      bookingReference,
      consignmentNumber,
      bookingDate,
      paymentStatus,
      paymentMethod,
      shippingMode,
      serviceType,
      calculatedPrice,
      basePrice,
      gstAmount,
      pickupCharge,
      totalAmount,
      origin = {},
      destination = {},
      shipment = {}
    } = bookingData;

    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(bookingData);

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '—';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const formatAddress = (data) => {
      if (!data) return 'Address not provided';
      const parts = [
        data.companyName,
        data.name,
        data.flatBuilding,
        data.locality,
        data.landmark,
        data.area,
        [data.city, data.state].filter(Boolean).join(', '),
        data.pincode ? `PIN: ${data.pincode}` : null
      ].filter((part) => part && String(part).trim() !== '');
      return parts.join('<br>');
    };

    const safe = (value, fallback = '—') =>
      value && String(value).trim() !== '' ? value : fallback;

    // Calculate estimated delivery date
    const estimatedDeliveryDate = bookingDate
      ? new Date(new Date(bookingDate).getTime() + 5 * 24 * 60 * 60 * 1000)
      : null;
    const formattedDeliveryDate = estimatedDeliveryDate
      ? estimatedDeliveryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const bookingDateDisplay = formatDateTime(bookingDate);
    const [bookedOn, bookedTime] = bookingDateDisplay && bookingDateDisplay.includes(',')
      ? bookingDateDisplay.split(',').map((part) => part.trim())
      : [bookingDateDisplay, '—'];

    const paymentState =
      paymentStatus && String(paymentStatus).toLowerCase() === 'paid' ? 'Paid' : 'Unpaid';

    const trackingLink = consignmentNumber
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${encodeURIComponent(consignmentNumber)}`
      : process.env.FRONTEND_URL || 'http://localhost:3000';

    const packagesCount = shipment.packagesCount ?? shipment.packageCount ?? shipment.quantity ?? shipment.totalPackages;
    const totalWeight = shipment.weight ?? shipment.totalWeight ?? shipment.volumetricWeight;
    const insuranceText = safe(
      shipment.insurance ||
      shipment.insuranceStatus ||
      (shipment.isInsured ? 'Insured' : '') ||
      (shipment.insurancePolicyNumber ? `Policy #${shipment.insurancePolicyNumber}` : ''),
      'Not provided'
    );

    const supportEmail = process.env.SUPPORT_EMAIL || 'info@oclservices.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+91 8453 994 809';
    const companyWebsite = process.env.COMPANY_WEBSITE || 'https://oclservices.com';
    const companyGstin = process.env.COMPANY_GSTIN || '18AJRPG5984B1ZV';
    const companyAddressShort = process.env.COMPANY_ADDRESS_SHORT || 'Rehabari, Guwahati, Assam';
    const companyPhone = process.env.COMPANY_PHONE || supportPhone;

    const gstPercent = gstAmount && basePrice
      ? (Number(basePrice) !== 0 ? ((Number(gstAmount) / Number(basePrice)) * 100).toFixed(0) : '18')
      : '18';

    const currencyWithoutSymbol = (value) => formatCurrency(value).replace(/^₹/, '');
    const totalAmountValue = totalAmount ?? calculatedPrice ?? null;
    const basePriceValue = basePrice ?? (calculatedPrice ? calculatedPrice / 1.18 : null);
    const gstAmountValue = gstAmount ?? (calculatedPrice && basePriceValue ? calculatedPrice - basePriceValue : null);
    const pickupChargeValue = pickupCharge ?? 0;

    const logoUrl = 'cid:ocl-brand-logo';
    const consignmentNumberValue =
      consignmentNumber && String(consignmentNumber).trim() !== '' ? consignmentNumber : '';

    const hasPackageImages = Array.isArray(packageImageAttachments) && packageImageAttachments.length > 0;
    const packageImagesHtml = hasPackageImages
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" class="package-gallery-table" style="margin:0 auto; width:100%;">
          <tr>
            ${packageImageAttachments
        .slice(0, 4)
        .map(
          (attachment, index) => `
                  <td style="padding:6px; text-align:center;">
                    <img class="package-img" src="cid:${attachment.cid}" alt="Package Image ${index + 1}" width="140" height="140" style="width:140px; height:140px; object-fit:cover; border-radius:0; border:1px solid #E2E8F0; box-shadow:0 2px 6px rgba(15,23,42,0.12); display:block; margin:0 auto;">
                  </td>`
        )
        .join('')}
          </tr>
        </table>`
      : '<div style="text-align:center; color:#94A3B8; font-size:13px; font-style:italic;">No package images available</div>';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed</title>

  <style>
    html,body { margin:0; padding:0; background:#F2F5FF; }
    table { border-collapse:collapse; }
    img { border:0; display:block; outline:none; }
    a { color:inherit; text-decoration:none; }
    .container { width:100%; max-width:640px; }
    .two-col { vertical-align:top; }
    .mobile-center { text-align:center; }
    .package-gallery-table { width:100%; }

    @media only screen and (max-width:600px) {
      body { padding:8px !important; }
      .container { width:100% !important; max-width:100% !important; padding:0 !important; }
      .two-col,
      .mobile-stack { display:block !important; width:100% !important; }
      .mobile-center,
      .center-mobile { text-align:center !important; }
      .mobile-space { margin-top:12px !important; }
      .invoice-table td { display:flex !important; justify-content:space-between; width:100% !important; padding:4px 0 !important; }
      .cta { display:block !important; width:100% !important; text-align:center !important; }
      .booking-title { font-size:20px !important; letter-spacing:1px !important; }
      .booking-meta { font-size:12px !important; line-height:20px !important; }
      .header-logo img { max-width:150px !important; margin:12px auto 0 !important; }
      .package-gallery-table td { display:inline-block !important; width:48% !important; padding:4px !important; }
      .package-gallery-table td:only-child { width:100% !important; text-align:center !important; }
      .package-gallery-table td:nth-child(n+3) { margin-top:8px !important; }
      .package-img { width:100% !important; height:auto !important; max-width:160px !important; }
      .booking-summary { background:transparent !important; border:none !important; }
      .price-summary { background:transparent !important; border:none !important; }
      .booked-section { padding-left:35% !important; }
      .tracking-section { padding-left:20% !important; }
      .barcode-cell { padding-left:5% !important; }
      .estimated-date-cell { padding-left:5% !important; }
      .email-header { background:linear-gradient(135deg,#1a4a7a,#2d6ba8) !important; border-bottom:1px solid #3d7bb8 !important; }
    }

    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; }
  </style>

</head>

<body class="font-sans" style="background:#F2F5FF; margin:0; padding:16px;">
<table width="100%">
<tr><td align="center">

<!-- MAIN CONTAINER -->
<table width="640" class="container"
style="background:#ffffff; border-radius:0; overflow:hidden; box-shadow:0 10px 24px rgba(9,16,31,0.1); border-radius:10px; width:100%; max-width:640px;">

  <!-- HEADER -->
  <tr>
    <td class="email-header" style="padding:22px 28px; border-bottom:1px solid #0D3170; background:linear-gradient(135deg,#062858,#0F4C92);">
      <table width="100%">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; font-size:12px; color:#D9E3FF; font-weight:600; padding-bottom:8px;">
            <a href="${companyWebsite}" style="color:#FFEE9D; text-decoration:none;"><br>https://oclservices.com</a>
          </td>
          <td class="two-col center-mobile mobile-stack" style="width:34%; text-align:center; padding-bottom:8px;">
            <div class="booking-title" style="font-size:18px; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">Shipping Confirmed</div>
          </td>
          <td class="two-col mobile-stack mobile-center header-logo" style="width:33%; text-align:right;">
            <!--[if gte mso 9]><table><tr><td style="padding-top:0;padding-bottom:0;"><![endif]-->
            <img src="${logoUrl}" width="190" style="display:block; margin-left:auto; filter:drop-shadow(0 6px 14px rgba(0,0,0,0.35));">
            <!--[if gte mso 9]></td></tr></table><![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BOOKED TEXT -->
  <tr>
    <td class="booked-section" style="padding:20px 28px; background:linear-gradient(135deg,#F7F3FF,#EEF4FF);">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:left; padding:0px 0;">
            <div style="font-size:14px; font-weight:600; color:#0B1F4A;">${bookedOn}</div>
            <div style="font-size:13px; color:#4B5563; margin-top:4px;">${bookedTime}</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:34%; text-align:center; padding:6px 0;">
            <div class="booking-title" style="font-size:24px; font-weight:800; color:#0B1F4A; text-transform:uppercase; letter-spacing:2px;">Booked</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:right; padding:6px 0;">
            <div style="font-size:20px; font-weight:700; color:${paymentState === 'Paid' ? '#0F8A45' : '#B02800'}; text-transform:uppercase;">
              ${paymentState === 'Paid' ? 'Paid' : 'Not paid'}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ACTION / BARCODE / DELIVERY -->
  <tr>
    <td class="tracking-section" style="padding:18px 24px; background:#0B1433;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-space" style="width:33%; padding:0; vertical-align:middle;">
            <a href="${trackingLink}" class="cta"
              style="display:inline-block; padding:10px 18px; background:linear-gradient(120deg,#FF512F,#DD2476); border-radius:0; color:white; font-weight:600; letter-spacing:0.3px;">
              Track Booking
            </a>
          </td>
          <td class="two-col mobile-stack mobile-center mobile-space barcode-cell" style="width:34%; padding:0; text-align:center; vertical-align:middle;">
            <div style="font-size:10px; color:#8FA0C2; text-transform:uppercase; letter-spacing:1px;">Scan to Track</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(consignmentNumber)}" style="max-width:180px; margin:6px auto 0; display:block;">
            <div style="font-size:10px; color:#c7cede; margin-top:4px;">AWB: ${safe(consignmentNumber)}</div>
          </td>
          <td class="two-col mobile-stack mobile-center estimated-date-cell" style="width:33%; padding:0; text-align:right; vertical-align:middle;">
            <div style="font-size:10px; color:#d9b59e; text-transform:uppercase; letter-spacing:1px;">Estimated Delivery</div>
            <div style="font-size:15px; font-weight:600; color:#FFEBDD; margin-top:4px;">${formattedDeliveryDate}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SHIPMENT DETAILS -->
  <tr><td style="padding-top:0;">
    <div style="
      padding:18px;
      border-radius:0;
      background:linear-gradient(135deg,#FDF3F3,#FFF7E5);
      border:1px solid #FFD9C1;
      box-shadow:0 8px 20px rgba(255,146,76,0.15);
    ">
      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        Hello <strong>${safe(origin.name || origin.companyName || 'Customer')}</strong>,
      </p>

      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        We have received your shipment of <strong>${safe(destination.name || destination.companyName)}</strong>, ${safe(destination.city)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Pin - ${safe(destination.pincode)}, Mob - ${safe(destination.mobileNumber)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Invoice No: <strong>${safe(invoiceNumberForEmail)}</strong>
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Arriving on <strong>${formattedDeliveryDate}</strong>
      </p>

      <p style="font-size:13px; margin:0;">
        Shipping Address:
        <strong>${safe(destination.companyName || destination.name)}, ${destination.city}, ${destination.state}</strong>
      </p>
    </div>
  </td></tr>

  

  <!-- BOOKING SUMMARY -->
  <tr>
    <td style="padding-top:0;">
      <table width="100%" style="border-collapse:collapse; border-spacing:0;">
        <tr>

          <!-- LEFT SUMMARY -->
          <td class="two-col mobile-stack mobile-space booking-summary" style="width:60%; padding:16px; border:1px solid #CFE0FF; background:linear-gradient(135deg,#F6FAFF,#F0F6FF); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; color:#0F172A; margin-bottom:6px;text-decoration:underline;">Booking Summary :</div>

            <table width="100%">
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Consignment No :</td><td style="font-weight:500; color:#7A7A7A">${safe(consignmentNumber)}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Service :</td><td style="font-weight:500; color:#7A7A7A ">${safe(serviceType)}</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Packages :</td><td style="font-weight:500; color:#7A7A7A">${packagesCount} pcs</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Weight :</td><td style="font-weight:500; color:#7A7A7A">${totalWeight} kg</td></tr>
              <tr><td style="font-size:12px; padding:5px 0; color:#4A5568;">Insurance :</td><td style="font-weight:500; color:#7A7A7A">${insuranceText}</td></tr>
            </table>
          </td>

          <!-- PRICE SUMMARY -->
          <td class="two-col mobile-stack price-summary" style="width:40%; padding:16px; border:1px solid #FFD5A8; background:linear-gradient(135deg,#FFF8F0,#FFF2E2); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Price Summary :</div>

            <table width="100%" class="invoice-table">
              <tr><td style="font-size:12px; color:#7A7A7A; padding:5px 0;">Base Price : </td><td align="right" style="font-weight:500;color:#7A7A7A;">₹${currencyWithoutSymbol(basePriceValue)}</td></tr>
              <tr><td style="font-size:12px; color:#7A7A7A; padding:5px 0;">Pickup Charge :</td><td align="right" style="font-weight:500;color:#7A7A7A;">₹${currencyWithoutSymbol(pickupChargeValue)}</td></tr>
              <tr><td style="font-size:12px; color:#7A7A7A; padding:5px 0;">GST (${gstPercent}%) :</td><td align="right" style="font-weight:500;color:#7A7A7A;">₹${currencyWithoutSymbol(gstAmountValue)}</td></tr>
              

              <tr>
                <td style="border-top:1px dashed #F7C393; padding-top:8px; font-weight:700;">Total :</td>
                <td align="right" style="border-top:1px dashed #F7C393; font-size:14px; font-weight:800;">
                  ₹${currencyWithoutSymbol(totalAmountValue)}
                </td>
              </tr>
            </table>
          </td>

        </tr>
      </table>
    </td>
  </tr>

        <!-- PACKAGE GALLERY -->
        <tr><td style="padding-top:0;">
          <div style="padding:16px; background:#FFF3F5; border:1px solid #FFD0D7; border-radius:0; text-decoration:underline;">
            <div style="font-size:13px; font-weight:700; color:#333; margin-bottom:8px;">Package Gallery :</div>
            ${packageImagesHtml}
          </div>
        </td></tr>

        <!-- NEXT STEPS -->
        <tr><td style="padding-top:0;">
          <div style="padding:14px; border-radius:0; background:#ffffff; border:1px solid #DEE5FF;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Next Steps :</div>
            <ol style="font-size:12px; color:#4A5568; padding-left:18px;">
              <li>Our team will coordinate pickup.</li>
              <li>Keep shipment unpacked with documents.</li>
              <li>Tracking updates after hub scan.</li>
            </ol>
          </div>
        </td></tr>

        <!-- SUPPORT -->
        <tr><td style="padding-top:0;">
          <div style="padding:12px 5px; background:#F5F9FF; border:1px solid #DCE6FF; border-radius:0;">
            <table width="100%">
              <tr>
                <td class="mobile-stack mobile-center" align="center" style="font-size:12px; font-weight:700;">
                  Need Assistance? Write to us :
                  <a href="mailto:${supportEmail}" style="color:#0A3A7D">${supportEmail}</a>
                   or Call Us @
                  <a href="tel:${supportPhone}" style="color:#0A3A7D">${supportPhone}</a>
                </td>
                
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- FOOTER -->

        <tr>
      <td style="background:#0A3A7D; color:white; padding:12px 16px; text-align:center; font-size:12px;">
        <div style="margin-top:4px; font-size:11px;">
            This is an automated email from <strong>OCL.</strong>.
            GSTIN: ${companyGstin} - <a href="${companyWebsite}" style="color:white;">${companyWebsite}</a>
          </div>
      </td>
    </tr>


      </table>
    </td>
  </tr>

  </table>


<!-- SPACER -->
<table width="100%" style="margin-top:4px; border-collapse:collapse;"><tr><td align="center">
  <table width="640" align="center" style="border-collapse:collapse;">
    <tr>
      <td style="text-align:center; font-size:12px; color:#6B7280;">
        If you didn’t make this booking, contact support immediately.
      </td>
    </tr>
  </table>
</td></tr></table>

</td></tr></table>
</body>
</html>
    `;
  }

  // Generate text email for online booking confirmation
  generateOnlineBookingConfirmationTextVersion(bookingData) {
    const {
      bookingReference,
      consignmentNumber,
      bookingDate,
      paymentStatus,
      paymentMethod,
      shippingMode,
      serviceType,
      calculatedPrice,
      basePrice,
      gstAmount,
      pickupCharge,
      totalAmount,
      origin = {},
      destination = {},
      shipment = {}
    } = bookingData;

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'NA';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return 'NA';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(bookingData);

    return `
Booking Confirmed - ${bookingReference || consignmentNumber}

ORDER SUMMARY
- Consignment Number: ${consignmentNumber || 'NA'}
- Invoice Number: ${invoiceNumberForEmail || 'NA'}
- Booking Reference: ${bookingReference || 'NA'}
- Service: ${serviceType || 'NA'} (${shippingMode || 'Standard'})
- Payment: ${(paymentStatus === 'paid' ? 'Paid' : 'Pending')} ${paymentMethod ? `(${paymentMethod})` : ''}
- Total Amount: ${formatCurrency(totalAmount ?? (calculatedPrice ? calculatedPrice + (pickupCharge || 100) : null))}
${basePrice || gstAmount || pickupCharge ? `
- Base Price: ${formatCurrency(basePrice ?? (calculatedPrice ? calculatedPrice / 1.18 : null))}
- GST (18%): ${formatCurrency(gstAmount ?? (calculatedPrice ? calculatedPrice - (calculatedPrice / 1.18) : null))}
- Pickup Charge: ${formatCurrency(pickupCharge ?? 100)}
` : ''}
- Booked On: ${formatDateTime(bookingDate)}

PICKUP DETAILS
- Contact: ${origin.name || 'NA'} (${origin.mobileNumber || 'NA'})
- Address: ${origin.flatBuilding || ''} ${origin.locality || ''}, ${origin.city || ''}, ${origin.state || ''} ${origin.pincode || ''}

DELIVERY DETAILS
- Contact: ${destination.name || 'NA'} (${destination.mobileNumber || 'NA'})
- Address: ${destination.flatBuilding || ''} ${destination.locality || ''}, ${destination.city || ''}, ${destination.state || ''} ${destination.pincode || ''}

SHIPMENT INFORMATION
- Consignment Type: ${shipment.natureOfConsignment || 'NA'}
- Packages: ${shipment.packagesCount || 'NA'}
- Weight: ${shipment.weight || 'NA'} kg
- Dimensions: ${shipment.length || 'NA'} x ${shipment.width || 'NA'} x ${shipment.height || 'NA'} cm
- Insurance: ${shipment.insurance || 'NA'} ${shipment.insurancePolicyNumber ? `- Policy #${shipment.insurancePolicyNumber}` : ''}

NEXT STEPS
- Our team will coordinate pickup as scheduled.
- Keep shipment ready with required documentation.
- Tracking updates will follow once the parcel is dispatched.
- For urgent changes contact support immediately.

SUPPORT
Email: info@oclservices.com
Phone: +91 8453 994 809
Website: https://oclservices.com

Thank you for choosing OCL Services.
    `;
  }

  // Send online booking confirmation email
  async sendOnlineBookingConfirmationEmail(bookingData) {
    const senderEmail = bookingData?.origin?.email;
    if (!senderEmail || String(senderEmail).trim() === '') {
      throw new Error('Sender email is required to send booking confirmation');
    }

    const consignmentDisplay =
      bookingData?.consignmentNumber ||
      bookingData?.bookingReference ||
      'Booking';

    const originCity =
      bookingData?.origin?.city ||
      bookingData?.origin?.state ||
      'Origin';

    const destinationCity =
      bookingData?.destination?.city ||
      bookingData?.destination?.state ||
      'Destination';

    const bookingSubject = `${consignmentDisplay}  ${originCity} - ${destinationCity}`;

    // Ensure email service is initialized
    if (!this.isInitialized) {
      await this.initializeEmailService();
    }

    if (!this.transporter) {
      throw new Error('Email service not properly initialized');
    }

    // Refresh OAuth token if needed
    if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
            clientId: this.oauth2Client._clientId,
            clientSecret: this.oauth2Client._clientSecret,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: credentials.access_token
          }
        });
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
      }
    }

    // Prepare attachments: package images and logo
    const packageImages = (bookingData.packageImages || bookingData.shipment?.packageImages || []).filter(img => img && String(img).trim() !== '');
    let packageImageAttachments = [];

    if (packageImages.length > 0) {
      try {
        const validatedImages = await this.validateImageUrls(packageImages);
        if (validatedImages.length > 0) {
          packageImageAttachments = await S3Service.downloadImagesForEmail(validatedImages);
          console.log(`📧 Attached ${packageImageAttachments.length} package images`);
        }
      } catch (error) {
        console.error('❌ Failed to download package images:', error);
      }
    }

    const attachments = [];
    const logoPath = join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'ocl-logo.png');
    if (existsSync(logoPath)) {
      attachments.push({ filename: 'ocl-logo.png', path: logoPath, cid: 'ocl-brand-logo' });
    }
    packageImageAttachments.forEach(att => attachments.push({
      filename: att.filename, content: att.buffer, cid: att.cid, contentType: att.contentType
    }));

    const mailOptions = {
      from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
      to: senderEmail,
      subject: bookingSubject,
      html: await this.generateOnlineBookingConfirmationEmail(bookingData, packageImageAttachments),
      text: this.generateOnlineBookingConfirmationTextVersion(bookingData),
      attachments: attachments
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Online booking confirmation email sent to ${senderEmail}:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipient: senderEmail
    };
  }

  // Generate HTML email for corporate booking confirmation (no price summary block)
  async generateCorporateBookingConfirmationEmail(bookingData, packageImageAttachments = []) {
    const {
      bookingReference,
      consignmentNumber,
      bookingDate,
      serviceType,
      shippingMode,
      origin = {},
      destination = {},
      shipment = {},
      invoice = {},
      payment = {},
      corporateInfo = {}
    } = bookingData;

    const bookingForInvoice = {
      bookingReference,
      consignmentNumber,
      bookingDate,
      shipment,
      invoiceData: invoice,
      invoiceNumber: invoice?.invoiceNumber
    };

    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(bookingForInvoice);

    const formatDateTime = (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const safe = (value, fallback = '—') =>
      value && String(value).trim() !== '' ? value : fallback;

    const packagesCount = shipment.packagesCount ?? shipment.totalPackages ?? shipment.quantity ?? shipment.dimensions?.length ?? '—';
    const totalWeight = shipment.actualWeight || shipment.weight || shipment.totalWeight || shipment.volumetricWeight || '—';
    const chargeableWeight = shipment.chargeableWeight || invoice.chargeableWeight || shipment.volumetricWeight || shipment.actualWeight || '—';
    const insuranceText = safe(
      shipment.insurance ||
        shipment.insuranceStatus ||
        (shipment.isInsured ? 'Insured' : '') ||
        (shipment.insurancePolicyNumber ? `Policy #${shipment.insurancePolicyNumber}` : ''),
      'Not provided'
    );

    const paymentTypeLabel =
      payment?.paymentType === 'TP' ? 'To Pay' : 'Freight Paid';

    // Check if payment type is TP to show price details
    const isTP = payment?.paymentType === 'TP';

    // Format currency function
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '—';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    // Extract invoice data for price breakdown (only for TP)
    const calculatedPrice = invoice?.calculatedPrice || invoice?.basePrice || 0;
    const gstAmount = invoice?.gst || 0;
    const finalPrice = invoice?.finalPrice || invoice?.totalPrice || (calculatedPrice + gstAmount);
    const gstPercent = calculatedPrice > 0 ? ((gstAmount / calculatedPrice) * 100).toFixed(0) : '18';

    // Build price breakdown array for TP
    const priceBreakdown = [];
    if (isTP && calculatedPrice > 0) {
      priceBreakdown.push({ label: 'Base Price', value: calculatedPrice });
      if (gstAmount > 0) {
        priceBreakdown.push({ label: `GST (${gstPercent}%)`, value: gstAmount });
      }
    }

    const companyWebsite = process.env.COMPANY_WEBSITE || 'https://oclservices.com';
    const supportEmail = process.env.SUPPORT_EMAIL || 'info@oclservices.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+91 8453 994 809';
    const companyGstin = process.env.COMPANY_GSTIN || '18AJRPG5984B1ZV';
    const companyPhone = process.env.COMPANY_PHONE || supportPhone;

    const trackingLink = consignmentNumber
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${encodeURIComponent(consignmentNumber)}`
      : process.env.FRONTEND_URL || 'http://localhost:3000';

    const bookingDateDisplay = formatDateTime(bookingDate);
    const [bookedOn, bookedTime] = bookingDateDisplay && bookingDateDisplay.includes(',')
      ? bookingDateDisplay.split(',').map((part) => part.trim())
      : [bookingDateDisplay, '—'];

    const hasPackageImages = Array.isArray(packageImageAttachments) && packageImageAttachments.length > 0;
    const packageImagesHtml = hasPackageImages
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" class="package-gallery-table" style="margin:0 auto; width:100%;">
          <tr>
            ${packageImageAttachments
        .slice(0, 4)
        .map(
          (attachment, index) => `
                  <td style="padding:6px; text-align:center;">
                    <img class="package-img" src="cid:${attachment.cid}" alt="Package Image ${index + 1}" width="140" height="140" style="width:140px; height:140px; object-fit:cover; border-radius:0; border:1px solid #E2E8F0; box-shadow:0 2px 6px rgba(15,23,42,0.12); display:block; margin:0 auto;">
                  </td>`
        )
        .join('')}
          </tr>
        </table>`
      : '<div style="text-align:center; color:#94A3B8; font-size:13px; font-style:italic;">No package images available</div>';

    const logoUrl = 'cid:ocl-brand-logo';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Corporate Booking Confirmed</title>

  <style>
    html,body { margin:0; padding:0; background:#F2F5FF; }
    table { border-collapse:collapse; }
    img { border:0; display:block; outline:none; }
    a { color:inherit; text-decoration:none; }
    .container { width:100%; max-width:640px; }
    .two-col { vertical-align:top; }
    .mobile-center { text-align:center; }
    .package-gallery-table { width:100%; }

    @media only screen and (max-width:600px) {
      body { padding:8px !important; }
      .container { width:100% !important; max-width:100% !important; padding:0 !important; }
      .two-col,
      .mobile-stack { display:block !important; width:100% !important; }
      .mobile-center,
      .center-mobile { text-align:center !important; }
      .mobile-space { margin-top:12px !important; }
      .invoice-table td { display:flex !important; justify-content:space-between; width:100% !important; padding:4px 0 !important; }
      .cta { display:block !important; width:100% !important; text-align:center !important; }
      .booking-title { font-size:20px !important; letter-spacing:1px !important; }
      .booking-meta { font-size:12px !important; line-height:20px !important; }
      .header-logo img { max-width:150px !important; margin:12px auto 0 !important; }
      .package-gallery-table td { display:inline-block !important; width:48% !important; padding:4px !important; }
      .package-gallery-table td:only-child { width:100% !important; text-align:center !important; }
      .package-gallery-table td:nth-child(n+3) { margin-top:8px !important; }
      .package-img { width:100% !important; height:auto !important; max-width:160px !important; }
      .booking-summary { background:transparent !important; border:none !important; }
      .price-summary { background:transparent !important; border:none !important; }
      .booked-section { padding-left:35% !important; }
      .tracking-section { padding-left:20% !important; }
      .barcode-cell { padding-left:5% !important; }
      .estimated-date-cell { padding-left:5% !important; }
      .email-header { background:linear-gradient(135deg,#0F2856,#174078) !important; border-bottom:1px solid #244D8B !important; }
    }

    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; }
  </style>

</head>

<body class="font-sans" style="background:#F2F5FF; margin:0; padding:16px;">
<table width="100%">
<tr><td align="center">

<!-- MAIN CONTAINER -->
<table width="640" class="container"
style="background:#ffffff; border-radius:0; overflow:hidden; box-shadow:0 10px 24px rgba(9,16,31,0.1); border-radius:10px; width:100%; max-width:640px;">

  <!-- HEADER -->
  <tr>
    <td class="email-header" style="padding:22px 28px; border-bottom:1px solid #0D3170; background:linear-gradient(135deg,#062858,#0F4C92);">
      <table width="100%">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; font-size:12px; color:#D9E3FF; font-weight:600; padding-bottom:8px;">
            <a href="${companyWebsite}" style="color:#FFEE9D; text-decoration:none;"><br>${companyWebsite.replace('https://','')}</a>
          </td>
          <td class="two-col center-mobile mobile-stack" style="width:34%; text-align:center; padding-bottom:8px;">
            <div class="booking-title" style="font-size:18px; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">Corporate Booking</div>
          </td>
          <td class="two-col mobile-stack mobile-center header-logo" style="width:33%; text-align:right;">
            <img src="${logoUrl}" width="190" style="display:block; margin-left:auto; filter:drop-shadow(0 6px 14px rgba(0,0,0,0.35));">
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BOOKED TEXT -->
  <tr>
    <td class="booked-section" style="padding:20px 28px; background:linear-gradient(135deg,#F7F3FF,#EEF4FF);">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:left; padding:0px 0;">
            <div style="font-size:14px; font-weight:600; color:#0B1F4A;">${bookedOn}</div>
            <div style="font-size:13px; color:#4B5563; margin-top:4px;">${bookedTime}</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:34%; text-align:center; padding:6px 0;">
            <div class="booking-title" style="font-size:24px; font-weight:800; color:#0B1F4A; text-transform:uppercase; letter-spacing:2px;">Booked</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:right; padding:6px 0;">
            <div style="font-size:13px; font-weight:700; color:#0F8A45; text-transform:uppercase;">
              ${paymentTypeLabel}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ACTION / BARCODE / DELIVERY -->
  <tr>
    <td class="tracking-section" style="padding:18px 24px; background:#0B1433;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-space" style="width:33%; padding:0; vertical-align:middle;">
            <a href="${trackingLink}" class="cta"
              style="display:inline-block; padding:10px 18px; background:linear-gradient(120deg,#FF512F,#DD2476); border-radius:0; color:white; font-weight:600; letter-spacing:0.3px;">
              Track Booking
            </a>
          </td>
          <td class="two-col mobile-stack mobile-center mobile-space barcode-cell" style="width:34%; padding:0; text-align:center; vertical-align:middle;">
            <div style="font-size:10px; color:#8FA0C2; text-transform:uppercase; letter-spacing:1px;">Scan to Track</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(consignmentNumber || bookingReference || '')}" style="max-width:180px; margin:6px auto 0; display:block;">
            <div style="font-size:10px; color:#c7cede; margin-top:4px;">AWB: ${safe(consignmentNumber || bookingReference)}</div>
          </td>
          <td class="two-col mobile-stack mobile-center estimated-date-cell" style="width:33%; padding:0; text-align:right; vertical-align:middle;">
            <div style="font-size:10px; color:#d9b59e; text-transform:uppercase; letter-spacing:1px;">Service Type</div>
            <div style="font-size:15px; font-weight:600; color:#FFEBDD; margin-top:4px;">${safe(serviceType || 'Standard')}</div>
            <div style="font-size:11px; color:#b8c4dd;">Mode: ${safe(shippingMode || 'Surface')}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- GREETING -->
  <tr><td>
    <div style="padding:18px; border-radius:0; background:linear-gradient(135deg,#FDF3F3,#FFF7E5); border:0px solid #FFD9C1; box-shadow:0 8px 20px rgba(255,146,76,0.15); font-size:13px; color:#333;">
      <p style="margin:0 0 6px;">Hello <strong>${safe(origin.name || corporateInfo.contactPerson || corporateInfo.companyName || 'Team')}</strong>,</p>
      <p style="margin:0 0 6px;">We have scheduled your shipment for <strong>${safe(destination.name || destination.companyName || destination.city)}</strong>, ${safe(destination.city)}, PIN ${safe(destination.pincode)}.</p>
      <p style="margin:0 0 6px;">Invoice No: <strong>${safe(invoiceNumberForEmail)}</strong></p>
      <p style="margin:0;">Our operations team will coordinate pickup and keep your stakeholders informed.</p>
    </div>
  </td></tr>

  <!-- BOOKING SUMMARY -->
  <tr>
    <td style="padding-top:0;">
      <table width="100%" style="border-collapse:collapse; border-spacing:0;">
        <tr>
          ${isTP ? `
          <!-- LEFT SUMMARY (TP - Two Column Layout) -->
          <td class="two-col mobile-stack mobile-space booking-summary" style="width:60%; padding:16px; border:0px solid #CFE0FF; background:linear-gradient(135deg,#F6FAFF,#F0F6FF); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; color:#0F172A; margin-bottom:6px;text-decoration:underline;">Booking Summary :</div>

            <table width="100%" style="font-size:12px; color:#4A5568;">
              <tr><td style="padding:5px 0; width:40%;">Consignment No :</td><td style="font-weight:600; color:#111827">${safe(consignmentNumber || bookingReference)}</td></tr>
              <tr><td style="padding:5px 0;">Route :</td><td style="font-weight:500; color:#0F172A">${safe(origin.city || origin.state)} → ${safe(destination.city || destination.state)}</td></tr>
              <tr><td style="padding:5px 0;">Service :</td><td style="font-weight:500; color:#0F172A">${(serviceType && serviceType.toLowerCase() === 'priority') ? 'Priority' : `${safe(serviceType || 'Standard')} • ${safe(shippingMode || 'Surface')}`}</td></tr>
              <tr><td style="padding:5px 0;">Packages :</td><td style="font-weight:500; color:#0F172A">${packagesCount} unit</td></tr>
              <tr><td style="padding:5px 0;">Weight :</td><td style="font-weight:500; color:#0F172A">${totalWeight} Kg.</td></tr>
              <tr><td style="padding:5px 0;">Insurance :</td><td style="font-weight:500; color:#0F172A">${(insuranceText && insuranceText.toLowerCase() === 'without insurance') ? 'NA' : insuranceText}</td></tr>
            </table>
          </td>

          <!-- PRICE SUMMARY (TP Only) -->
          <td class="two-col mobile-stack price-summary" style="width:40%; padding:16px; border:0px solid #FFD5A8; background:linear-gradient(135deg,#FFF8F0,#FFF2E2); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Price Summary :</div>

            <table width="100%" class="invoice-table" style="font-size:12px;">
              ${priceBreakdown.length > 0
        ? priceBreakdown.map(item => `
                  <tr>
                    <td style="color:#7A7A7A; padding:5px 0;">${item.label} :</td>
                    <td align="right" style="font-weight:500;color:#7A7A7A;">${formatCurrency(item.value)}</td>
                  </tr>
                `).join('')
        : `<tr><td colspan="2" style="font-size:11px; color:#7A7A7A; padding:8px 0; font-style:italic; text-align:center;">No charge breakdown provided</td></tr>`
      }
              ${finalPrice > 0 ? `
              <tr>
                <td style="border-top:1px dashed #F7C393; padding-top:8px; font-weight:700; color:black;">Total :</td>
                <td align="right" style="border-top:1px dashed #F7C393; font-size:14px; font-weight:800; color:black;">${formatCurrency(finalPrice)}</td>
              </tr>
              ` : ''}
            </table>
          </td>
          ` : `
          <!-- FULL WIDTH SUMMARY (FP - No Price Details) -->
          <td class="booking-summary" style="width:100%; padding:16px; border:0px solid #CFE0FF; background:linear-gradient(135deg,#F6FAFF,#F0F6FF); vertical-align:top;">
            <div style="font-size:12px; font-weight:700; color:#0F172A; margin-bottom:0px;text-decoration:underline;">Booking Summary :</div>

            <table width="100%" style="font-size:12px; color:#4A5568;">
              <tr><td style="padding:5px 0; width:40%;">Consignment No :</td><td style="font-weight:600; color:#111827">${safe(consignmentNumber || bookingReference)}</td></tr>
              <tr><td style="padding:5px 0;">Route :</td><td style="font-weight:500; color:#0F172A">${safe(origin.city || origin.state)} → ${safe(destination.city || destination.state)}</td></tr>
              <tr><td style="padding:5px 0;">Service :</td><td style="font-weight:500; color:#0F172A">${(serviceType && serviceType.toLowerCase() === 'priority') ? 'Priority' : `${safe(serviceType || 'Standard')} • ${safe(shippingMode || 'Surface')}`}</td></tr>
              <tr><td style="padding:5px 0;">Packages :</td><td style="font-weight:500; color:#0F172A">${packagesCount} units</td></tr>
              <tr><td style="padding:5px 0;">Weight :</td><td style="font-weight:500; color:#0F172A">${totalWeight} Kg.</td></tr>
              <tr><td style="padding:5px 0;">Insurance :</td><td style="font-weight:500; color:#0F172A">${(insuranceText && insuranceText.toLowerCase() === 'without insurance') ? 'NA' : insuranceText}</td></tr>
            </table>
          </td>
          `}
        </tr>
      </table>
    </td>
  </tr>

  <!-- PACKAGE GALLERY -->
  <tr><td style="padding-top:0px;">
    <div style="padding:16px; background:#FFF3F5; border:0px solid #FFD0D7; text-decoration:underline;">
      <div style="font-size:13px; font-weight:700; color:#333; margin-bottom:8px;">Package Gallery :</div>
      ${packageImagesHtml}
    </div>
  </td></tr>

  <!-- NEXT STEPS -->
  <tr><td style="padding-top:0px;">
    <div style="padding:14px; border-radius:0; background:#ffffff; border:0px solid #DEE5FF;">
      <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Next Steps :</div>
      <ol style="font-size:12px; color:#4A5568; padding-left:18px;">
        <li>Keep shipment ready with required documents.</li>
        <li>Our Operation team will coordinate pickup based on slot.</li>
        <li>Share AWB with consignee for tracking updates.</li>
      </ol>
    </div>
  </td></tr>

  <!-- SUPPORT -->
  <tr><td style="padding-top:12px;">
    <div style="padding:12px 5px; background:#F5F9FF; border:0px solid #DCE6FF;">
      <table width="100%">
        <tr>
          <td class="mobile-stack mobile-center" align="center" style="font-size:12px; font-weight:700;">
            Need Assistance? Write to us :
            <a href="mailto:${supportEmail}" style="color:#0A3A7D">${supportEmail}</a>
             or Call Us @
            <a href="tel:${supportPhone}" style="color:#0A3A7D">${supportPhone}</a>
          </td>
        </tr>
      </table>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0A3A7D; color:white; padding:12px 16px; text-align:center; font-size:12px;">
      <div style="margin-top:4px; font-size:11px;">
          This is an automated email from <strong>OCL.</strong>.
          GSTIN: ${companyGstin} • Customer Care: ${companyPhone}
        </div>
    </td>
  </tr>

</table>

<!-- SPACER -->
<table width="100%" style="margin-top:4px; border-collapse:collapse;"><tr><td align="center">
  <table width="640" align="center" style="border-collapse:collapse;">
    <tr>
      <td style="text-align:center; font-size:12px; color:#6B7280;">
        If you didn’t make this booking, contact support immediately.
      </td>
    </tr>
  </table>
</td></tr></table>

</td></tr></table>
</body>
</html>
    `;
  }

  // Text version of corporate booking confirmation email
  generateCorporateBookingConfirmationTextVersion(bookingData) {
    const {
      bookingReference,
      consignmentNumber,
      bookingDate,
      serviceType,
      shippingMode,
      origin = {},
      destination = {},
      shipment = {},
      invoice = {},
      payment = {},
      corporateInfo = {}
    } = bookingData;

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'NA';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return 'NA';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const packagesCount = shipment.packagesCount ?? shipment.totalPackages ?? shipment.quantity ?? shipment.dimensions?.length ?? 'NA';
    const totalWeight = shipment.actualWeight || shipment.weight || shipment.totalWeight || shipment.volumetricWeight || 'NA';
    const chargeableWeight = shipment.chargeableWeight || invoice.chargeableWeight || shipment.volumetricWeight || shipment.actualWeight || 'NA';

    const bookingForInvoice = {
      bookingReference,
      consignmentNumber,
      bookingDate,
      shipment,
      invoiceData: invoice,
      invoiceNumber: invoice?.invoiceNumber
    };
    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(bookingForInvoice);

    const trackingLink = consignmentNumber
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${encodeURIComponent(consignmentNumber)}`
      : process.env.FRONTEND_URL || 'http://localhost:3000';

    const paymentTypeLabel =
      payment?.paymentType === 'TP' ? 'To Pay (TP)' : 'Freight Paid (FP)';

    return `
Corporate Booking Confirmed - ${consignmentNumber || bookingReference}

ACCOUNT
- Corporate: ${corporateInfo.companyName || 'NA'} ${corporateInfo.corporateId ? `(ID: ${corporateInfo.corporateId})` : ''}
- Invoice Number: ${invoiceNumberForEmail || 'NA'}
- Booking Reference: ${bookingReference || 'NA'}
- Service: ${serviceType || 'Standard'} (${shippingMode || 'Surface'})
- Booked On: ${formatDateTime(bookingDate)}
- Payment Type: ${paymentTypeLabel}

ROUTE
- From: ${origin.city || origin.state || 'NA'}
- To: ${destination.city || destination.state || 'NA'}

SHIPMENT
- Packages: ${packagesCount}
- Weight: ${totalWeight} kg (Chargeable: ${chargeableWeight} kg)
- Insurance: ${shipment.insurance || 'Not provided'}

TRACKING
- Consignment: ${consignmentNumber || bookingReference || 'NA'}
- Link: ${trackingLink}

SUPPORT
- Email: info@oclservices.com
- Phone: +91 8453 994 809

Thank you for shipping with OCL Services.
    `;
  }

  // Send corporate booking confirmation email
  async sendCorporateBookingConfirmationEmail(bookingData) {
    const senderEmail =
      bookingData?.origin?.email ||
      bookingData?.originData?.email ||
      bookingData?.corporateInfo?.email;

    if (!senderEmail || String(senderEmail).trim() === '') {
      throw new Error('Sender email is required to send corporate booking confirmation');
    }

    const normalizedData = {
      bookingReference: bookingData.bookingReference || bookingData.consignmentNumber,
      consignmentNumber: bookingData.consignmentNumber,
      bookingDate: bookingData.bookingDate || bookingData.createdAt || new Date(),
      serviceType:
        bookingData.serviceType ||
        bookingData.invoice?.serviceType ||
        bookingData.invoiceData?.serviceType ||
        bookingData.shipment?.services ||
        bookingData.shipmentData?.services ||
        'Express',
      shippingMode:
        bookingData.shippingMode ||
        bookingData.invoice?.transportMode ||
        bookingData.invoiceData?.transportMode ||
        bookingData.shipment?.mode ||
        bookingData.shipmentData?.mode ||
        'Standard',
      origin: bookingData.origin || bookingData.originData || {},
      destination: bookingData.destination || bookingData.destinationData || {},
      shipment: bookingData.shipment || bookingData.shipmentData || {},
      invoice: bookingData.invoice || bookingData.invoiceData || {},
      payment: bookingData.payment || bookingData.paymentData || {},
      corporateInfo: bookingData.corporateInfo || bookingData.corporateInfo || {}
    };

    const packageImageCandidates = [];

    const pushCandidate = (value) => {
      if (!value) return;
      if (typeof value === 'string') {
        packageImageCandidates.push(value);
      } else if (typeof value === 'object' && value.url) {
        packageImageCandidates.push(value.url);
      }
    };

    if (Array.isArray(bookingData.packageImages)) {
      bookingData.packageImages.forEach(pushCandidate);
    }

    if (Array.isArray(normalizedData.shipment?.packageImages)) {
      normalizedData.shipment.packageImages.forEach(pushCandidate);
    }

    if (Array.isArray(normalizedData.shipment?.uploadedFiles)) {
      normalizedData.shipment.uploadedFiles.forEach((file) => {
        if (file?.url && (!file.mimetype || file.mimetype.startsWith('image/'))) {
          packageImageCandidates.push(file.url);
        }
      });
    }

    const packageImageUrls = packageImageCandidates
      .filter((url) => typeof url === 'string' && url.trim() !== '')
      .map((url) => url.trim());

    normalizedData.packageImages = packageImageUrls;

    // Ensure email service is initialized
    if (!this.isInitialized) {
      await this.initializeEmailService();
    }

    if (!this.transporter) {
      throw new Error('Email service not properly initialized');
    }

    // Refresh OAuth token if needed
    if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
            clientId: this.oauth2Client._clientId,
            clientSecret: this.oauth2Client._clientSecret,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: credentials.access_token
          }
        });
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
      }
    }

    // Prepare attachments: package images and logo
    let packageImageAttachments = [];
    if (packageImageUrls.length > 0) {
      try {
        const validatedImages = await this.validateImageUrls(packageImageUrls);
        if (validatedImages.length > 0) {
          packageImageAttachments = await S3Service.downloadImagesForEmail(validatedImages);
          console.log(`📧 Attached ${packageImageAttachments.length} package images (corporate)`);
        }
      } catch (error) {
        console.error('❌ Failed to download corporate package images:', error);
      }
    }

    const attachments = [];
    const logoPath = join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'ocl-logo.png');
    if (existsSync(logoPath)) {
      attachments.push({ filename: 'ocl-logo.png', path: logoPath, cid: 'ocl-brand-logo' });
    }
    packageImageAttachments.forEach(att =>
      attachments.push({
        filename: att.filename,
        content: att.buffer,
        cid: att.cid,
        contentType: att.contentType
      })
    );

    const originCity =
      normalizedData.origin?.city ||
      normalizedData.origin?.state ||
      'Origin';

    const destinationCity =
      normalizedData.destination?.city ||
      normalizedData.destination?.state ||
      'Destination';

    const consignmentDisplay =
      normalizedData.consignmentNumber ||
      normalizedData.bookingReference ||
      'Booking';

    const bookingSubject = `${consignmentDisplay} ${originCity} → ${destinationCity}`;

    const mailOptions = {
      from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
      to: senderEmail,
      subject: bookingSubject,
      html: await this.generateCorporateBookingConfirmationEmail(normalizedData, packageImageAttachments),
      text: this.generateCorporateBookingConfirmationTextVersion(normalizedData),
      attachments
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Corporate booking confirmation email sent to ${senderEmail}:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipient: senderEmail
    };
  }

  // Generate HTML email for online delivery confirmation
  async generateOnlineDeliveryConfirmationEmail(deliveryData, packageImageAttachments = []) {
    const {
      consignmentNumber,
      bookingDate,
      deliveredAt,
      paymentStatus,
      paymentMethod,
      shippingMode,
      serviceType,
      calculatedPrice,
      basePrice,
      gstAmount,
      pickupCharge,
      totalAmount,
      origin = {},
      destination = {},
      shipment = {},
      forceDelivery = {}
    } = deliveryData;

    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(deliveryData);

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return '—';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const formatAddress = (data) => {
      if (!data) return 'Address not provided';
      const parts = [
        data.companyName,
        data.name,
        data.flatBuilding,
        data.locality,
        data.landmark,
        data.area,
        [data.city, data.state].filter(Boolean).join(', '),
        data.pincode ? `PIN: ${data.pincode}` : null
      ].filter((part) => part && String(part).trim() !== '');
      return parts.join('<br>');
    };

    const safe = (value, fallback = '—') =>
      value && String(value).trim() !== '' ? value : fallback;

    const deliveredDateDisplay = formatDateTime(deliveredAt || new Date());
    const [deliveredOn, deliveredTime] = deliveredDateDisplay && deliveredDateDisplay.includes(',')
      ? deliveredDateDisplay.split(',').map((part) => part.trim())
      : [deliveredDateDisplay, '—'];

    const paymentState =
      paymentStatus && String(paymentStatus).toLowerCase() === 'paid' ? 'Paid' : 'Unpaid';

    const trackingLink = consignmentNumber
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track?awb=${encodeURIComponent(consignmentNumber)}`
      : process.env.FRONTEND_URL || 'http://localhost:3000';

    const packagesCount = shipment.packagesCount ?? shipment.packageCount ?? shipment.quantity ?? shipment.totalPackages;
    const totalWeight = shipment.weight ?? shipment.totalWeight ?? shipment.volumetricWeight;
    const insuranceText = safe(
      shipment.insurance ||
      shipment.insuranceStatus ||
      (shipment.isInsured ? 'Insured' : '') ||
      (shipment.insurancePolicyNumber ? `Policy #${shipment.insurancePolicyNumber}` : ''),
      'Not provided'
    );

    const supportEmail = process.env.SUPPORT_EMAIL || 'info@oclservices.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+91 8453 994 809';
    const companyWebsite = process.env.COMPANY_WEBSITE || 'https://oclservices.com';
    const companyGstin = process.env.COMPANY_GSTIN || '18AJRPG5984B1ZV';
    const companyAddressShort = process.env.COMPANY_ADDRESS_SHORT || 'Rehabari, Guwahati, Assam';
    const companyPhone = process.env.COMPANY_PHONE || supportPhone;

    const gstPercent = gstAmount && basePrice
      ? (Number(basePrice) !== 0 ? ((Number(gstAmount) / Number(basePrice)) * 100).toFixed(0) : '18')
      : '18';

    const currencyWithoutSymbol = (value) => formatCurrency(value).replace(/^₹/, '');
    const totalAmountValue = totalAmount ?? calculatedPrice ?? null;
    const basePriceValue = basePrice ?? (calculatedPrice ? calculatedPrice / 1.18 : null);
    const gstAmountValue = gstAmount ?? (calculatedPrice && basePriceValue ? calculatedPrice - basePriceValue : null);
    const pickupChargeValue = pickupCharge ?? 0;

    const logoUrl = 'cid:ocl-brand-logo';
    const consignmentNumberValue =
      consignmentNumber && String(consignmentNumber).trim() !== '' ? consignmentNumber : '';

    const hasPackageImages = Array.isArray(packageImageAttachments) && packageImageAttachments.length > 0;
    const packageImagesHtml = hasPackageImages
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" class="package-gallery-table" style="margin:0 auto; width:100%;">
          <tr>
            ${packageImageAttachments
        .slice(0, 4)
        .map(
          (attachment, index) => `
                  <td style="padding:6px; text-align:center;">
                    <img class="package-img" src="cid:${attachment.cid}" alt="Package Image ${index + 1}" width="140" height="140" style="width:140px; height:140px; object-fit:cover; border-radius:0; border:1px solid #E2E8F0; box-shadow:0 2px 6px rgba(15,23,42,0.12); display:block; margin:0 auto;">
                  </td>`
        )
        .join('')}
          </tr>
        </table>`
      : '<div style="text-align:center; color:#94A3B8; font-size:13px; font-style:italic;">No package images available</div>';

    const deliveryPersonInfo = forceDelivery?.personName 
      ? `<div style="font-size:12px; color:#4A5568; margin-top:8px;">
           <strong>Delivered by:</strong> ${safe(forceDelivery.personName)}<br>
           ${forceDelivery.vehicleType ? `<strong>Vehicle:</strong> ${safe(forceDelivery.vehicleType)} - ${safe(forceDelivery.vehicleNumber)}` : ''}
         </div>`
      : '';

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Shipment Delivered</title>

  <style>
    html,body { margin:0; padding:0; background:#F2F5FF; }
    table { border-collapse:collapse; }
    img { border:0; display:block; outline:none; }
    a { color:inherit; text-decoration:none; }
    .container { width:100%; max-width:640px; }
    .two-col { vertical-align:top; }
    .mobile-center { text-align:center; }
    .package-gallery-table { width:100%; }

    @media only screen and (max-width:600px) {
      body { padding:8px !important; }
      .container { width:100% !important; max-width:100% !important; padding:0 !important; }
      .two-col,
      .mobile-stack { display:block !important; width:100% !important; }
      .mobile-center,
      .center-mobile { text-align:center !important; }
      .mobile-space { margin-top:12px !important; }
      .invoice-table td { display:flex !important; justify-content:space-between; width:100% !important; padding:4px 0 !important; }
      .cta { display:block !important; width:100% !important; text-align:center !important; }
      .delivery-title { font-size:20px !important; letter-spacing:1px !important; }
      .delivery-meta { font-size:12px !important; line-height:20px !important; }
      .header-logo img { max-width:150px !important; margin:12px auto 0 !important; }
      .package-gallery-table td { display:inline-block !important; width:48% !important; padding:4px !important; }
      .package-gallery-table td:only-child { width:100% !important; text-align:center !important; }
      .package-gallery-table td:nth-child(n+3) { margin-top:8px !important; }
      .package-img { width:100% !important; height:auto !important; max-width:160px !important; }
      .delivery-summary { background:transparent !important; border:none !important; }
      .price-summary { background:transparent !important; border:none !important; }
      .delivered-section { padding-left:35% !important; }
      .tracking-section { padding-left:20% !important; }
      .barcode-cell { padding-left:5% !important; }
      .email-header { background:linear-gradient(135deg,#1a4a7a,#2d6ba8) !important; border-bottom:1px solid #3d7bb8 !important; }
    }

    .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; }
  </style>

</head>

<body class="font-sans" style="background:#F2F5FF; margin:0; padding:16px;">
<table width="100%">
<tr><td align="center">

<!-- MAIN CONTAINER -->
<table width="640" class="container"
style="background:#ffffff; border-radius:0; overflow:hidden; box-shadow:0 10px 24px rgba(9,16,31,0.1); border-radius:10px; width:100%; max-width:640px;">

  <!-- HEADER -->
  <tr>
    <td class="email-header" style="padding:22px 28px; border-bottom:1px solid #0D3170; background:linear-gradient(135deg,#062858,#0F4C92);">
      <table width="100%">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; font-size:12px; color:#D9E3FF; font-weight:600; padding-bottom:8px;">
            <a href="${companyWebsite}" style="color:#FFEE9D; text-decoration:none;"><br>https://oclservices.com</a>
          </td>
          <td class="two-col center-mobile mobile-stack" style="width:34%; text-align:center; padding-bottom:8px;">
            <div class="delivery-title" style="font-size:18px; font-weight:800; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.5px;">Shipment Delivered</div>
          </td>
          <td class="two-col mobile-stack mobile-center header-logo" style="width:33%; text-align:right;">
            <!--[if gte mso 9]><table><tr><td style="padding-top:0;padding-bottom:0;"><![endif]-->
            <img src="${logoUrl}" width="190" style="display:block; margin-left:auto; filter:drop-shadow(0 6px 14px rgba(0,0,0,0.35));">
            <!--[if gte mso 9]></td></tr></table><![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DELIVERED TEXT -->
  <tr>
    <td class="delivered-section" style="padding:20px 28px; background:linear-gradient(135deg,#F7F3FF,#EEF4FF);">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:left; padding:0px 0;">
            <div style="font-size:14px; font-weight:600; color:#0B1F4A;">${deliveredOn}</div>
            <div style="font-size:13px; color:#4B5563; margin-top:4px;">${deliveredTime}</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:34%; text-align:center; padding:6px 0;">
            <div class="delivery-title" style="font-size:24px; font-weight:800; color:#0B1F4A; text-transform:uppercase; letter-spacing:2px;">Delivered</div>
          </td>
          <td class="two-col mobile-stack mobile-center" style="width:33%; text-align:right; padding:6px 0;">
            <div style="font-size:20px; font-weight:700; color:${paymentState === 'Paid' ? '#0F8A45' : '#B02800'}; text-transform:uppercase;">
              ${paymentState === 'Paid' ? 'Paid' : 'Not paid'}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ACTION / BARCODE / TRACKING -->
  <tr>
    <td class="tracking-section" style="padding:18px 24px; background:#0B1433;">
      <table width="100%" style="border-collapse:collapse;">
        <tr>
          <td class="two-col mobile-stack mobile-space" style="width:33%; padding:0; vertical-align:middle;">
            <a href="${trackingLink}" class="cta"
              style="display:inline-block; padding:10px 18px; background:linear-gradient(120deg,#FF512F,#DD2476); border-radius:0; color:white; font-weight:600; letter-spacing:0.3px;">
              View Details
            </a>
          </td>
          <td class="two-col mobile-stack mobile-center mobile-space barcode-cell" style="width:34%; padding:0; text-align:center; vertical-align:middle;">
            <div style="font-size:10px; color:#8FA0C2; text-transform:uppercase; letter-spacing:1px;">Scan to Track</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(consignmentNumber)}" style="max-width:180px; margin:6px auto 0; display:block;">
            <div style="font-size:10px; color:#c7cede; margin-top:4px;">AWB: ${safe(consignmentNumber)}</div>
          </td>
          <td class="two-col mobile-stack mobile-center estimated-date-cell" style="width:33%; padding:0; text-align:right; vertical-align:middle;">
            <div style="font-size:10px; color:#d9b59e; text-transform:uppercase; letter-spacing:1px;">Delivered On</div>
            <div style="font-size:15px; font-weight:600; color:#FFEBDD; margin-top:4px;">${deliveredOn}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DELIVERY DETAILS -->
  <tr><td style="padding-top:0;">
    <div style="
      padding:18px;
      border-radius:0;
      background:linear-gradient(135deg,#FDF3F3,#FFF7E5);
      border:1px solid #FFD9C1;
      box-shadow:0 8px 20px rgba(255,146,76,0.15);
    ">
      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        Hello <strong>${safe(origin.name || origin.companyName || 'Customer')}</strong>,
      </p>

      <p style="font-size:13px; color:#333; margin:0 0 6px;">
        Great news! Your shipment has been <strong style="color:#0F8A45;">successfully delivered</strong> to <strong>${safe(destination.name || destination.companyName)}</strong>, ${safe(destination.city)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Pin - ${safe(destination.pincode)}, Mob - ${safe(destination.mobileNumber)}.
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Invoice No: <strong>${safe(invoiceNumberForEmail)}</strong>
      </p>

      <p style="font-size:13px; margin:0 0 6px;">
        Delivered on <strong>${deliveredOn}</strong> at <strong>${deliveredTime}</strong>
      </p>

      <p style="font-size:13px; margin:0;">
        Delivery Address:
        <strong>${safe(destination.companyName || destination.name)}, ${destination.city}, ${destination.state}</strong>
      </p>
      ${deliveryPersonInfo}
    </div>
  </td></tr>

  

        <!-- PACKAGE GALLERY -->
        <tr><td style="padding-top:0;">
          <div style="padding:16px; background:#FFF3F5; border:1px solid #FFD0D7; border-radius:0; text-decoration:underline;">
            <div style="font-size:13px; font-weight:700; color:#333; margin-bottom:8px;">Package Gallery :</div>
            ${packageImagesHtml}
          </div>
        </td></tr>

        <!-- THANK YOU MESSAGE -->
        <tr><td style="padding-top:0;">
          <div style="padding:14px; border-radius:0; background:#ffffff; border:1px solid #DEE5FF;">
            <div style="font-size:12px; font-weight:700; margin-bottom:6px;text-decoration:underline;">Thank You :</div>
            <p style="font-size:12px; color:#4A5568; margin:0;">
              Thank you for choosing OCL Services. We hope you had a great experience with us. 
              If you have any feedback or need assistance, please don't hesitate to contact us.
            </p>
          </div>
        </td></tr>

        <!-- SUPPORT -->
        <tr><td style="padding-top:0;">
          <div style="padding:12px 5px; background:#F5F9FF; border:1px solid #DCE6FF; border-radius:0;">
            <table width="100%">
              <tr>
                <td class="mobile-stack mobile-center" align="center" style="font-size:12px; font-weight:700;">
                  Need Assistance? Write to us :
                  <a href="mailto:${supportEmail}" style="color:#0A3A7D">${supportEmail}</a>
                   or Call Us @
                  <a href="tel:${supportPhone}" style="color:#0A3A7D">${supportPhone}</a>
                </td>
                
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- FOOTER -->

        <tr>
      <td style="background:#0A3A7D; color:white; padding:12px 16px; text-align:center; font-size:12px;">
        <div style="margin-top:4px; font-size:11px;">
            This is an automated email from <strong>OCL.</strong>.
            GSTIN: ${companyGstin} - <a href="${companyWebsite}" style="color:white;">${companyWebsite}</a>
          </div>
      </td>
    </tr>


      </table>
    </td>
  </tr>

  </table>


<!-- SPACER -->
<table width="100%" style="margin-top:4px; border-collapse:collapse;"><tr><td align="center">
  <table width="640" align="center" style="border-collapse:collapse;">
    <tr>
      <td style="text-align:center; font-size:12px; color:#6B7280;">
        If you have any questions about this delivery, please contact our support team.
      </td>
    </tr>
  </table>
</td></tr></table>

</td></tr></table>
</body>
</html>
    `;
  }

  // Generate text email for online delivery confirmation
  generateOnlineDeliveryConfirmationTextVersion(deliveryData) {
    const {
      consignmentNumber,
      bookingDate,
      deliveredAt,
      paymentStatus,
      paymentMethod,
      shippingMode,
      serviceType,
      calculatedPrice,
      basePrice,
      gstAmount,
      pickupCharge,
      totalAmount,
      origin = {},
      destination = {},
      shipment = {},
      forceDelivery = {}
    } = deliveryData;

    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return 'NA';
      }
      return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const formatDateTime = (value) => {
      if (!value) return 'NA';
      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    const invoiceNumberForEmail = this.getInvoiceNumberFromBooking(deliveryData);

    return `
Shipment Delivered - ${consignmentNumber}

DELIVERY SUMMARY
- Consignment Number: ${consignmentNumber || 'NA'}
- Invoice Number: ${invoiceNumberForEmail || 'NA'}
- Service: ${serviceType || 'NA'} (${shippingMode || 'Standard'})
- Payment: ${(paymentStatus === 'paid' ? 'Paid' : 'Pending')} ${paymentMethod ? `(${paymentMethod})` : ''}
- Total Amount: ${formatCurrency(totalAmount ?? (calculatedPrice ? calculatedPrice + (pickupCharge || 100) : null))}
- Delivered On: ${formatDateTime(deliveredAt || new Date())}
${forceDelivery?.personName ? `- Delivered by: ${forceDelivery.personName}` : ''}
${forceDelivery?.vehicleType ? `- Vehicle: ${forceDelivery.vehicleType} - ${forceDelivery.vehicleNumber}` : ''}

PICKUP DETAILS
- Contact: ${origin.name || 'NA'} (${origin.mobileNumber || 'NA'})
- Address: ${origin.flatBuilding || ''} ${origin.locality || ''}, ${origin.city || ''}, ${origin.state || ''} ${origin.pincode || ''}

DELIVERY DETAILS
- Contact: ${destination.name || 'NA'} (${destination.mobileNumber || 'NA'})
- Address: ${destination.flatBuilding || ''} ${destination.locality || ''}, ${destination.city || ''}, ${destination.state || ''} ${destination.pincode || ''}

SHIPMENT INFORMATION
- Consignment Type: ${shipment.natureOfConsignment || 'NA'}
- Packages: ${shipment.packagesCount || 'NA'}
- Weight: ${shipment.weight || 'NA'} kg

THANK YOU
Thank you for choosing OCL Services. We hope you had a great experience with us.

SUPPORT
Email: info@oclservices.com
Phone: +91 8453 994 809
Website: https://oclservices.com

Thank you for choosing OCL Services.
    `;
  }

  // Send online delivery confirmation email
  async sendOnlineDeliveryConfirmationEmail(deliveryData) {
    const senderEmail = deliveryData?.origin?.email;
    if (!senderEmail || String(senderEmail).trim() === '') {
      throw new Error('Sender email is required to send delivery confirmation');
    }

    const consignmentDisplay =
      deliveryData?.consignmentNumber ||
      deliveryData?.bookingReference ||
      'Shipment';

    const originCity =
      deliveryData?.origin?.city ||
      deliveryData?.origin?.state ||
      'Origin';

    const destinationCity =
      deliveryData?.destination?.city ||
      deliveryData?.destination?.state ||
      'Destination';

    const deliverySubject = `${consignmentDisplay} ${originCity} → ${destinationCity}`;

    // Ensure email service is initialized
    if (!this.isInitialized) {
      await this.initializeEmailService();
    }

    if (!this.transporter) {
      throw new Error('Email service not properly initialized');
    }

    // Refresh OAuth token if needed
    if (this.oauth2Client && process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);

        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.GOOGLE_EMAIL || 'your-email@gmail.com',
            clientId: this.oauth2Client._clientId,
            clientSecret: this.oauth2Client._clientSecret,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: credentials.access_token
          }
        });
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh OAuth2 token, using existing credentials:', refreshError.message);
      }
    }

    // Prepare attachments: package images and logo
    const packageImages = (deliveryData.packageImages || deliveryData.shipment?.packageImages || []).filter(img => img && String(img).trim() !== '');
    let packageImageAttachments = [];

    if (packageImages.length > 0) {
      try {
        const validatedImages = await this.validateImageUrls(packageImages);
        if (validatedImages.length > 0) {
          packageImageAttachments = await S3Service.downloadImagesForEmail(validatedImages);
          console.log(`📧 Attached ${packageImageAttachments.length} package images for delivery email`);
        }
      } catch (error) {
        console.error('❌ Failed to download package images:', error);
      }
    }

    const attachments = [];
    const logoPath = join(__dirname, '..', '..', 'Frontend', 'src', 'assets', 'ocl-logo.png');
    if (existsSync(logoPath)) {
      attachments.push({ filename: 'ocl-logo.png', path: logoPath, cid: 'ocl-brand-logo' });
    }
    packageImageAttachments.forEach(att => attachments.push({
      filename: att.filename, content: att.buffer, cid: att.cid, contentType: att.contentType
    }));

    const mailOptions = {
      from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
      to: senderEmail,
      subject: deliverySubject,
      html: await this.generateOnlineDeliveryConfirmationEmail(deliveryData, packageImageAttachments),
      text: this.generateOnlineDeliveryConfirmationTextVersion(deliveryData),
      attachments: attachments
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Online delivery confirmation email sent to ${senderEmail}:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipient: senderEmail
    };
  }

  // Send corporate delivery confirmation email (similar structure to corporate booking)
  async sendCorporateDeliveryConfirmationEmail(deliveryData) {
    const senderEmail =
      deliveryData?.origin?.email ||
      deliveryData?.originData?.email ||
      deliveryData?.corporateInfo?.email;

    if (!senderEmail || String(senderEmail).trim() === '') {
      throw new Error('Sender email is required to send corporate delivery confirmation');
    }

    // Use the same structure as online delivery but with corporate branding
    return await this.sendOnlineDeliveryConfirmationEmail(deliveryData);
  }

  // Send shipment delivery confirmation email (for form-based bookings)
  async sendShipmentDeliveryConfirmationEmail(deliveryData) {
    const senderEmail = deliveryData?.senderEmail || deliveryData?.originData?.email;
    if (!senderEmail) {
      throw new Error('Sender email is required to send shipment delivery confirmation');
    }

    // Use the same structure as online delivery
    return await this.sendOnlineDeliveryConfirmationEmail({
      ...deliveryData,
      origin: deliveryData.originData || deliveryData.origin || {},
      destination: deliveryData.destinationData || deliveryData.destination || {},
      shipment: deliveryData.shipmentData || deliveryData.shipment || {}
    });
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  // Helper method to get social media icon attachments (DISABLED)
  getSocialMediaIconAttachments() {
    // Social media attachments have been disabled
    return [];
  }

  async sendEmailWithPdfAttachment({ to, subject, html, text, pdfBuffer, filename = 'manifest.pdf' }) {
    try {
      const mailOptions = {
        from: `"OCL Services" <${process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'noreply@oclcourier.com'}>`,
        to,
        subject,
        html,
        text,
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email with PDF:', error);
      throw error;
    }
  }
}

export default new EmailService();
