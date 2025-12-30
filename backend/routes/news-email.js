import express from 'express';
import NewsEmail from '../models/NewsEmail.js';

const router = express.Router();

// POST /api/news-email/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Check if email already exists
    const existingEmail = await NewsEmail.findByEmail(email);
    if (existingEmail) {
      if (existingEmail.isActive) {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to our newsletter',
          alreadySubscribed: true
        });
      } else {
        // Reactivate if previously unsubscribed
        existingEmail.isActive = true;
        existingEmail.subscribedAt = new Date();
        await existingEmail.save();
        return res.status(200).json({
          success: true,
          message: 'Welcome back! You have been resubscribed to our newsletter'
        });
      }
    }

    // Create new subscription
    const newsEmail = new NewsEmail({
      email: email.toLowerCase().trim()
    });

    await newsEmail.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
      data: {
        email: newsEmail.email,
        subscribedAt: newsEmail.subscribedAt
      }
    });
  } catch (error) {
    console.error('Error subscribing email:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter',
        alreadySubscribed: true
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to subscribe. Please try again later.'
    });
  }
});

// GET /api/news-email/list (Admin only - can be added later if needed)
// This endpoint can be added in the admin routes if you want to view all subscribers

export default router;

