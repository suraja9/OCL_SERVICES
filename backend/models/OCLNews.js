import mongoose from "mongoose";

const oclNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be longer than 200 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot be longer than 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    default: 'General'
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  imageKey: {
    type: String,
    trim: true,
    default: ''
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    default: 'OCL Team'
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  collection: 'OCLNEWS'
});

// Generate slug from title before saving
oclNewsSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure uniqueness
    const slugRegex = new RegExp(`^${this.slug}(-\\d+)?$`);
    const existingNews = await mongoose.model('OCLNews').findOne({ slug: slugRegex });
    if (existingNews && existingNews._id.toString() !== this._id.toString()) {
      const count = await mongoose.model('OCLNews').countDocuments({ slug: slugRegex });
      this.slug = `${this.slug}-${count + 1}`;
    }
  }
  
  // Set publishedAt when published is set to true
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes for better query performance
oclNewsSchema.index({ published: 1, publishedAt: -1 });
oclNewsSchema.index({ category: 1 });
oclNewsSchema.index({ featured: 1 });
oclNewsSchema.index({ slug: 1 });
oclNewsSchema.index({ createdAt: -1 });

// Static method to get published news
oclNewsSchema.statics.getPublished = function(limit = 10, skip = 0) {
  return this.find({ published: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v');
};

// Static method to get featured news
oclNewsSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ published: true, featured: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

// Instance method to increment views
oclNewsSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

export default mongoose.model("OCLNews", oclNewsSchema);

