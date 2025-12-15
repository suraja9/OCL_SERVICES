import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { DollarSign, Loader2, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PricingData {
  _id: string;
  name: string;
  status: string;
  doxPricing: {
    '01gm-250gm': {
      assam: number;
      neBySurface: number;
      neByAirAgtImp: number;
      restOfIndia: number;
    };
    '251gm-500gm': {
      assam: number;
      neBySurface: number;
      neByAirAgtImp: number;
      restOfIndia: number;
    };
    add500gm: {
      assam: number;
      neBySurface: number;
      neByAirAgtImp: number;
      restOfIndia: number;
    };
  };
  nonDoxSurfacePricing: {
    assam: number;
    neBySurface: number;
    neByAirAgtImp: number;
    restOfIndia: number;
  };
  nonDoxAirPricing: {
    assam: number;
    neBySurface: number;
    neByAirAgtImp: number;
    restOfIndia: number;
  };
  priorityPricing: {
    '01gm-500gm': {
      assam: number;
      neBySurface: number;
      neByAirAgtImp: number;
      restOfIndia: number;
    };
    add500gm: {
      assam: number;
      neBySurface: number;
      neByAirAgtImp: number;
      restOfIndia: number;
    };
  };
  reversePricing: {
    toAssam: {
      byRoad: {
        normal: number;
        priority: number;
      };
      byTrain: {
        normal: number;
        priority: number;
      };
      byFlight: {
        normal: number;
        priority: number;
      };
    };
    toNorthEast: {
      byRoad: {
        normal: number;
        priority: number;
      };
      byTrain: {
        normal: number;
        priority: number;
      };
      byFlight: {
        normal: number;
        priority: number;
      };
    };
  };
  createdAt: string;
  approvedAt?: string;
}

interface CorporatePricingDisplayProps {
  isDarkMode?: boolean;
}

const CorporatePricingDisplay: React.FC<CorporatePricingDisplayProps> = ({ isDarkMode = false }) => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Testing section state (from admin component)
  const [testInputs, setTestInputs] = useState({
    fromPincode: '',
    destinationPincode: '',
    weight: '',
    type: 'dox', // 'dox' or 'non-dox'
    byAir: false,
    priority: false,
    transportMode: 'byRoad', // 'byRoad', 'byTrain', 'byFlight' for reverse pricing
    deliveryType: 'normal' // 'normal' or 'priority' for reverse pricing
  });

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch('/api/corporate/pricing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPricingData(data.pricing);
      } else if (response.status === 404) {
        setError('No pricing plan has been assigned to your corporate account yet. Please contact your administrator.');
      } else {
        throw new Error('Failed to fetch pricing data');
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setError('Failed to load pricing information. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price ? `₹${price.toFixed(2)}` : 'N/A';
  };

  // Helper functions from admin component
  const isAssamPincode = (pincode: string): boolean => {
    const pin = parseInt(pincode);
    return (pin >= 781000 && pin <= 781999) || 
           (pin >= 782000 && pin <= 782999) || 
           (pin >= 783000 && pin <= 783999) || 
           (pin >= 784000 && pin <= 784999) || 
           (pin >= 785000 && pin <= 785999) || 
           (pin >= 786000 && pin <= 786999) || 
           (pin >= 787000 && pin <= 787999) || 
           (pin >= 788000 && pin <= 788999);
  };

  const isNorthEastPincode = (pincode: string): boolean => {
    const pin = parseInt(pincode);
    return (pin >= 790000 && pin <= 791999) || // Arunachal Pradesh
           (pin >= 793000 && pin <= 793999) || // Meghalaya
           (pin >= 795000 && pin <= 795999) || // Manipur
           (pin >= 796000 && pin <= 796999) || // Mizoram
           (pin >= 797000 && pin <= 797999) || // Nagaland
           (pin >= 737000 && pin <= 737999) || // Sikkim
           (pin >= 799000 && pin <= 799999);   // Tripura
  };

  const classifyLocation = (pincode: string, isAirRoute: boolean = false): string => {
    const pin = parseInt(pincode);
    
    // Assam pincodes (781xxx, 782xxx, 783xxx, 784xxx, 785xxx, 786xxx, 787xxx, 788xxx)
    if ((pin >= 781000 && pin <= 781999) || 
        (pin >= 782000 && pin <= 782999) || 
        (pin >= 783000 && pin <= 783999) || 
        (pin >= 784000 && pin <= 784999) || 
        (pin >= 785000 && pin <= 785999) || 
        (pin >= 786000 && pin <= 786999) || 
        (pin >= 787000 && pin <= 787999) || 
        (pin >= 788000 && pin <= 788999)) {
      return 'assam';
    }
    
    // Kolkata pincodes (700xxx)
    if (pin >= 700000 && pin <= 700999) {
      return 'kol';
    }
    
    // Tripura (799xxx) and Manipur (795xxx) - AGT IMP only for air routes
    if (isAirRoute && ((pin >= 799000 && pin <= 799999) || (pin >= 795000 && pin <= 795999))) {
      return 'neByAirAgtImp';
    }
    
    // Tripura (799xxx) and Manipur (795xxx) - Surface route
    if (!isAirRoute && ((pin >= 799000 && pin <= 799999) || (pin >= 795000 && pin <= 795999))) {
      return 'neBySurface';
    }
    
    // Other NE states (Arunachal Pradesh 790xxx, 791xxx, Nagaland 797xxx, Meghalaya 793xxx, Mizoram 796xxx, Sikkim 737xxx)
    if ((pin >= 790000 && pin <= 791999) || 
        (pin >= 793000 && pin <= 793999) || 
        (pin >= 796000 && pin <= 796999) || 
        (pin >= 797000 && pin <= 797999) || 
        (pin >= 737000 && pin <= 737999)) {
      return 'neBySurface';
    }
    
    // Rest of India
    return 'restOfIndia';
  };

  // Price calculation logic from admin component
  const calculatePrice = () => {
    if (!pricingData) {
      toast({
        title: "Error",
        description: "Pricing data not available",
        variant: "destructive"
      });
      return;
    }

    if (!testInputs.destinationPincode || !testInputs.weight) {
      toast({
        title: "Error",
        description: "Please enter destination pincode and weight",
        variant: "destructive"
      });
      return;
    }

    const weight = parseFloat(testInputs.weight);
    let price = 0;
    let serviceType = testInputs.type.toUpperCase();
    let location = '';
    let transportMode = '';
    let chargeableWeight = weight;
    let isMinimumWeightApplied = false;

    // Check if this is reverse pricing (from pincode provided and destination is Assam/North East)
    if (testInputs.fromPincode && testInputs.type === 'non-dox') {
      // Reverse pricing logic
      const minChargeableWeights = {
        byRoad: 500,
        byTrain: 100,
        byFlight: 25
      };
      
      chargeableWeight = Math.max(weight, minChargeableWeights[testInputs.transportMode as keyof typeof minChargeableWeights]);
      isMinimumWeightApplied = chargeableWeight > weight;

      if (isAssamPincode(testInputs.destinationPincode)) {
        location = 'Assam';
        const pricePerKg = (pricingData.reversePricing.toAssam[testInputs.transportMode as keyof typeof pricingData.reversePricing.toAssam][testInputs.deliveryType as keyof typeof pricingData.reversePricing.toAssam.byRoad] as number) || 0;
        price = pricePerKg * chargeableWeight;
        transportMode = testInputs.transportMode;
      } else if (isNorthEastPincode(testInputs.destinationPincode)) {
        location = 'North East';
        const pricePerKg = (pricingData.reversePricing.toNorthEast[testInputs.transportMode as keyof typeof pricingData.reversePricing.toNorthEast][testInputs.deliveryType as keyof typeof pricingData.reversePricing.toNorthEast.byRoad] as number) || 0;
        price = pricePerKg * chargeableWeight;
        transportMode = testInputs.transportMode;
      } else {
        toast({
          title: "Error",
          description: "Reverse pricing is only available for Assam and North East destinations",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Normal pricing logic
      location = classifyLocation(testInputs.destinationPincode, testInputs.byAir);
    
      if (testInputs.type === 'dox') {
        // DOX pricing logic
        if (testInputs.priority) {
          // Priority Service pricing
          if (weight <= 500) {
            price = (pricingData.priorityPricing['01gm-500gm'][location as keyof typeof pricingData.priorityPricing['01gm-500gm']] as number) || 0;
          } else {
            // For weights above 500gm, use base price + additional 500gm charges
            const basePrice = (pricingData.priorityPricing['01gm-500gm'][location as keyof typeof pricingData.priorityPricing['01gm-500gm']] as number) || 0;
            const additionalWeight = Math.ceil((weight - 500) / 500);
            const additionalPrice = (pricingData.priorityPricing.add500gm[location as keyof typeof pricingData.priorityPricing.add500gm] as number) || 0;
            price = basePrice + (additionalWeight * additionalPrice);
          }
        } else {
          // Standard Service pricing
          if (weight <= 250) {
            price = (pricingData.doxPricing['01gm-250gm'][location as keyof typeof pricingData.doxPricing['01gm-250gm']] as number) || 0;
          } else if (weight <= 500) {
            price = (pricingData.doxPricing['251gm-500gm'][location as keyof typeof pricingData.doxPricing['251gm-500gm']] as number) || 0;
          } else {
            // For weights above 500gm, use base price + additional 500gm charges
            const basePrice = (pricingData.doxPricing['251gm-500gm'][location as keyof typeof pricingData.doxPricing['251gm-500gm']] as number) || 0;
            const additionalWeight = Math.ceil((weight - 500) / 500);
            const additionalPrice = (pricingData.doxPricing.add500gm[location as keyof typeof pricingData.doxPricing.add500gm] as number) || 0;
            price = basePrice + (additionalWeight * additionalPrice);
          }
        }
      } else {
        // NON-DOX pricing logic (per kg)
        if (testInputs.byAir) {
          const pricePerKg = (pricingData.nonDoxAirPricing[location as keyof typeof pricingData.nonDoxAirPricing] as number) || 0;
          price = pricePerKg * weight;
        } else {
          const pricePerKg = (pricingData.nonDoxSurfacePricing[location as keyof typeof pricingData.nonDoxSurfacePricing] as number) || 0;
          price = pricePerKg * weight;
        }
      }
    }
    
    setCalculatedPrice(price);
    
    if (testInputs.priority) serviceType += ' (Priority)';
    if (testInputs.byAir) serviceType += ' (By Air)';
    if (transportMode) serviceType += ` (${transportMode})`;
    
    const fromText = testInputs.fromPincode ? ` from ${testInputs.fromPincode}` : '';
    const weightText = isMinimumWeightApplied ? ` (charged for ${chargeableWeight}kg)` : '';
    toast({
      title: "Price Calculated",
      description: `Calculated price: ₹${price.toFixed(2)} for ${serviceType}${fromText} to ${location}${weightText}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className={cn(
            "h-8 w-8 animate-spin mx-auto mb-4",
            isDarkMode ? "text-blue-400" : "text-blue-600"
          )} />
          <p className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Loading pricing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert variant="destructive" className={cn(
          isDarkMode && "bg-red-950/50 border-red-800/50"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={isDarkMode ? "text-red-300" : ""}>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pricingData) {
    return (
      <div className="py-8">
        <Alert className={cn(
          isDarkMode && "bg-slate-800/50 border-slate-700/50"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={isDarkMode ? "text-slate-300" : ""}>No pricing information available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-12 lg:px-16 xl:px-20">
      <div className="space-y-5">

        {/* Price Calculator Section */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-purple-900/40 to-purple-800/30 border-slate-700/60"
              : "bg-gradient-to-r from-purple-50 to-purple-100 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold flex items-center gap-2",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>
              <Calculator className={cn(
                "h-4 w-4",
                isDarkMode ? "text-purple-400" : "text-purple-600"
              )} />
              Price Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Test Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fromPincode" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>From Pincode (Optional)</Label>
                <Input
                  id="fromPincode"
                  value={testInputs.fromPincode}
                  onChange={(e) => setTestInputs({
                    ...testInputs,
                    fromPincode: e.target.value,
                    type: e.target.value ? 'non-dox' : 'dox', // Auto-set to non-dox when from pincode is added
                    weight: '' // Reset weight when switching modes
                  })}
                  placeholder="e.g., 110001"
                  className={cn(
                    "w-full h-9 text-sm",
                    isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                  )}
                />
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  )}>Leave empty for normal pricing</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="destinationPincode" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>Destination Pincode</Label>
                <Input
                  id="destinationPincode"
                  value={testInputs.destinationPincode}
                  onChange={(e) => setTestInputs({
                    ...testInputs,
                    destinationPincode: e.target.value
                  })}
                  placeholder="e.g., 781001"
                  className={cn(
                    "w-full h-9 text-sm",
                    isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                  )}
                />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>
                    Weight ({testInputs.fromPincode ? 'Kg.' : (testInputs.type === 'dox' ? 'grams' : 'Kg.')})
                  </Label>
                <Input
                  id="weight"
                  type="number"
                  step={testInputs.fromPincode ? "0.01" : (testInputs.type === 'dox' ? "0.1" : "0.01")}
                  value={testInputs.weight}
                  onChange={(e) => setTestInputs({
                    ...testInputs,
                    weight: e.target.value
                  })}
                  placeholder={testInputs.fromPincode ? "e.g., 25" : (testInputs.type === 'dox' ? "e.g., 250" : "e.g., 1.5")}
                  className={cn(
                    "w-full h-9 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
                    isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                  )}
                />
                </div>
                {!testInputs.fromPincode && (
                <div className="space-y-1.5">
                  <Label htmlFor="type" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>Type</Label>
                <Select
                  value={testInputs.type}
                  onValueChange={(value) => setTestInputs({
                    ...testInputs,
                    type: value,
                    weight: '' // Reset weight when type changes
                  })}
                >
                  <SelectTrigger className={cn(
                    "w-full h-9 text-sm",
                    isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200"
                  )}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    isDarkMode && "bg-slate-800 border-slate-700"
                  )}>
                    <SelectItem value="dox" className={cn(
                      isDarkMode && "text-slate-200 focus:bg-slate-700"
                    )}>DOX (Documents)</SelectItem>
                    <SelectItem value="non-dox" className={cn(
                      isDarkMode && "text-slate-200 focus:bg-slate-700"
                    )}>NON-DOX (Non-Documents)</SelectItem>
                  </SelectContent>
                </Select>
                </div>
                )}
                {testInputs.fromPincode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className={cn(
                      "text-xs font-medium",
                      isDarkMode ? "text-slate-300" : ""
                    )}>Type</Label>
                    <div className={cn(
                      "px-3 py-2 border rounded-md text-xs h-9 flex items-center",
                      isDarkMode
                        ? "bg-slate-700/50 border-slate-600 text-slate-300"
                        : "bg-gray-100 border-gray-300 text-gray-600"
                    )}>
                      NON-DOX (Reverse pricing only)
                    </div>
                  </div>
                )}
              </div>

              {/* Service Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="byAir"
                    checked={testInputs.byAir}
                    onChange={(e) => setTestInputs({
                      ...testInputs,
                      byAir: e.target.checked
                    })}
                    className={cn(
                      "h-4 w-4 focus:ring-blue-500 border-gray-300 rounded",
                      isDarkMode
                        ? "text-blue-400 border-slate-600 bg-slate-700/50"
                        : "text-blue-600"
                    )}
                    disabled={testInputs.fromPincode && testInputs.type === 'non-dox'} // Disabled for reverse pricing non-dox
                  />
                  <Label htmlFor="byAir" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>
                    By Air {testInputs.fromPincode && testInputs.type === 'non-dox' && '(Use Transport Mode below)'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="priority"
                    checked={testInputs.priority}
                    onChange={(e) => setTestInputs({
                      ...testInputs,
                      priority: e.target.checked
                    })}
                    className={cn(
                      "h-4 w-4 focus:ring-blue-500 border-gray-300 rounded",
                      isDarkMode
                        ? "text-blue-400 border-slate-600 bg-slate-700/50"
                        : "text-blue-600"
                    )}
                    disabled={testInputs.type === 'non-dox'} // Priority only for DOX
                  />
                  <Label htmlFor="priority" className={cn(
                    "text-xs font-medium",
                    isDarkMode ? "text-slate-300" : ""
                  )}>
                    Priority {testInputs.type === 'non-dox' && '(DOX only)'}
                  </Label>
                </div>
                {testInputs.fromPincode && testInputs.type === 'non-dox' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="transportMode" className={cn(
                        "text-xs font-medium",
                        isDarkMode ? "text-slate-300" : ""
                      )}>Transport Mode</Label>
                    <Select
                      value={testInputs.transportMode || 'byRoad'}
                      onValueChange={(value) => setTestInputs({
                        ...testInputs,
                        transportMode: value
                      })}
                    >
                      <SelectTrigger className={cn(
                        "w-full h-9 text-sm",
                        isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200"
                      )}>
                        <SelectValue placeholder="Select transport mode" />
                      </SelectTrigger>
                      <SelectContent className={cn(
                        isDarkMode && "bg-slate-800 border-slate-700"
                      )}>
                        <SelectItem value="byRoad" className={cn(
                          isDarkMode && "text-slate-200 focus:bg-slate-700"
                        )}>By Road (Min. Chargeable 500kg)</SelectItem>
                        <SelectItem value="byTrain" className={cn(
                          isDarkMode && "text-slate-200 focus:bg-slate-700"
                        )}>By Train (Min. Chargeable 100kg)</SelectItem>
                        <SelectItem value="byFlight" className={cn(
                          isDarkMode && "text-slate-200 focus:bg-slate-700"
                        )}>By Flight (Min. Chargeable 25kg)</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliveryType" className={cn(
                        "text-xs font-medium",
                        isDarkMode ? "text-slate-300" : ""
                      )}>Delivery Type</Label>
                      <Select
                        value={testInputs.deliveryType || 'normal'}
                        onValueChange={(value) => setTestInputs({
                          ...testInputs,
                          deliveryType: value
                        })}
                      >
                        <SelectTrigger className={cn(
                          "w-full h-9 text-sm",
                          isDarkMode && "bg-slate-700/50 border-slate-600 text-slate-200"
                        )}>
                          <SelectValue placeholder="Select delivery type" />
                        </SelectTrigger>
                        <SelectContent className={cn(
                          isDarkMode && "bg-slate-800 border-slate-700"
                        )}>
                          <SelectItem value="normal" className={cn(
                            isDarkMode && "text-slate-200 focus:bg-slate-700"
                          )}>Normal Delivery</SelectItem>
                          <SelectItem value="priority" className={cn(
                            isDarkMode && "text-slate-200 focus:bg-slate-700"
                          )}>Priority Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* Calculate Button */}
              <div className="flex justify-center pt-1">
                <Button 
                  onClick={calculatePrice}
                  className={cn(
                    "px-6 py-1.5 h-9 text-sm",
                    isDarkMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  )}
                >
                  <Calculator className="h-3.5 w-3.5 mr-1.5" />
                  Calculate Price
                </Button>
              </div>

              {/* Results */}
              {calculatedPrice !== null && (() => {
                // Calculate chargeable weight for display
                let displayChargeableWeight = parseFloat(testInputs.weight);
                let displayIsMinimumWeightApplied = false;
                
                if (testInputs.fromPincode && testInputs.type === 'non-dox') {
                  const minChargeableWeights = {
                    byRoad: 500,
                    byTrain: 100,
                    byFlight: 25
                  };
                  displayChargeableWeight = Math.max(parseFloat(testInputs.weight), minChargeableWeights[testInputs.transportMode as keyof typeof minChargeableWeights]);
                  displayIsMinimumWeightApplied = displayChargeableWeight > parseFloat(testInputs.weight);
                }
                
                return (
                  <div className={cn(
                    "border rounded-lg p-3",
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/60"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                  )}>
                    <h3 className={cn(
                      "text-base font-semibold mb-2",
                      isDarkMode ? "text-slate-200" : "text-gray-800"
                    )}>Calculation Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {testInputs.fromPincode && (
                      <div className={isDarkMode ? "text-slate-300" : ""}>
                        <span className="font-medium">From:</span> {testInputs.fromPincode}
                      </div>
                    )}
                    <div className={isDarkMode ? "text-slate-300" : ""}>
                      <span className="font-medium">To:</span> {testInputs.destinationPincode} 
                      {!testInputs.fromPincode && ` (${classifyLocation(testInputs.destinationPincode, testInputs.byAir)})`}
                      {testInputs.fromPincode && testInputs.type === 'non-dox' && (
                        isAssamPincode(testInputs.destinationPincode) ? ' (Assam)' : 
                        isNorthEastPincode(testInputs.destinationPincode) ? ' (North East)' : ''
                      )}
                    </div>
                    <div className={isDarkMode ? "text-slate-300" : ""}>
                      <span className="font-medium">Type:</span> {testInputs.type.toUpperCase()}
                    </div>
                    <div className={isDarkMode ? "text-slate-300" : ""}>
                      <span className="font-medium">Weight:</span> {testInputs.weight} {testInputs.fromPincode ? 'Kg.' : (testInputs.type === 'dox' ? 'grams' : 'Kg.')}
                      {displayIsMinimumWeightApplied && (
                        <span className={cn(
                          "ml-2",
                          isDarkMode ? "text-orange-400" : "text-orange-600"
                        )}>
                          (Charged for {displayChargeableWeight}kg - minimum chargeable weight)
                        </span>
                      )}
                    </div>
                    <div className={isDarkMode ? "text-slate-300" : ""}>
                      <span className="font-medium">Service:</span> 
                      {testInputs.priority ? ' Priority' : ''}
                      {testInputs.byAir ? ' By Air' : ''}
                      {testInputs.transportMode && testInputs.fromPincode && testInputs.type === 'non-dox' ? ` ${testInputs.transportMode}` : ''}
                      {testInputs.deliveryType && testInputs.fromPincode && testInputs.type === 'non-dox' ? ` (${testInputs.deliveryType} delivery)` : ''}
                      {!testInputs.priority && !testInputs.byAir && !testInputs.transportMode ? ' Standard' : ''}
                    </div>
                      <div className="md:col-span-2">
                        <span className={cn(
                          "font-medium",
                          isDarkMode ? "text-slate-300" : ""
                        )}>Calculated Price:</span> 
                        <span className={cn(
                          "font-bold text-base ml-2",
                          isDarkMode ? "text-green-400" : "text-green-600"
                        )}>₹{calculatedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        

        {/* Standard Service - DOX Pricing */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-slate-700/60"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>Standard Service - DOX (By Air & Surface)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-700/60"
                      : "bg-white border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Weight</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Assam</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Surface</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Air AGT IMP</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Rest of India</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "border-slate-700/60 hover:bg-slate-700/40"
                      : "border-gray-100 hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>01 gm. to 250 gm.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['01gm-250gm'].assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['01gm-250gm'].neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['01gm-250gm'].neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['01gm-250gm'].restOfIndia)}</TableCell>
                  </TableRow>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "border-slate-700/60 hover:bg-slate-700/40"
                      : "border-gray-100 hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>251 gm. to 500 gm.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['251gm-500gm'].assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['251gm-500gm'].neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['251gm-500gm'].neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing['251gm-500gm'].restOfIndia)}</TableCell>
                  </TableRow>
                  <TableRow className={cn(
                    isDarkMode
                      ? "hover:bg-slate-700/40"
                      : "hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>Add. 500 gm.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing.add500gm.assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing.add500gm.neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing.add500gm.neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.doxPricing.add500gm.restOfIndia)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className={cn(
              "px-3 py-1.5 border-t",
              isDarkMode
                ? "bg-slate-900/60 border-slate-700/60"
                : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-600"
              )}>
                Above price is excluding of Other Charge and GST 18%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NON DOX Surface Pricing */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-slate-700/60"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>NON DOX (By Surface) - Per Kg</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-700/60"
                      : "bg-white border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Weight</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Assam</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Surface</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Air AGT IMP</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Rest of India</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cn(
                    isDarkMode
                      ? "hover:bg-slate-700/40"
                      : "hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>Per Kg.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxSurfacePricing.assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxSurfacePricing.neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxSurfacePricing.neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxSurfacePricing.restOfIndia)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* NON DOX Air Pricing */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-slate-700/60"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>NON DOX (By Air) - Per Kg</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-700/60"
                      : "bg-white border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Weight</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Assam</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Surface</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Air AGT IMP</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Rest of India</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cn(
                    isDarkMode
                      ? "hover:bg-slate-700/40"
                      : "hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>Per Kg.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxAirPricing.assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxAirPricing.neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxAirPricing.neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.nonDoxAirPricing.restOfIndia)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Priority Service - DOX Pricing */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-slate-700/60"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>Priority Service - DOX (By Air & Surface)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-700/60"
                      : "bg-white border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Weight</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Assam</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Surface</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>NE By Air AGT IMP</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Rest of India</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "border-slate-700/60 hover:bg-slate-700/40"
                      : "border-gray-100 hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>01 gm. to 500 gm.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing['01gm-500gm'].assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing['01gm-500gm'].neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing['01gm-500gm'].neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing['01gm-500gm'].restOfIndia)}</TableCell>
                  </TableRow>
                  <TableRow className={cn(
                    isDarkMode
                      ? "hover:bg-slate-700/40"
                      : "hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>Every Add, 500gm.</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing.add500gm.assam)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing.add500gm.neBySurface)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing.add500gm.neByAirAgtImp)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.priorityPricing.add500gm.restOfIndia)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className={cn(
              "px-3 py-1.5 border-t",
              isDarkMode
                ? "bg-slate-900/60 border-slate-700/60"
                : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-600"
              )}>
                Above price is excluding of Other Charge and GST 18%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reverse Pricing */}
        <Card className={cn(
          "border shadow-md",
          isDarkMode 
            ? "border-slate-700/60 bg-slate-800/60" 
            : "border-gray-200 bg-white"
        )}>
          <CardHeader className={cn(
            "border-b py-2.5",
            isDarkMode
              ? "bg-gradient-to-r from-green-900/40 to-emerald-900/30 border-slate-700/60"
              : "bg-gradient-to-r from-green-50 to-emerald-50 border-gray-200"
          )}>
            <CardTitle className={cn(
              "text-base font-semibold",
              isDarkMode ? "text-slate-200" : "text-gray-800"
            )}>Reverse Pricing - From Rest of India to Guwahati/Assam and North East</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/60 border-slate-700/60"
                      : "bg-white border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Destination</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )} colSpan={2}>
                      By Road (Min. Chargeable 500kg)
                    </TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )} colSpan={2}>
                      By Train (Min. Chargeable 100kg)
                    </TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )} colSpan={2}>
                      By Flight (Min. Chargeable 25kg)
                    </TableHead>
                  </TableRow>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "bg-slate-900/80 border-slate-700/60"
                      : "bg-gray-50 border-gray-200"
                  )}>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}></TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )}>Normal Delivery</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Priority Delivery</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )}>Normal Delivery</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Priority Delivery</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300 text-gray-700"
                    )}>Normal Delivery</TableHead>
                    <TableHead className={cn(
                      "font-medium text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    )}>Priority Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={cn(
                    "border-b",
                    isDarkMode
                      ? "border-slate-700/60 hover:bg-slate-700/40"
                      : "border-gray-100 hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>To Guwahati (Assam)</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byRoad.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byRoad.priority)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byTrain.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byTrain.priority)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byFlight.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toAssam.byFlight.priority)}</TableCell>
                  </TableRow>
                  <TableRow className={cn(
                    isDarkMode
                      ? "hover:bg-slate-700/40"
                      : "hover:bg-gray-50"
                  )}>
                    <TableCell className={cn(
                      "font-medium text-xs py-1.5",
                      isDarkMode ? "text-slate-300" : ""
                    )}>To North East (6 States)</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byRoad.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byRoad.priority)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byTrain.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byTrain.priority)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center border-l",
                      isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byFlight.normal)}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-1.5 text-center",
                      isDarkMode ? "text-slate-300" : ""
                    )}>{formatPrice(pricingData.reversePricing.toNorthEast.byFlight.priority)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className={cn(
              "px-3 py-1.5 border-t",
              isDarkMode
                ? "bg-slate-900/60 border-slate-700/60"
                : "bg-gray-50 border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-slate-400" : "text-gray-600"
              )}>
                <strong className={isDarkMode ? "text-slate-300" : ""}>Minimum Chargeable Weight:</strong> By Road - 500kg, By Train - 100kg, By Flight - 25kg
              </p>
              <p className={cn(
                "text-xs mt-1",
                isDarkMode ? "text-slate-400" : "text-gray-600"
              )}>
                Above price is excluding of Other Charge and GST 18%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorporatePricingDisplay;
