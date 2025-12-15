import express from 'express';
import ColdCallingData from '../models/ColdCallingData.js';
import { authenticateAdmin, authenticateAdminOrOfficeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all data for a specific tab
router.get('/:tabName', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const { tabName } = req.params;
    
    const data = await ColdCallingData.find({ tabName })
      .sort({ rowNumber: 1, createdAt: 1 })
      .lean();
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching cold calling data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cold calling data' 
    });
  }
});

// Get all tabs with their data counts
router.get('/', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const tabs = await ColdCallingData.distinct('tabName');
    const tabsWithCounts = await Promise.all(
      tabs.map(async (tabName) => {
        const count = await ColdCallingData.countDocuments({ tabName });
        return { tabName, count };
      })
    );
    
    res.json({ success: true, tabs: tabsWithCounts });
  } catch (error) {
    console.error('Error fetching tabs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tabs' 
    });
  }
});

// Create a new row
router.post('/', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const {
      tabName,
      concernName,
      companyName,
      destination,
      phone1,
      phone2,
      sujata,
      followUpDate,
      rating,
      broadcast,
      backgroundColor,
      status
    } = req.body;
    
    if (!tabName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tab name is required' 
      });
    }
    
    // Get the max row number for this tab
    const maxRow = await ColdCallingData.findOne({ tabName })
      .sort({ rowNumber: -1 })
      .select('rowNumber')
      .lean();
    
    const newRow = new ColdCallingData({
      tabName,
      concernName: concernName || '',
      companyName: companyName || '',
      destination: destination || '',
      phone1: phone1 || '',
      phone2: phone2 || '',
      sujata: sujata || '',
      followUpDate: followUpDate || '',
      rating: rating || '',
      broadcast: broadcast || '',
      status: status || '',
      backgroundColor: backgroundColor || '',
      rowNumber: maxRow ? maxRow.rowNumber + 1 : 1
    });
    
    await newRow.save();
    
    res.status(201).json({ success: true, data: newRow });
  } catch (error) {
    console.error('Error creating cold calling data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create cold calling data' 
    });
  }
});

// Update a row
router.put('/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      concernName,
      companyName,
      destination,
      phone1,
      phone2,
      sujata,
      followUpDate,
      rating,
      broadcast,
      backgroundColor,
      rowNumber,
      status
    } = req.body;
    
    const updateData = {};
    if (concernName !== undefined) updateData.concernName = concernName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (destination !== undefined) updateData.destination = destination;
    if (phone1 !== undefined) updateData.phone1 = phone1;
    if (phone2 !== undefined) updateData.phone2 = phone2;
    if (sujata !== undefined) updateData.sujata = sujata;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate;
    if (rating !== undefined) updateData.rating = rating;
    if (broadcast !== undefined) updateData.broadcast = broadcast;
    if (status !== undefined) updateData.status = status;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (rowNumber !== undefined) updateData.rowNumber = rowNumber;
    
    updateData.updatedAt = new Date();
    
    const updatedRow = await ColdCallingData.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedRow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Row not found' 
      });
    }
    
    res.json({ success: true, data: updatedRow });
  } catch (error) {
    console.error('Error updating cold calling data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update cold calling data' 
    });
  }
});

// Bulk update rows (for reordering or batch updates)
router.put('/bulk/:tabName', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const { tabName } = req.params;
    const { rows } = req.body; // Array of { id, ...fields }
    
    if (!Array.isArray(rows)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rows must be an array' 
      });
    }
    
    const updatePromises = rows.map((row) => {
      const { id, ...updateData } = row;
      updateData.updatedAt = new Date();
      return ColdCallingData.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({ success: true, message: 'Rows updated successfully' });
  } catch (error) {
    console.error('Error bulk updating cold calling data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update cold calling data' 
    });
  }
});

// Delete a row
router.delete('/:id', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRow = await ColdCallingData.findByIdAndDelete(id);
    
    if (!deletedRow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Row not found' 
      });
    }
    
    res.json({ success: true, message: 'Row deleted successfully' });
  } catch (error) {
    console.error('Error deleting cold calling data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete cold calling data' 
    });
  }
});

// Delete all rows for a tab
router.delete('/tab/:tabName', authenticateAdminOrOfficeAdmin, async (req, res) => {
  try {
    const { tabName } = req.params;
    
    const result = await ColdCallingData.deleteMany({ tabName });
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} rows`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting tab data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete tab data' 
    });
  }
});

export default router;
