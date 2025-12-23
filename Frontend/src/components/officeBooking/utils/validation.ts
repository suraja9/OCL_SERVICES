/**
 * Validation utilities for Office Booking Panel
 */

import { ValidationError, StepValidationResult, AddressData, ShipmentData } from '../types';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian mobile number (10 digits)
 */
export const validateMobileNumber = (mobile: string): boolean => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.replace(/\D/g, ''));
};

/**
 * Validate Indian pincode (6 digits)
 */
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Validate GST number format
 */
export const validateGSTNumber = (gst: string): boolean => {
  if (!gst) return true; // GST is optional
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

/**
 * Validate origin address data
 */
export const validateOriginData = (data: AddressData): StepValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.mobileNumber.trim()) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number is required' });
  } else if (!validateMobileNumber(data.mobileNumber)) {
    errors.push({ field: 'mobileNumber', message: 'Invalid mobile number format' });
  }

  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!data.pincode.trim()) {
    errors.push({ field: 'pincode', message: 'Pincode is required' });
  } else if (!validatePincode(data.pincode)) {
    errors.push({ field: 'pincode', message: 'Invalid pincode format (6 digits required)' });
  }

  if (data.gstNumber && !validateGSTNumber(data.gstNumber)) {
    errors.push({ field: 'gstNumber', message: 'Invalid GST number format' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate destination address data
 */
export const validateDestinationData = (data: AddressData): StepValidationResult => {
  return validateOriginData(data); // Same validation rules
};

/**
 * Validate shipment data
 */
export const validateShipmentData = (data: ShipmentData): StepValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.natureOfConsignment.trim()) {
    errors.push({ field: 'natureOfConsignment', message: 'Nature of consignment is required' });
  }

  if (!data.actualWeight.trim()) {
    errors.push({ field: 'actualWeight', message: 'Actual weight is required' });
  } else {
    const weight = parseFloat(data.actualWeight);
    if (isNaN(weight) || weight <= 0) {
      errors.push({ field: 'actualWeight', message: 'Invalid weight value' });
    }
  }

  if (data.dimensions.length === 0) {
    errors.push({ field: 'dimensions', message: 'At least one dimension is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get error message for a specific field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find(e => e.field === field)?.message;
};

