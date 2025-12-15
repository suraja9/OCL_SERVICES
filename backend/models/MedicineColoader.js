import mongoose from "mongoose";

// Vehicle details schema (optional)
const vehicleDetailSchema = new mongoose.Schema({
  vehicleName: {
    type: String,
    trim: true,
    maxlength: [100, 'Vehicle name cannot be longer than 100 characters']
  },
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Vehicle number cannot be longer than 20 characters']
  },
  driverName: {
    type: String,
    trim: true,
    maxlength: [100, 'Driver name cannot be longer than 100 characters']
  },
  driverNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Driver number cannot be longer than 20 characters']
  }
}, { _id: false });

// Location schema for FROM and TO locations
const locationSchema = new mongoose.Schema({
  concernPerson: {
    type: String,
    required: [true, 'Concern person is required'],
    trim: true,
    maxlength: [100, 'Concern person name cannot be longer than 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot be longer than 50 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot be longer than 50 characters']
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
    maxlength: [100, 'Area name cannot be longer than 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot be longer than 200 characters']
  },
  flatNo: {
    type: String,
    required: [true, 'Flat No/Building Name is required'],
    trim: true,
    maxlength: [100, 'Flat No/Building Name cannot be longer than 100 characters']
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark cannot be longer than 100 characters']
  },
  gst: {
    type: String,
    required: [true, 'GST Number is required'],
    trim: true,
    uppercase: true,
    maxlength: [15, 'GST Number cannot be longer than 15 characters']
  },
  vehicleDetails: {
    type: [vehicleDetailSchema],
    default: []
  }
}, { _id: false });

// Company address schema
const companyAddressSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: [true, 'Company pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  state: {
    type: String,
    required: [true, 'Company state is required'],
    trim: true,
    maxlength: [50, 'State name cannot be longer than 50 characters']
  },
  city: {
    type: String,
    required: [true, 'Company city is required'],
    trim: true,
    maxlength: [50, 'City name cannot be longer than 50 characters']
  },
  area: {
    type: String,
    required: [true, 'Company area is required'],
    trim: true,
    maxlength: [100, 'Area name cannot be longer than 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Company address is required'],
    trim: true,
    maxlength: [200, 'Address cannot be longer than 200 characters']
  },
  flatNo: {
    type: String,
    required: [true, 'Flat No/Building Name is required'],
    trim: true,
    maxlength: [100, 'Flat No/Building Name cannot be longer than 100 characters']
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark cannot be longer than 100 characters']
  },
  gst: {
    type: String,
    required: [true, 'GST Number is required'],
    trim: true,
    uppercase: true,
    maxlength: [15, 'GST Number cannot be longer than 15 characters']
  }
}, { _id: false });

// Main medicine coloader schema
const medicineColoaderSchema = new mongoose.Schema({
  // Medicine User who created the coloader
  medicineUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineUser',
    required: false
  },
  
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot be longer than 200 characters'],
    index: true
  },
  serviceModes: {
    type: [String],
    required: [true, 'At least one service mode is required'],
    enum: {
      values: ['air', 'road', 'train', 'ship'],
      message: 'Service mode must be one of: air, road, train, ship'
    },
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one service mode must be selected'
    }
  },
  concernPerson: {
    type: String,
    required: [true, 'Concern person is required'],
    trim: true,
    maxlength: [100, 'Concern person name cannot be longer than 100 characters']
  },
  mobileNumbers: {
    type: [String],
    required: [true, 'At least one mobile number is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0 && v.every(num => /^\d{10}$/.test(num));
      },
      message: 'At least one valid 10-digit mobile number is required'
    }
  },
  mobileNumberNames: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        if (!this.mobileNumbers) return true;
        return !v || v.length <= this.mobileNumbers.length;
      },
      message: 'Number of names cannot exceed number of mobile numbers'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot be longer than 200 characters']
  },
  companyAddress: {
    type: companyAddressSchema,
    required: [true, 'Company address is required']
  },
  vehicleDetails: {
    type: [vehicleDetailSchema],
    default: []
  },
  fromLocations: {
    type: [locationSchema],
    required: [true, 'At least one FROM location is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one FROM location is required'
    }
  },
  toLocations: {
    type: [locationSchema],
    required: [true, 'At least one TO location is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one TO location is required'
    }
  },
  // Status and metadata
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'approved'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  coloaderId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  // Legacy fields for backward compatibility
  name: {
    type: String,
    required: false,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    index: true
  },
  busNumber: {
    type: String,
    required: false,
    trim: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'medicine_coloaders'
});

// Create indexes for better performance
medicineColoaderSchema.index({ status: 1 });
medicineColoaderSchema.index({ isActive: 1 });
medicineColoaderSchema.index({ registrationDate: -1 });
medicineColoaderSchema.index({ 'companyAddress.state': 1 });
medicineColoaderSchema.index({ 'companyAddress.city': 1 });
medicineColoaderSchema.index({ serviceModes: 1 });
medicineColoaderSchema.index({ phoneNumber: 1, busNumber: 1 });

