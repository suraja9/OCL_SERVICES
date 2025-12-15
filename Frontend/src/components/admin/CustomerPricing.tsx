import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Calculator, TrendingUp, Package, Plane, Truck, Train, Save, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { makePermissionAwareRequest } from '@/utils/apiUtils';

// New route-based pricing (Assam → NE, Assam → ROI)
type RouteRates = {
  assamToNe: string;
  assamToRoi: string;
};

// Standard DOX weight slabs
type StandardDoxWeightSlabs = {
  '01gm-250gm': RouteRates;
  '251gm-500gm': RouteRates;
  add500gm: RouteRates;
};

// Standard DOX modes (Air, Road, Train)
type StandardDoxModes = {
  air: StandardDoxWeightSlabs;
  road: StandardDoxWeightSlabs;
  train: RouteRates; // Train uses per-kg only
};

// Standard NON DOX weight slabs
type StandardNonDoxWeightSlabs = {
  '1kg-5kg': RouteRates; // Per kg
  '5kg-100kg': RouteRates; // Per kg
};

// Standard NON DOX modes (Air, Road, Train)
type StandardNonDoxModes = {
  air: StandardNonDoxWeightSlabs;
  road: StandardNonDoxWeightSlabs;
  train: RouteRates; // Train uses per-kg only
};

// Priority unified pricing (no modes, no DOX/NON DOX, single price for both routes)
type PriorityPricingState = {
  base500gm: string;
};

type ReverseDeliveryRates = {
  normal: string;
  priority: string;
};

type ReverseTransportRates = {
  byRoad: ReverseDeliveryRates;
  byTrain: ReverseDeliveryRates;
  byFlight: ReverseDeliveryRates;
};

type ReversePricingState = {
  toAssam: ReverseTransportRates;
  toNorthEast: ReverseTransportRates;
};

// Numeric route rates for API responses
type NumericRouteRates = {
  assamToNe: number;
  assamToRoi: number;
};

// Standard DOX response types
type StandardDoxWeightSlabsResponse = {
  '01gm-250gm': NumericRouteRates;
  '251gm-500gm': NumericRouteRates;
  add500gm: NumericRouteRates;
};

type StandardDoxModesResponse = {
  air: StandardDoxWeightSlabsResponse;
  road: StandardDoxWeightSlabsResponse;
  train: NumericRouteRates;
};

// Standard NON DOX response types
type StandardNonDoxWeightSlabsResponse = {
  '1kg-5kg': NumericRouteRates;
  '5kg-100kg': NumericRouteRates;
};

type StandardNonDoxModesResponse = {
  air: StandardNonDoxWeightSlabsResponse;
  road: StandardNonDoxWeightSlabsResponse;
  train: NumericRouteRates;
};

// Priority response type
type PriorityPricingResponse = {
  base500gm: number;
};

type ReverseDeliveryNumericRates = {
  normal: number;
  priority: number;
};

type ReverseTransportNumericRates = {
  byRoad: ReverseDeliveryNumericRates;
  byTrain: ReverseDeliveryNumericRates;
  byFlight: ReverseDeliveryNumericRates;
};

type ReversePricingResponse = {
  toAssam: ReverseTransportNumericRates;
  toNorthEast: ReverseTransportNumericRates;
};

interface CustomerPricingApiResponse {
  standardDox: StandardDoxModesResponse;
  standardNonDox: StandardNonDoxModesResponse;
  priorityPricing: PriorityPricingResponse;
  reversePricing: ReversePricingResponse;
  notes?: string;
  lastUpdatedAt?: string;
  updatedAt?: string;
  lastUpdatedBy?: {
    name?: string;
    email?: string;
  } | string | null;
}

const createRouteRates = (fillValue = ''): RouteRates => ({
  assamToNe: fillValue,
  assamToRoi: fillValue
});

const createStandardDoxWeightSlabs = (fillValue = ''): StandardDoxWeightSlabs => ({
  '01gm-250gm': createRouteRates(fillValue),
  '251gm-500gm': createRouteRates(fillValue),
  add500gm: createRouteRates(fillValue)
});

const createStandardDoxModes = (fillValue = ''): StandardDoxModes => ({
  air: createStandardDoxWeightSlabs(fillValue),
  road: createStandardDoxWeightSlabs(fillValue),
  train: createRouteRates(fillValue)
});

