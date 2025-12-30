import express from 'express';
import OCLNews from '../models/OCLNews.js';
import { authenticateAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/news-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `news-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// GET /api/ocl-news - Get all news (public - only published, admin - all)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, published } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Check if user is admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    const isAdmin = token ? true : false; // Simplified - you might want to verify token

    let query = {};
    
    // If not admin, only show published news
    if (!isAdmin || published === 'true') {
      query.published = true;
    } else if (published === 'false') {
      query.published = false;
    }

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const news = await OCLNews.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-__v')
      .populate('authorId', 'name email')
      .lean();

    const total = await OCLNews.countDocuments(query);

    res.json({
      success: true,
      data: news,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// GET /api/ocl-news/featured - Get featured news
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const news = await OCLNews.getFeatured(parseInt(limit));
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching featured news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured news'
    });
  }
});

// GET /api/ocl-news/:id - Get single news post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await OCLNews.findById(id)
      .populate('authorId', 'name email')
      .select('-__v');

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News post not found'
      });
    }

    // Increment views
    await news.incrementViews();

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// GET /api/ocl-news/slug/:slug - Get news by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await OCLNews.findOne({ slug, published: true })
      .populate('authorId', 'name email')
      .select('-__v');

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News post not found'
      });
    }

    // Increment views
    await news.incrementViews();

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

// POST /api/ocl-news - Create new news post (Admin only)
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, author, published, featured, tags } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title, excerpt, and content are required'
      });
    }

    const newsData = {
      title,
      excerpt,
      content,
      category: category || 'General',
      author: author || 'OCL Team',
      authorId: req.admin._id,
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    };

    if (req.file) {
      newsData.image = `/uploads/news-images/${req.file.filename}`;
      newsData.imageKey = req.file.filename;
    }

    const news = new OCLNews(newsData);
    await news.save();

    res.status(201).json({
      success: true,
      message: 'News post created successfully',
      data: news
    });
  } catch (error) {
    console.error('Error creating news:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A news post with this title already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create news post'
    });
  }
});

// PUT /api/ocl-news/:id - Update news post (Admin only)
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, category, author, published, featured, tags } = req.body;

    const news = await OCLNews.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News post not found'
      });
    }

    if (title) news.title = title;
    if (excerpt) news.excerpt = excerpt;
    if (content) news.content = content;
    if (category) news.category = category;
    if (author) news.author = author;
    if (tags) {
      news.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    if (published !== undefined) {
      news.published = published === 'true' || published === true;
      if (news.published && !news.publishedAt) {
        news.publishedAt = new Date();
      }
    }

    if (featured !== undefined) {
      news.featured = featured === 'true' || featured === true;
    }

    if (req.file) {
      // Delete old image if exists
      if (news.imageKey) {
        const oldImagePath = path.join(__dirname, '../uploads/news-images', news.imageKey);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      news.image = `/uploads/news-images/${req.file.filename}`;
      news.imageKey = req.file.filename;
    }

    await news.save();

    res.json({
      success: true,
      message: 'News post updated successfully',
      data: news
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update news post'
    });
  }
});

// DELETE /api/ocl-news/:id - Delete news post (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const news = await OCLNews.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News post not found'
      });
    }

    // Delete associated image if exists
    if (news.imageKey) {
      const imagePath = path.join(__dirname, '../uploads/news-images', news.imageKey);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await OCLNews.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'News post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete news post'
    });
  }
});

// GET /api/ocl-news/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await OCLNews.distinct('category', { published: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

export default router;

