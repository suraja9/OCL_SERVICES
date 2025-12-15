import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicineColoader from '../models/MedicineColoader.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ocl_web')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Update existing coloaders without names
async function updateColoaderNames() {
  try {
    // Find all coloaders without a name field
    const coloadersWithoutName = await MedicineColoader.find({
      $or: [
        { name: { $exists: false } },
        { name: { $eq: null } },
        { name: { $eq: '' } }
      ]
    });
    
    console.log(`Found ${coloadersWithoutName.length} coloaders without names`);
    
    // Update each coloader to have a default name
    for (const coloader of coloadersWithoutName) {
      // Set a default name based on bus number and phone number
      const defaultName = `Coloader ${coloader.busNumber}`;
      coloader.name = defaultName;
      await coloader.save();
      console.log(`Updated coloader ${coloader._id} with name: ${defaultName}`);
    }
    
    console.log('All coloaders updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating coloaders:', error);
    process.exit(1);
  }
}

// Run the update function
updateColoaderNames();