const createStandardNonDoxWeightSlabs = (fillValue = ''): StandardNonDoxWeightSlabs => ({
  '1kg-5kg': createRouteRates(fillValue),
  '5kg-100kg': createRouteRates(fillValue)
});

const createStandardNonDoxModes = (fillValue = ''): StandardNonDoxModes => ({
  air: createStandardNonDoxWeightSlabs(fillValue),
  road: createStandardNonDoxWeightSlabs(fillValue),
  train: createRouteRates(fillValue)
});

const createPriorityPricingState = (fillValue = ''): PriorityPricingState => ({
  base500gm: fillValue
});

const createReverseDeliveryRates = (fillValue = ''): ReverseDeliveryRates => ({
  normal: fillValue,
  priority: fillValue
});

const createReverseTransportRates = (fillValue = ''): ReverseTransportRates => ({
  byRoad: createReverseDeliveryRates(fillValue),
  byTrain: createReverseDeliveryRates(fillValue),
  byFlight: createReverseDeliveryRates(fillValue)
});

const createReversePricingState = (fillValue = ''): ReversePricingState => ({
  toAssam: createReverseTransportRates(fillValue),
  toNorthEast: createReverseTransportRates(fillValue)
});

const formatNumberValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return numeric.toFixed(2);
};

const mapRouteRatesToState = (source?: NumericRouteRates): RouteRates => ({
  assamToNe: formatNumberValue(source?.assamToNe),
  assamToRoi: formatNumberValue(source?.assamToRoi)
});

const mapReverseDeliveryRatesToState = (source?: ReverseDeliveryNumericRates): ReverseDeliveryRates => ({
  normal: formatNumberValue(source?.normal),
  priority: formatNumberValue(source?.priority)
});

const mapReverseTransportRatesToState = (source?: ReverseTransportNumericRates): ReverseTransportRates => ({
  byRoad: mapReverseDeliveryRatesToState(source?.byRoad),
  byTrain: mapReverseDeliveryRatesToState(source?.byTrain),
  byFlight: mapReverseDeliveryRatesToState(source?.byFlight)
});

const mapStandardDoxWeightSlabsToState = (source?: StandardDoxWeightSlabsResponse): StandardDoxWeightSlabs => ({
  '01gm-250gm': mapRouteRatesToState(source?.['01gm-250gm']),
  '251gm-500gm': mapRouteRatesToState(source?.['251gm-500gm']),
  add500gm: mapRouteRatesToState(source?.add500gm)
});

const mapStandardDoxModesToState = (source?: StandardDoxModesResponse): StandardDoxModes => ({
  air: mapStandardDoxWeightSlabsToState(source?.air),
  road: mapStandardDoxWeightSlabsToState(source?.road),
  train: mapRouteRatesToState(source?.train)
});

const mapStandardNonDoxWeightSlabsToState = (source?: StandardNonDoxWeightSlabsResponse): StandardNonDoxWeightSlabs => ({
  '1kg-5kg': mapRouteRatesToState(source?.['1kg-5kg']),
  '5kg-100kg': mapRouteRatesToState(source?.['5kg-100kg'])
});

const mapStandardNonDoxModesToState = (source?: StandardNonDoxModesResponse): StandardNonDoxModes => ({
  air: mapStandardNonDoxWeightSlabsToState(source?.air),
  road: mapStandardNonDoxWeightSlabsToState(source?.road),
  train: mapRouteRatesToState(source?.train)
});

const mapCustomerPricingResponseToState = (data: CustomerPricingApiResponse) => ({
  standardDox: mapStandardDoxModesToState(data.standardDox),
  standardNonDox: mapStandardNonDoxModesToState(data.standardNonDox),
  priorityPricing: {
    base500gm: formatNumberValue(data.priorityPricing?.base500gm)
  } as PriorityPricingState,
  reversePricing: {
    toAssam: mapReverseTransportRatesToState(data.reversePricing?.toAssam),
    toNorthEast: mapReverseTransportRatesToState(data.reversePricing?.toNorthEast)
  } as ReversePricingState
});

const parsePriceValue = (value: string): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric * 100) / 100;
};

const mapRouteRatesToPayload = (state: RouteRates): NumericRouteRates => ({
  assamToNe: parsePriceValue(state.assamToNe),
  assamToRoi: parsePriceValue(state.assamToRoi)
});

const mapReverseDeliveryRatesToPayload = (state: ReverseDeliveryRates): ReverseDeliveryNumericRates => ({
  normal: parsePriceValue(state.normal),
  priority: parsePriceValue(state.priority)
});

