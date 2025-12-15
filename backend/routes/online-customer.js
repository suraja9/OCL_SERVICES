import express from 'express';
import OnlineCustomer from '../models/OnlineCustomer.js';
import axios from 'axios';

const router = express.Router();

// Helper function to clean phone number
const cleanPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '');
};

// POST /api/online-customer/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Expected 10 digits'
      });
    }

    // Forward to OTP service (use localhost for internal calls)
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const otpResponse = await axios.post(`${backendUrl}/api/otp/send`, {
      phoneNumber: cleanPhone
    });

    if (otpResponse.data.success) {
      return res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: otpResponse.data.error || 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during OTP sending'
    });
  }
});

// POST /api/online-customer/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Expected 10 digits'
      });
    }

    // Verify OTP (use localhost for internal calls)
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verifyResponse = await axios.post(`${backendUrl}/api/otp/verify`, {
      phoneNumber: cleanPhone,
      otp: otp
    });

    if (!verifyResponse.data.success) {
      return res.status(400).json({
        success: false,
        error: verifyResponse.data.error || 'Invalid or expired OTP'
      });
    }

    // Check if customer exists
    let customer = await OnlineCustomer.findByPhone(cleanPhone);

    if (customer) {
      // Existing customer - return user data
      return res.json({
        success: true,
        message: 'OTP verified successfully',
        isNewUser: false,
        customer: {
          _id: customer._id,
          phoneNumber: customer.phoneNumber,
          name: customer.name,
          email: customer.email
        }
      });
    } else {
      // New customer - return flag to collect name/email
      return res.json({
        success: true,
        message: 'OTP verified successfully',
        isNewUser: true,
        phoneNumber: cleanPhone
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during OTP verification'
    });
  }
});

// POST /api/online-customer/register
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, name, email } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Expected 10 digits'
      });
    }

    // Check if customer already exists
    let customer = await OnlineCustomer.findByPhone(cleanPhone);

    if (customer) {
      // Update existing customer if name/email provided
      if (name !== undefined) customer.name = name || '';
      if (email !== undefined) customer.email = email || '';
      await customer.save();

      return res.json({
        success: true,
        message: 'Customer profile updated',
        customer: {
          _id: customer._id,
          phoneNumber: customer.phoneNumber,
          name: customer.name,
          email: customer.email
        }
      });
    } else {
      // Create new customer
      customer = new OnlineCustomer({
        phoneNumber: cleanPhone,
        name: name || '',
        email: email || ''
      });
      await customer.save();

      return res.json({
        success: true,
        message: 'Customer registered successfully',
        customer: {
          _id: customer._id,
          phoneNumber: customer.phoneNumber,
          name: customer.name,
          email: customer.email
        }
      });
    }
  } catch (error) {
    console.error('Error registering customer:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already registered'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

// GET /api/online-customer/profile
router.get('/profile', async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await OnlineCustomer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    return res.json({
      success: true,
      customer: {
        _id: customer._id,
        phoneNumber: customer.phoneNumber,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;

