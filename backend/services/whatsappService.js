import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class WhatsAppService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.integratedNumber = process.env.MSG91_WHATSAPP_NUMBER || '15558060648';
    this.namespace = process.env.MSG91_WHATSAPP_NAMESPACE || '170973a2_ea66_42f3_aff0_098b38915d40';
  }

  /**
   * Format phone number for MSG91 API
   * @param {string} phoneNumber - Phone number (10 digits or with country code)
   * @returns {string} - Formatted phone number with 91 prefix
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Remove any non-digit characters
    let cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    // If phone number already starts with 91, remove it
    if (cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12) {
      cleanPhoneNumber = cleanPhoneNumber.substring(2);
    }

    // Ensure we have exactly 10 digits
    if (cleanPhoneNumber.length !== 10) {
      throw new Error(`Invalid phone number format. Expected 10 digits, got ${cleanPhoneNumber.length} digits: ${cleanPhoneNumber}`);
    }

    // Add 91 prefix for MSG91 API
    return `91${cleanPhoneNumber}`;
  }

  /**
   * Send WhatsApp message using MSG91 template
   * @param {Object} options - Message options
   * @param {string} options.phoneNumber - Recipient phone number (10 digits)
   * @param {string} options.templateName - Template name (e.g., 'ocl_booked')
   * @param {Object} options.templateParams - Template parameters
   * @param {string} options.templateParams.consignmentNumber - Consignment number for body_1
   * @param {string} options.templateParams.trackingUrl - Tracking URL for button_1
   * @returns {Promise<Object>} - API response
   */
  async sendTemplateMessage({ phoneNumber, templateName, templateParams }) {
    try {
      if (!this.authKey) {
        throw new Error('MSG91_AUTH_KEY not found in environment variables');
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Build the request payload according to MSG91 WhatsApp API
      const payload = {
        integrated_number: this.integratedNumber,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en',
              policy: 'deterministic'
            },
            namespace: this.namespace,
            to_and_components: [
              {
                to: [formattedPhone],
                components: {
                  body_1: {
                    type: 'text',
                    value: templateParams.consignmentNumber || ''
                  },
                  button_1: {
                    subtype: 'url',
                    type: 'text',
                    value: templateParams.trackingUrl || ''
                  }
                }
              }
            ]
          }
        }
      };

      // Send request to MSG91 WhatsApp API
      const response = await axios.post(
        'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'authkey': this.authKey
          }
        }
      );

      console.log('✅ WhatsApp message sent successfully:', {
        phoneNumber: formattedPhone,
        templateName,
        response: response.data
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', {
        error: error.response?.data || error.message,
        phoneNumber,
        templateName
      });

      // Return error details without throwing (non-blocking)
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send booking confirmation WhatsApp message
   * @param {Object} options - Booking details
   * @param {string} options.phoneNumber - Sender's phone number (10 digits)
   * @param {string} options.consignmentNumber - Consignment number
   * @param {string} options.trackingUrl - Optional tracking URL (defaults to oclservices.com/tracking)
   * @returns {Promise<Object>} - API response
   */
  async sendBookingConfirmation({ phoneNumber, consignmentNumber, trackingUrl }) {
    try {
      // Build tracking URL if not provided
      const defaultTrackingUrl = trackingUrl || `https://oclservices.com/tracking?view=progress&type=awb&number=${consignmentNumber}`;

      return await this.sendTemplateMessage({
        phoneNumber,
        templateName: 'ocl_booked',
        templateParams: {
          consignmentNumber: consignmentNumber.toString(),
          trackingUrl: defaultTrackingUrl
        }
      });
    } catch (error) {
      console.error('❌ Error sending booking confirmation WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send delivered status WhatsApp message
   * @param {Object} options - Delivery details
   * @param {string} options.phoneNumber - Sender's phone number (10 digits)
   * @param {string} options.consignmentNumber - Consignment number
   * @param {string} options.trackingUrl - Optional tracking URL (defaults to oclservices.com/tracking)
   * @returns {Promise<Object>} - API response
   */
  async sendDeliveredNotification({ phoneNumber, consignmentNumber, trackingUrl }) {
    try {
      // Build tracking URL if not provided
      const defaultTrackingUrl = trackingUrl || `https://oclservices.com/tracking?view=progress&type=awb&number=${consignmentNumber}`;

      return await this.sendTemplateMessage({
        phoneNumber,
        templateName: 'delivered',
        templateParams: {
          consignmentNumber: consignmentNumber.toString(),
          trackingUrl: defaultTrackingUrl
        }
      });
    } catch (error) {
      console.error('❌ Error sending delivered notification WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;

