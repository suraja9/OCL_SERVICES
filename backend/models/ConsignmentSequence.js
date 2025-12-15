import mongoose from "mongoose";

const consignmentSequenceSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true,
    default: 'global'
  },
  currentNumber: {
    type: Number,
    required: true,
    default: 871026571
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'consignmentsequences'
});

// key already has an index (unique: true)

export default mongoose.model('ConsignmentSequence', consignmentSequenceSchema);

