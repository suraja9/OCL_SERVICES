import ConsignmentAssignment, { ConsignmentUsage } from '../models/ConsignmentAssignment.js';
import CustomerBooking from '../models/CustomerBooking.js';
import FormData from '../models/FormData.js';
import ConsignmentSequence from '../models/ConsignmentSequence.js';

const BASE_CONSIGNMENT_NUMBER = 871026571;
const SEQUENCE_KEY = 'global';

const extractNumber = (doc, field) => {
  if (!doc || typeof doc[field] !== 'number') {
    return BASE_CONSIGNMENT_NUMBER;
  }
  return doc[field];
};

export const getHighestReservedConsignmentNumber = async () => {
  const [
    highestAssignment,
    highestFormData,
    highestCustomerBooking,
    highestUsage,
    sequenceDoc
  ] = await Promise.all([
    ConsignmentAssignment.findOne({ isActive: true }).sort({ endNumber: -1 }).select('endNumber').lean(),
    FormData.findOne({ consignmentNumber: { $exists: true } }).sort({ consignmentNumber: -1 }).select('consignmentNumber').lean(),
    CustomerBooking.findOne({ consignmentNumber: { $exists: true } }).sort({ consignmentNumber: -1 }).select('consignmentNumber').lean(),
    ConsignmentUsage.findOne({}).sort({ consignmentNumber: -1 }).select('consignmentNumber').lean(),
    ConsignmentSequence.findOne({ key: SEQUENCE_KEY }).select('currentNumber').lean()
  ]);

  return Math.max(
    BASE_CONSIGNMENT_NUMBER,
    extractNumber(highestAssignment, 'endNumber'),
    extractNumber(highestFormData, 'consignmentNumber'),
    extractNumber(highestCustomerBooking, 'consignmentNumber'),
    extractNumber(highestUsage, 'consignmentNumber'),
    extractNumber(sequenceDoc, 'currentNumber')
  );
};

export const getNextGlobalConsignmentNumber = async () => {
  const requiredMinimum = await getHighestReservedConsignmentNumber();

  await ConsignmentSequence.findOneAndUpdate(
    { key: SEQUENCE_KEY },
    {
      $max: { currentNumber: requiredMinimum },
      $setOnInsert: {
        key: SEQUENCE_KEY
      },
      $set: { updatedAt: new Date() }
    },
    { new: true, upsert: true }
  );

  const nextSequence = await ConsignmentSequence.findOneAndUpdate(
    { key: SEQUENCE_KEY },
    {
      $inc: { currentNumber: 1 },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );

  if (!nextSequence || typeof nextSequence.currentNumber !== 'number') {
    throw new Error('Unable to generate next consignment number');
  }

  return nextSequence.currentNumber;
};

export const getGlobalConsignmentSummary = async () => {
  const highestNumber = await getHighestReservedConsignmentNumber();
  return {
    highestNumber,
    nextStartNumber: highestNumber + 1
  };
};