// Static method to generate unique coloader ID
medicineColoaderSchema.statics.generateColoaderId = async function(companyName) {
  const prefix = 'MCL';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Get company initials (first 3 characters of each word)
  const initials = companyName
    .split(' ')
    .map(word => word.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 6);
  
  let counter = 1;
  let coloaderId;
  
  do {
    const sequence = counter.toString().padStart(4, '0');
    coloaderId = `${prefix}${year}${month}${initials}${sequence}`;
    counter++;
  } while (await this.findOne({ coloaderId }));
  
  return coloaderId;
};

// Static method to find coloaders by status
medicineColoaderSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true }).sort({ registrationDate: -1 });
};

// Static method to find coloaders by service mode
medicineColoaderSchema.statics.findByServiceMode = function(serviceMode) {
  return this.find({ 
    serviceModes: serviceMode, 
    isActive: true 
  }).sort({ registrationDate: -1 });
};

// Static method to find coloaders by location
medicineColoaderSchema.statics.findByLocation = function(state, city) {
  const query = { isActive: true };
  
  if (state) {
    query['companyAddress.state'] = new RegExp(state, 'i');
  }
  
  if (city) {
    query['companyAddress.city'] = new RegExp(city, 'i');
  }
  
  return this.find(query).sort({ registrationDate: -1 });
};

// Static method to search coloaders
medicineColoaderSchema.statics.searchColoaders = function(searchQuery) {
  const regex = new RegExp(searchQuery, 'i');
  
  return this.find({
    $or: [
      { companyName: regex },
      { concernPerson: regex },
      { email: regex },
      { 'companyAddress.state': regex },
      { 'companyAddress.city': regex },
      { 'companyAddress.area': regex },
      { 'fromLocations.concernPerson': regex },
      { 'toLocations.concernPerson': regex }
    ],
    isActive: true
  }).sort({ registrationDate: -1 });
};

// Instance method to get completion percentage
medicineColoaderSchema.methods.getCompletionPercentage = function() {
  let completedFields = 0;
  let totalFields = 0;
  
  // Company information fields
  const companyFields = ['companyName', 'serviceModes', 'concernPerson', 'mobileNumbers', 'email', 'companyAddress'];
  companyFields.forEach(field => {
    totalFields++;
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : this[field].toString().trim() !== '')) {
      completedFields++;
    }
  });
  
  // FROM locations
  if (this.fromLocations && this.fromLocations.length > 0) {
    totalFields++;
    const validFromLocations = this.fromLocations.filter(loc => 
      loc.concernPerson && loc.mobile && loc.email && loc.pincode && 
      loc.state && loc.city && loc.area && loc.address && loc.flatNo && loc.gst
    );
    if (validFromLocations.length > 0) {
      completedFields++;
    }
  } else {
    totalFields++;
  }
  
  // TO locations
  if (this.toLocations && this.toLocations.length > 0) {
    totalFields++;
    const validToLocations = this.toLocations.filter(loc => 
      loc.concernPerson && loc.mobile && loc.email && loc.pincode && 
      loc.state && loc.city && loc.area && loc.address && loc.flatNo && loc.gst
    );
    if (validToLocations.length > 0) {
      completedFields++;
    }
  } else {
    totalFields++;
  }
  
  return Math.round((completedFields / totalFields) * 100);
};

// Instance method to check if registration is complete
medicineColoaderSchema.methods.isRegistrationComplete = function() {
  return this.getCompletionPercentage() === 100;
};

// Instance method to get service modes as readable text
medicineColoaderSchema.methods.getServiceModesText = function() {
  const modeMap = {
    'air': 'By Air',
    'road': 'By Road',
    'train': 'By Train',
    'ship': 'By Ship'
  };
  
  return this.serviceModes.map(mode => modeMap[mode] || mode).join(', ');
};

// Pre-save middleware to generate coloader ID if not present
medicineColoaderSchema.pre('save', async function(next) {
  if (this.isNew && !this.coloaderId) {
    this.coloaderId = await this.constructor.generateColoaderId(this.companyName);
  }
  next();
});

// Static method to find active coloaders (for backward compatibility)
medicineColoaderSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Static method to find by phone number (for backward compatibility)
medicineColoaderSchema.statics.findByPhone = function(phoneNumber) {
  return this.find({ phoneNumber, isActive: true });
};

// Static method to find by bus number (for backward compatibility)
medicineColoaderSchema.statics.findByBusNumber = function(busNumber) {
  return this.find({ busNumber, isActive: true });
};

export default mongoose.model("MedicineColoader", medicineColoaderSchema);

