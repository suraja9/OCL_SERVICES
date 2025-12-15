import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ColdCallingData from '../models/ColdCallingData.js';

dotenv.config();

// Sample data structure - you can modify this with actual data
const sampleData = {
  'Master': [
    {
      concernName: 'Pradip - HO',
      companyName: 'KKB Projects Pvt. Ltd.',
      destination: 'SURAT',
      phone1: '9825116690',
      phone2: '9863226438',
      sujata: 'Call nhi',
      followUpDate: '20 Nov',
      rating: '5 Star',
      broadcast: 'YES',
    },
    {
      concernName: 'Balvinder Singh',
      companyName: 'Bharat Construction',
      destination: 'Nagaland',
      phone1: '9373134178',
      phone2: '',
      sujata: 'He left the',
      followUpDate: '1 Dec',
      rating: '5 Star',
      broadcast: 'NO',
    },
    // Add more sample data as needed
  ],
  '5 Star': [
    // Add 5 Star data here
  ],
  '4 Star': [
    // Add 4 Star data here
  ],
  '3 Star': [
    // Add 3 Star data here
  ],
  'Red Zone': [
    // Add Red Zone data here
  ],
  'Scrap': [
    // Add Scrap data here
  ],
  'Enq': [
    // Add Enq data here
  ],
  'Enq-Oct': [
    // Add Enq-Oct data here
  ],
  'Enq-Nov': [
    // Add Enq-Nov data here
  ],
};

async function seedColdCallingData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ocl');
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await ColdCallingData.deleteMany({});
    // console.log('Cleared existing cold calling data');

    // Insert data for each tab
    for (const [tabName, rows] of Object.entries(sampleData)) {
      if (rows.length === 0) continue;

      console.log(`\nSeeding data for tab: ${tabName}`);
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const coldCallingRow = new ColdCallingData({
          tabName,
          ...row,
          rowNumber: i + 1,
        });
        
        await coldCallingRow.save();
        console.log(`  ✓ Inserted row ${i + 1}: ${row.concernName || row.companyName}`);
      }
    }

    console.log('\n✅ Cold calling data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding cold calling data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedColdCallingData();

