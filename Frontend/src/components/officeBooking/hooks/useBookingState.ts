/**
 * useBookingState Hook
 * Centralized state management for office booking
 */

import { useState } from 'react';
import { 
  AddressData, 
  ShipmentData, 
  UploadData, 
  PaymentData, 
  BillData, 
  DetailsData,
  BookingStep 
} from '../types';
import {
  DEFAULT_ORIGIN_DATA,
  DEFAULT_DESTINATION_DATA,
  DEFAULT_SHIPMENT_DATA,
  DEFAULT_UPLOAD_DATA,
  DEFAULT_PAYMENT_DATA,
  DEFAULT_BILL_DATA,
  DEFAULT_DETAILS_DATA,
  BOOKING_STEPS
} from '../utils/constants';

export const useBookingState = () => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    Array(BOOKING_STEPS.length).fill(false)
  );

  // Form data states
  const [originData, setOriginData] = useState<AddressData>(DEFAULT_ORIGIN_DATA);
  const [destinationData, setDestinationData] = useState<AddressData>(DEFAULT_DESTINATION_DATA);
  const [shipmentData, setShipmentData] = useState<ShipmentData>(DEFAULT_SHIPMENT_DATA);
  const [uploadData, setUploadData] = useState<UploadData>(DEFAULT_UPLOAD_DATA);
  const [paymentData, setPaymentData] = useState<PaymentData>(DEFAULT_PAYMENT_DATA);
  const [billData, setBillData] = useState<BillData>(DEFAULT_BILL_DATA);
  const [detailsData, setDetailsData] = useState<DetailsData>(DEFAULT_DETAILS_DATA);

  // Serviceability states
  const [originPincode, setOriginPincode] = useState('');
  const [destinationPincode, setDestinationPincode] = useState('');
  const [originServiceable, setOriginServiceable] = useState<boolean | null>(null);
  const [destinationServiceable, setDestinationServiceable] = useState<boolean | null>(null);
  const [checkingOrigin, setCheckingOrigin] = useState(false);
  const [checkingDestination, setCheckingDestination] = useState(false);
  const [originAddressInfo, setOriginAddressInfo] = useState('');
  const [destinationAddressInfo, setDestinationAddressInfo] = useState('');

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isChargeableFixed, setIsChargeableFixed] = useState(false);

  // Navigation functions
  const goToStep = (step: number) => {
    if (step >= 0 && step < BOOKING_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < BOOKING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const newSteps = [...prev];
      newSteps[stepIndex] = true;
      return newSteps;
    });
  };

  const resetBooking = () => {
    setCurrentStep(0);
    setCompletedSteps(Array(BOOKING_STEPS.length).fill(false));
    setOriginData(DEFAULT_ORIGIN_DATA);
    setDestinationData(DEFAULT_DESTINATION_DATA);
    setShipmentData(DEFAULT_SHIPMENT_DATA);
    setUploadData(DEFAULT_UPLOAD_DATA);
    setPaymentData(DEFAULT_PAYMENT_DATA);
    setBillData(DEFAULT_BILL_DATA);
    setDetailsData(DEFAULT_DETAILS_DATA);
    setOriginPincode('');
    setDestinationPincode('');
    setOriginServiceable(null);
    setDestinationServiceable(null);
    setCheckingOrigin(false);
    setCheckingDestination(false);
    setOriginAddressInfo('');
    setDestinationAddressInfo('');
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsChargeableFixed(false);
  };

  return {
    // State
    currentStep,
    completedSteps,
    originData,
    destinationData,
    shipmentData,
    uploadData,
    paymentData,
    billData,
    detailsData,
    originPincode,
    destinationPincode,
    originServiceable,
    destinationServiceable,
    checkingOrigin,
    checkingDestination,
    originAddressInfo,
    destinationAddressInfo,
    isSubmitting,
    submitError,
    submitSuccess,
    
    // Setters
    setCurrentStep,
    setCompletedSteps,
    setOriginData,
    setDestinationData,
    setShipmentData,
    setUploadData,
    setPaymentData,
    setBillData,
    setDetailsData,
    setOriginPincode,
    setDestinationPincode,
    setOriginServiceable,
    setDestinationServiceable,
    setCheckingOrigin,
    setCheckingDestination,
    setOriginAddressInfo,
    setDestinationAddressInfo,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
    isChargeableFixed,
    setIsChargeableFixed,
    
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    markStepComplete,
    resetBooking,
    
    // Constants
    steps: BOOKING_STEPS
  };
};