const mapReverseTransportRatesToPayload = (state: ReverseTransportRates): ReverseTransportNumericRates => ({
  byRoad: mapReverseDeliveryRatesToPayload(state.byRoad),
  byTrain: mapReverseDeliveryRatesToPayload(state.byTrain),
  byFlight: mapReverseDeliveryRatesToPayload(state.byFlight)
});

const mapStandardDoxWeightSlabsToPayload = (state: StandardDoxWeightSlabs): StandardDoxWeightSlabsResponse => ({
  '01gm-250gm': mapRouteRatesToPayload(state['01gm-250gm']),
  '251gm-500gm': mapRouteRatesToPayload(state['251gm-500gm']),
  add500gm: mapRouteRatesToPayload(state.add500gm)
});

const mapStandardDoxModesToPayload = (state: StandardDoxModes): StandardDoxModesResponse => ({
  air: mapStandardDoxWeightSlabsToPayload(state.air),
  road: mapStandardDoxWeightSlabsToPayload(state.road),
  train: mapRouteRatesToPayload(state.train)
});

const mapStandardNonDoxWeightSlabsToPayload = (state: StandardNonDoxWeightSlabs): StandardNonDoxWeightSlabsResponse => ({
  '1kg-5kg': mapRouteRatesToPayload(state['1kg-5kg']),
  '5kg-100kg': mapRouteRatesToPayload(state['5kg-100kg'])
});

const mapStandardNonDoxModesToPayload = (state: StandardNonDoxModes): StandardNonDoxModesResponse => ({
  air: mapStandardNonDoxWeightSlabsToPayload(state.air),
  road: mapStandardNonDoxWeightSlabsToPayload(state.road),
  train: mapRouteRatesToPayload(state.train)
});

const buildCustomerPricingPayload = (
  standardDox: StandardDoxModes,
  standardNonDox: StandardNonDoxModes,
  priorityPricing: PriorityPricingState,
  reversePricing: ReversePricingState
): CustomerPricingApiResponse => ({
  standardDox: mapStandardDoxModesToPayload(standardDox),
  standardNonDox: mapStandardNonDoxModesToPayload(standardNonDox),
  priorityPricing: {
    base500gm: parsePriceValue(priorityPricing.base500gm)
  },
  reversePricing: {
    toAssam: mapReverseTransportRatesToPayload(reversePricing.toAssam),
    toNorthEast: mapReverseTransportRatesToPayload(reversePricing.toNorthEast)
  }
});

const CustomerPricing = () => {
  const { toast } = useToast();
  
  // State for Standard Service - DOX pricing (with modes: Air, Road, Train)
  const [standardDox, setStandardDox] = useState<StandardDoxModes>(() => createStandardDoxModes());

  // State for Standard Service - NON DOX pricing (with modes: Air, Road, Train)
  const [standardNonDox, setStandardNonDox] = useState<StandardNonDoxModes>(() => createStandardNonDoxModes());

  // State for Priority Service (Unified - no modes, no DOX/NON DOX)
  const [priorityPricing, setPriorityPricing] = useState<PriorityPricingState>(() => createPriorityPricingState());

  // State for Reverse Pricing (From Rest of India to Guwahati/Assam and North East)
  const [reversePricing, setReversePricing] = useState<ReversePricingState>(() => createReversePricingState());

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [metadata, setMetadata] = useState<{ updatedAt: string | null; updatedBy: string | null }>({
    updatedAt: null,
    updatedBy: null
  });

  const loadCustomerPricing = useCallback(async ({ initial = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await makePermissionAwareRequest<CustomerPricingApiResponse>('/admin/customer-pricing');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer pricing data');
      }

      const formatted = mapCustomerPricingResponseToState(response.data);
      setStandardDox(formatted.standardDox);
      setStandardNonDox(formatted.standardNonDox);
      setPriorityPricing(formatted.priorityPricing);
      setReversePricing(formatted.reversePricing);
      setIsDirty(false);

      const updatedAt = response.data.lastUpdatedAt || response.data.updatedAt || null;
      const updatedBy =
        typeof response.data.lastUpdatedBy === 'string'
          ? response.data.lastUpdatedBy
          : response.data.lastUpdatedBy?.name || null;

      setMetadata({
        updatedAt,
        updatedBy
      });
    } catch (error) {
      console.error('Failed to load customer pricing:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to load customer pricing data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      if (initial) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomerPricing({ initial: true });
  }, [loadCustomerPricing]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) {
      return 'Never';
    }

    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const handleSave = useCallback(async () => {
    if (isSaving || !isDirty) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildCustomerPricingPayload(
        standardDox,
        standardNonDox,
        priorityPricing,
        reversePricing
      );

      const response = await makePermissionAwareRequest<CustomerPricingApiResponse>('/admin/customer-pricing', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to save customer pricing');
      }

      const formatted = mapCustomerPricingResponseToState(response.data);
      setStandardDox(formatted.standardDox);
      setStandardNonDox(formatted.standardNonDox);
      setPriorityPricing(formatted.priorityPricing);
      setReversePricing(formatted.reversePricing);
      setIsDirty(false);

      const updatedAt = response.data.lastUpdatedAt || response.data.updatedAt || null;
      const updatedBy =
        typeof response.data.lastUpdatedBy === 'string'
          ? response.data.lastUpdatedBy
          : response.data.lastUpdatedBy?.name || null;

      setMetadata({
        updatedAt,
        updatedBy
      });

      toast({
        title: 'Customer pricing updated',
        description: 'All changes have been saved successfully.'
      });
    } catch (error) {
      console.error('Failed to save customer pricing:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save customer pricing. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [standardDox, standardNonDox, priorityPricing, reversePricing, isDirty, isSaving, toast]);

  const handleRefresh = useCallback(() => {
    if (isSaving) {
      return;
    }
    loadCustomerPricing();
  }, [isSaving, loadCustomerPricing]);

  // Testing section state
  const [testInputs, setTestInputs] = useState({
    destinationPincode: '',
    weight: '',
    serviceType: 'standard', // 'standard' or 'priority'
    type: 'dox', // 'dox' or 'non-dox' (only for standard service)
    mode: 'air', // 'air', 'road', 'train' (only for standard service)
  });

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState<{
    isMinimumWeightApplied: boolean;
    chargeableWeight: number;
  } | null>(null);

  // Format price input to show .00 at the end
  const formatPriceInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(2);
  };

  // Handle price input change
  const handlePriceChange = (value, setter, path) => {
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(prev => {
        const newState = { ...prev };
        const keys = path.split('.');
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newState;
      });
      setIsDirty(true);
    }
  };

  // Handle price input blur (format on complete)
  const handlePriceBlur = (value, setter, path) => {
    const formatted = formatPriceInput(value);
    setter(prev => {
      const newState = { ...prev };
      const keys = path.split('.');
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = formatted;
      return newState;
    });
    if (formatted !== value) {
      setIsDirty(true);
    }
  };

  // Determine route: Assam → NE or Assam → ROI
  const determineRoute = (pincode: string): 'assamToNe' | 'assamToRoi' => {
    const pin = parseInt(pincode);
    
    // North East pincodes (Assam + other NE states)
    if ((pin >= 781000 && pin <= 788999) || // Assam
        (pin >= 790000 && pin <= 791999) || // Arunachal Pradesh
        (pin >= 793000 && pin <= 793999) || // Meghalaya
        (pin >= 795000 && pin <= 795999) || // Manipur
        (pin >= 796000 && pin <= 796999) || // Mizoram
        (pin >= 797000 && pin <= 797999) || // Nagaland
        (pin >= 737000 && pin <= 737999) || // Sikkim
        (pin >= 799000 && pin <= 799999)) { // Tripura
      return 'assamToNe';
    }
    
    // Rest of India
    return 'assamToRoi';
  };

  // Price calculation logic
  const calculatePrice = () => {
    if (!testInputs.destinationPincode || !testInputs.weight) {
      toast({
        title: "Error",
        description: "Please enter destination pincode and weight",
        variant: "destructive"
      });
      return;
    }

    const weight = parseFloat(testInputs.weight);
    const weightInGrams = testInputs.type === 'dox' ? weight : weight * 1000; // DOX in grams, NON DOX in kg
    const weightInKg = testInputs.type === 'dox' ? weight / 1000 : weight;
    
    let price = 0;
    let serviceType = '';
    let route = determineRoute(testInputs.destinationPincode);
    let routeKey: 'assamToNe' | 'assamToRoi' = route;
    let chargeableWeight = weight;
    let isMinimumWeightApplied = false;
    let autoSwitchedToNonDox = false;

    if (testInputs.serviceType === 'priority') {
      // Priority Service (Unified - no modes, no DOX/NON DOX)
      if (weightInGrams > 100000) { // > 100kg
        toast({
          title: "Call Customer Care",
          description: "Weight exceeds 100kg. Please contact customer care for pricing.",
          variant: "default"
        });
        return;
      }
      
      // Priority uses single base500gm rate per 500gm (same for both routes)
      const pricePer500gm = parseFloat(priorityPricing.base500gm) || 0;
      const units = Math.ceil(weightInGrams / 500);
      price = pricePer500gm * units;
      serviceType = 'Priority';
    } else {
      // Standard Service
      if (testInputs.type === 'dox') {
        // DOX pricing - check if weight > 1kg, auto-switch to NON DOX
        if (weightInGrams > 1000) {
          autoSwitchedToNonDox = true;
          toast({
            title: "Auto-switched to NON DOX",
            description: "DOX is limited to 1kg. Switched to NON DOX pricing.",
            variant: "default"
          });
          // Continue with NON DOX logic below
        } else {
          // Standard DOX pricing (0-1kg)
          const mode = testInputs.mode;
          
          if (mode === 'train') {
            // Train uses per-kg rate only with 25kg minimum
            const minWeightKg = 25;
            chargeableWeight = Math.max(weightInKg, minWeightKg);
            isMinimumWeightApplied = chargeableWeight > weightInKg;
            const pricePerKg = parseFloat(standardDox.train[routeKey]) || 0;
            price = pricePerKg * chargeableWeight;
            serviceType = `Standard DOX (Train)`;
          } else if (mode === 'road') {
            // Road uses weight slabs with 3kg (3000g) minimum
            const minWeightGrams = 3000;
            const chargeableWeightGrams = Math.max(weightInGrams, minWeightGrams);
            isMinimumWeightApplied = chargeableWeightGrams > weightInGrams;
            chargeableWeight = chargeableWeightGrams / 1000; // Convert to kg for display
            const doxMode = standardDox[mode];
            if (chargeableWeightGrams <= 250) {
              price = parseFloat(doxMode['01gm-250gm'][routeKey]) || 0;
            } else if (chargeableWeightGrams <= 500) {
              price = parseFloat(doxMode['251gm-500gm'][routeKey]) || 0;
            } else {
              const basePrice = parseFloat(doxMode['251gm-500gm'][routeKey]) || 0;
              const additionalWeight = Math.ceil((chargeableWeightGrams - 500) / 500);
              const additionalPrice = parseFloat(doxMode.add500gm[routeKey]) || 0;
              price = basePrice + (additionalWeight * additionalPrice);
            }
            serviceType = `Standard DOX (Road)`;
          } else {
            // Air uses weight slabs (no minimum)
            const doxMode = standardDox[mode];
            if (weightInGrams <= 250) {
              price = parseFloat(doxMode['01gm-250gm'][routeKey]) || 0;
            } else if (weightInGrams <= 500) {
              price = parseFloat(doxMode['251gm-500gm'][routeKey]) || 0;
            } else {
              const basePrice = parseFloat(doxMode['251gm-500gm'][routeKey]) || 0;
              const additionalWeight = Math.ceil((weightInGrams - 500) / 500);
              const additionalPrice = parseFloat(doxMode.add500gm[routeKey]) || 0;
              price = basePrice + (additionalWeight * additionalPrice);
            }
            serviceType = `Standard DOX (Air)`;
          }
        }
      }
      
      // NON DOX pricing (or auto-switched from DOX)
      if (testInputs.type === 'non-dox' || autoSwitchedToNonDox) {
        if (weight > 100) {
          toast({
            title: "Call Customer Care",
            description: "Weight exceeds 100kg. Please contact customer care for pricing.",
            variant: "default"
          });
          return;
        }
        
        const mode = testInputs.mode;
        
        if (mode === 'train') {
          // Train uses per-kg rate only with 25kg minimum
          const minWeight = 25;
          chargeableWeight = Math.max(weight, minWeight);
          isMinimumWeightApplied = chargeableWeight > weight;
          const pricePerKg = parseFloat(standardNonDox.train[routeKey]) || 0;
          price = pricePerKg * chargeableWeight;
          serviceType = `Standard NON DOX (Train)`;
        } else if (mode === 'road') {
          // Road uses weight slabs with 3kg minimum
          const minWeight = 3;
          chargeableWeight = Math.max(weight, minWeight);
          isMinimumWeightApplied = chargeableWeight > weight;
          const nonDoxMode = standardNonDox[mode];
          let pricePerKg = 0;
          
          if (chargeableWeight >= 1 && chargeableWeight <= 5) {
            pricePerKg = parseFloat(nonDoxMode['1kg-5kg'][routeKey]) || 0;
          } else if (chargeableWeight > 5 && chargeableWeight <= 100) {
            pricePerKg = parseFloat(nonDoxMode['5kg-100kg'][routeKey]) || 0;
          }
          
          price = pricePerKg * chargeableWeight;
          serviceType = `Standard NON DOX (Road)`;
        } else {
          // Air uses weight slabs (no minimum)
          const nonDoxMode = standardNonDox[mode];
          let pricePerKg = 0;
          
          if (weight >= 1 && weight <= 5) {
            pricePerKg = parseFloat(nonDoxMode['1kg-5kg'][routeKey]) || 0;
          } else if (weight > 5 && weight <= 100) {
            pricePerKg = parseFloat(nonDoxMode['5kg-100kg'][routeKey]) || 0;
          }
          
          price = pricePerKg * weight;
          serviceType = `Standard NON DOX (Air)`;
        }
      }
    }
    
    setCalculatedPrice(price);
    setCalculationDetails({
      isMinimumWeightApplied,
      chargeableWeight
    });
    
    const routeText = route === 'assamToNe' ? 'Assam → NE' : 'Assam → ROI';
    const weightText = isMinimumWeightApplied ? ` (charged for ${chargeableWeight.toFixed(2)}${testInputs.type === 'dox' && !autoSwitchedToNonDox ? 'kg' : 'kg'})` : '';
    const weightUnit = testInputs.type === 'dox' && !autoSwitchedToNonDox ? 'grams' : 'kg';
    const minWeightInfo = testInputs.mode === 'train' ? ' (Min. 25kg)' : testInputs.mode === 'road' ? ' (Min. 3kg)' : '';
    
    toast({
      title: "Price Calculated",
      description: `Calculated price: ₹${price.toFixed(2)} for ${serviceType} to ${routeText} (${testInputs.weight} ${weightUnit})${weightText}${minWeightInfo}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer pricing...</span>
        </div>
      </div>
    );
  }

  const lastUpdatedDisplay = formatTimestamp(metadata.updatedAt);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-50 p-3">
              <Tag className="h-7 w-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Customer Pricing Management</h1>
              <p className="mt-1 text-sm text-gray-500">View and edit active customer pricing rates from the database</p>
            </div>
          </div>
          <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="text-xs text-gray-500 sm:text-right">
              <p>
                <span className="font-medium text-gray-600">Last updated:</span>{' '}
                <span className="text-gray-900">{lastUpdatedDisplay}</span>
              </p>
              {metadata.updatedBy && (
                <p className="mt-1">
                  <span className="font-medium text-gray-600">Updated by:</span>{' '}
                  <span className="text-gray-900">{metadata.updatedBy}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isSaving || isRefreshing || isDirty}
                className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Calculator className="h-4 w-4" />
                {showCalculator ? 'Hide' : 'Show'} Calculator
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Calculator Section */}
      {showCalculator && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 py-4">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-purple-600" />
              Price Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Test Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destinationPincode" className="text-sm font-medium">Destination Pincode</Label>
                  <Input
                    id="destinationPincode"
                    value={testInputs.destinationPincode}
                    onChange={(e) => setTestInputs({
                      ...testInputs,
                      destinationPincode: e.target.value
                    })}
                    placeholder="e.g., 781001"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">
                    Weight ({testInputs.serviceType === 'priority' ? 'grams' : (testInputs.type === 'dox' ? 'grams' : 'Kg.')})
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step={testInputs.serviceType === 'priority' || testInputs.type === 'dox' ? "0.1" : "0.01"}
                    value={testInputs.weight}
                    onChange={(e) => setTestInputs({
                      ...testInputs,
                      weight: e.target.value
                    })}
                    placeholder={testInputs.serviceType === 'priority' || testInputs.type === 'dox' ? "e.g., 250" : "e.g., 1.5"}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="text-sm font-medium">Service Type</Label>
                  <Select
                    value={testInputs.serviceType}
                    onValueChange={(value) => setTestInputs({
                      ...testInputs,
                      serviceType: value,
                      weight: ''
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode" className="text-sm font-medium">Mode</Label>
                  <Select
                    value={testInputs.mode}
                    onValueChange={(value) => setTestInputs({
                      ...testInputs,
                      mode: value
                    })}
                    disabled={testInputs.serviceType === 'priority'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="road">Road (Min. 3kg)</SelectItem>
                      <SelectItem value="train">Train (Min. 25kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Standard Service Options */}
              {testInputs.serviceType === 'standard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    <Select
                      value={testInputs.type}
                      onValueChange={(value) => setTestInputs({
                        ...testInputs,
                        type: value,
                        weight: ''
                      })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dox">DOX (0-1kg only)</SelectItem>
                        <SelectItem value="non-dox">NON-DOX (1kg+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800 font-medium">Minimum Weight Rules:</p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Train: Minimum 25kg chargeable</li>
                      <li>• Road: Minimum 3kg chargeable</li>
                      <li>• Air: No minimum weight</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Calculate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={calculatePrice}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-2 shadow-lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Price
                </Button>
              </div>

              {/* Results */}
              {calculatedPrice !== null && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Calculation Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Destination:</span> <span className="text-gray-900">{testInputs.destinationPincode}</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Route:</span> <span className="text-gray-900">{determineRoute(testInputs.destinationPincode) === 'assamToNe' ? 'Assam → NE' : 'Assam → ROI'}</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Service:</span> <span className="text-gray-900">{testInputs.serviceType === 'priority' ? 'Priority' : `Standard ${testInputs.type === 'dox' ? 'DOX' : 'NON-DOX'}`}</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Mode:</span> 
                      <span className="text-gray-900">
                        {testInputs.serviceType === 'standard' && testInputs.mode ? ` ${testInputs.mode.charAt(0).toUpperCase() + testInputs.mode.slice(1)}` : testInputs.serviceType === 'priority' ? ' N/A' : ''}
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Weight:</span> <span className="text-gray-900">{testInputs.weight} {testInputs.serviceType === 'priority' || testInputs.type === 'dox' ? 'grams' : 'Kg.'}</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-700">Chargeable Weight:</span> 
                      <span className="text-gray-900">
                        {calculationDetails?.isMinimumWeightApplied ? `${calculationDetails.chargeableWeight.toFixed(2)} kg (Min. applied)` : `${testInputs.weight} ${testInputs.serviceType === 'priority' || testInputs.type === 'dox' ? 'grams' : 'Kg.'}`}
                      </span>
                    </div>
                    <div className="md:col-span-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                      <span className="font-bold text-gray-800 text-base">Calculated Price:</span> 
                      <span className="text-green-700 font-bold text-2xl ml-3">₹{calculatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Standard Service - DOX */}
      <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200 py-4">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Standard Service - DOX
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">By Air, Road & Train</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Upto 1 Kg</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Air & Road Combined */}
          <div className="px-3 pt-2">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Air
              </h3>
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Road
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto px-3 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b border-blue-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 border-r border-blue-300">Weight</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-800 text-xs py-1.5 text-center border-r-2 border-blue-300">
                    <div className="flex items-center justify-center gap-1">
                      <Plane className="h-3 w-3" />
                      Air
                    </div>
                  </TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-800 text-xs py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Truck className="h-3 w-3" />
                      Road
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1 border-r border-blue-300"></TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r border-blue-300">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r-2 border-blue-300">Assam → ROI</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r border-blue-300">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center">Assam → ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-gray-200 hover:bg-blue-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-blue-300">01 gm. to 250 gm.</TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air['01gm-250gm'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.01gm-250gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.01gm-250gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r-2 border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air['01gm-250gm'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.01gm-250gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.01gm-250gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road['01gm-250gm'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.01gm-250gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.01gm-250gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road['01gm-250gm'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.01gm-250gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.01gm-250gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="border-b border-gray-200 hover:bg-blue-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-blue-300">251 gm. to 500 gm.</TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air['251gm-500gm'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.251gm-500gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.251gm-500gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r-2 border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air['251gm-500gm'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.251gm-500gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.251gm-500gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road['251gm-500gm'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.251gm-500gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.251gm-500gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road['251gm-500gm'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.251gm-500gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.251gm-500gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-blue-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-blue-300">Add. 500 gm.</TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air.add500gm.assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.add500gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.add500gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r-2 border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.air.add500gm.assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'air.add500gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'air.add500gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-blue-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road.add500gm.assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.add500gm.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.add500gm.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.road.add500gm.assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'road.add500gm.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'road.add500gm.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Train Mode */}
          <div className="px-3 pt-2">
            <h3 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Train className="h-3 w-3" />
              Train (Per Kg)
            </h3>
          </div>
          <div className="overflow-x-auto px-3 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b border-blue-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 border-r border-blue-300">Route</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 text-center">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 text-center">Assam → ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-blue-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-blue-300">Per Kg</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.train.assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'train.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'train.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardDox.train.assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardDox, 'train.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardDox, 'train.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-blue-200 focus:border-blue-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-200">
            <p className="text-xs text-gray-600">
              Above price is excluding of Other Charge and GST 18%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Standard Service - NON DOX */}
      <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200 py-4">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-600" />
            Standard Service - NON DOX
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">By Air, Road & Train</Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">1kg - 100kg</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Air & Road Combined */}
          <div className="px-3 pt-2">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Air
              </h3>
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Road
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto px-3 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 border-r border-orange-300">Weight</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-800 text-xs py-1.5 text-center border-r-2 border-orange-300">
                    <div className="flex items-center justify-center gap-1">
                      <Plane className="h-3 w-3" />
                      Air
                    </div>
                  </TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-800 text-xs py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Truck className="h-3 w-3" />
                      Road
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1 border-r border-orange-300"></TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r border-orange-300">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r-2 border-orange-300">Assam → ROI</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center border-r border-orange-300">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1 text-center">Assam → ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-gray-200 hover:bg-orange-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-orange-300">1kg - 5kg</TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.air['1kg-5kg'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'air.1kg-5kg.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'air.1kg-5kg.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r-2 border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.air['1kg-5kg'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'air.1kg-5kg.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'air.1kg-5kg.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.road['1kg-5kg'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'road.1kg-5kg.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'road.1kg-5kg.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.road['1kg-5kg'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'road.1kg-5kg.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'road.1kg-5kg.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-orange-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-orange-300">5kg - 100kg</TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.air['5kg-100kg'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'air.5kg-100kg.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'air.5kg-100kg.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r-2 border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.air['5kg-100kg'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'air.5kg-100kg.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'air.5kg-100kg.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5 border-r border-orange-300">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.road['5kg-100kg'].assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'road.5kg-100kg.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'road.5kg-100kg.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.road['5kg-100kg'].assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'road.5kg-100kg.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'road.5kg-100kg.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Train Mode */}
          <div className="px-3 pt-2">
            <h3 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Train className="h-3 w-3" />
              Train (Per Kg)
            </h3>
          </div>
          <div className="overflow-x-auto px-3 pb-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 border-r border-orange-300">Route</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 text-center">Assam → NE</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 text-center">Assam → ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-orange-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-orange-300">Per Kg</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.train.assamToNe}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'train.assamToNe')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'train.assamToNe')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={standardNonDox.train.assamToRoi}
                        onChange={(e) => handlePriceChange(e.target.value, setStandardNonDox, 'train.assamToRoi')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setStandardNonDox, 'train.assamToRoi')}
                        className="w-20 h-7 text-xs text-center border-orange-200 focus:border-orange-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-orange-50 border-t border-orange-200">
            <p className="text-xs text-gray-600">
              Above price is excluding of Other Charge and GST 18%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Priority Service */}
      <Card className="border-2 border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-200 py-4">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-pink-600" />
            Priority Service
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">Unified Pricing</Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">Upto 100 Kg</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-3 py-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-pink-100 to-rose-100 border-b border-pink-200">
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 border-r border-pink-300">Weight</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs py-1.5 text-center">Price (Per 500gm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-pink-50/50">
                  <TableCell className="font-semibold text-xs py-1.5 border-r border-pink-300">500gm</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={priorityPricing.base500gm}
                        onChange={(e) => handlePriceChange(e.target.value, setPriorityPricing, 'base500gm')}
                        onBlur={(e) => handlePriceBlur(e.target.value, setPriorityPricing, 'base500gm')}
                        className="w-20 h-7 text-xs text-center border-pink-200 focus:border-pink-400"
                        placeholder="0.00"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-pink-50 border-t border-pink-200">
            <p className="text-xs text-gray-600">
              Above price is excluding of Other Charge and GST 18%
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CustomerPricing;
