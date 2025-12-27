import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, FileText, Trash2 } from 'lucide-react';

interface AdditionalCharge {
  id: string;
  description: string;
  amount: string;
}

interface QuotationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  origin: string;
  destination: string;
  weight: string;
  ratePerKg: string;
  gstRate: string;
  additionalCharges: AdditionalCharge[];
}

const SingleQuotation = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<QuotationFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    origin: '',
    destination: '',
    weight: '',
    ratePerKg: '',
    gstRate: '',
    additionalCharges: []
  });

  const handleInputChange = (field: keyof QuotationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocus = (field: string) => {
    setFocusedFields(prev => new Set(prev).add(field));
  };

  const handleBlur = (field: string, value: string) => {
    if (!value) {
      setFocusedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const isFloating = (field: string, value: string) => {
    return focusedFields.has(field) || !!value;
  };

  const addAdditionalCharge = () => {
    const newCharge: AdditionalCharge = {
      id: Date.now().toString(),
      description: '',
      amount: ''
    };
    setFormData(prev => ({
      ...prev,
      additionalCharges: [...prev.additionalCharges, newCharge]
    }));
  };

  const removeAdditionalCharge = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter(charge => charge.id !== id)
    }));
  };

  const updateAdditionalCharge = (id: string, field: keyof AdditionalCharge, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.map(charge =>
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    }));
  };

  const calculateTotal = () => {
    const weight = parseFloat(formData.weight) || 0;
    const ratePerKg = parseFloat(formData.ratePerKg) || 0;
    const gstRate = parseFloat(formData.gstRate) || 0;
    
    const baseAmount = weight * ratePerKg;
    const additionalChargesTotal = formData.additionalCharges.reduce((sum, charge) => {
      return sum + (parseFloat(charge.amount) || 0);
    }, 0);
    
    const subtotal = baseAmount + additionalChargesTotal;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;
    
    return {
      baseAmount: baseAmount.toFixed(2),
      additionalChargesTotal: additionalChargesTotal.toFixed(2),
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerName || !formData.customerEmail || !formData.origin || !formData.destination || !formData.weight) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/generate-quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Quotation Sent",
          description: `Quotation PDF has been sent to ${formData.customerEmail}`,
        });
        
        // Reset form
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          origin: '',
          destination: '',
          weight: '',
          ratePerKg: '',
          gstRate: '',
          additionalCharges: []
        });
        setFocusedFields(new Set());
      } else {
        throw new Error(result.error || 'Failed to generate quotation');
      }
    } catch (error) {
      console.error('Error generating quotation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate quotation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculations = calculateTotal();

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-4">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 sm:p-3">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-1.5 sm:gap-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-sm sm:text-base">Quick Quotation Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Customer & Service Info - Mobile Optimized */}
            {/* First Row: Customer Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="customerName"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('customerName', formData.customerName)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  onFocus={() => handleFocus('customerName')}
                  onBlur={() => handleBlur('customerName', formData.customerName)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                  required
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="customerEmail"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('customerEmail', formData.customerEmail)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  onFocus={() => handleFocus('customerEmail')}
                  onBlur={() => handleBlur('customerEmail', formData.customerEmail)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                  required
                />
              </div>
            </div>

            {/* Second Row: Phone and Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="customerPhone"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('customerPhone', formData.customerPhone)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Phone
                </label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  onFocus={() => handleFocus('customerPhone')}
                  onBlur={() => handleBlur('customerPhone', formData.customerPhone)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="weight"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('weight', formData.weight)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  onFocus={() => handleFocus('weight')}
                  onBlur={() => handleBlur('weight', formData.weight)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                  required
                />
              </div>
            </div>

            {/* Origin & Destination - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="origin"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('origin', formData.origin)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Origin <span className="text-red-500">*</span>
                </label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  onFocus={() => handleFocus('origin')}
                  onBlur={() => handleBlur('origin', formData.origin)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                  required
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="destination"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('destination', formData.destination)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Destination <span className="text-red-500">*</span>
                </label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onFocus={() => handleFocus('destination')}
                  onBlur={() => handleBlur('destination', formData.destination)}
                  className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4"
                  required
                />
              </div>
            </div>

            {/* Pricing - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="ratePerKg"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('ratePerKg', formData.ratePerKg)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  Rate/kg (₹)
                </label>
                <div className="relative">
                  <Input
                    id="ratePerKg"
                    type="number"
                    step="0.01"
                    value={formData.ratePerKg}
                    onChange={(e) => handleInputChange('ratePerKg', e.target.value)}
                    onFocus={() => handleFocus('ratePerKg')}
                    onBlur={() => handleBlur('ratePerKg', formData.ratePerKg)}
                    className="h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-4 pr-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  {isFloating('ratePerKg', formData.ratePerKg) && (
                    <span className="absolute right-3 text-sm text-gray-400 pointer-events-none z-10" style={{ top: '1rem', lineHeight: '1.25rem' }}>
                      .00
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <label
                  htmlFor="gstRate"
                  className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                    isFloating('gstRate', formData.gstRate)
                      ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                      : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                  }`}
                >
                  GST (%)
                </label>
                <Select
                  value={formData.gstRate}
                  onValueChange={(value) => {
                    handleInputChange('gstRate', value);
                    handleFocus('gstRate');
                  }}
                  onOpenChange={(open) => {
                    if (open) {
                      handleFocus('gstRate');
                    } else if (!formData.gstRate) {
                      handleBlur('gstRate', formData.gstRate);
                    }
                  }}
                >
                  <SelectTrigger
                    id="gstRate"
                    className={`h-11 sm:h-10 text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 ${
                      isFloating('gstRate', formData.gstRate) ? 'pt-4' : ''
                    }`}
                  >
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Charges Section */}
            <div className="space-y-4">
              <div>
                <Button
                  type="button"
                  onClick={addAdditionalCharge}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 h-4 text-xs font-medium shadow-sm"
                >
                  Add Charge
                </Button>
              </div>
              
              {formData.additionalCharges.map((charge, index) => (
                <div key={charge.id} className="flex items-center gap-3 w-full">
                  <div className="relative flex-1">
                    <label
                      className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                        isFloating(`charge-desc-${charge.id}`, charge.description)
                          ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                          : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                      }`}
                    >
                      Description
                    </label>
                    <Input
                      value={charge.description}
                      onChange={(e) => updateAdditionalCharge(charge.id, 'description', e.target.value)}
                      onFocus={() => handleFocus(`charge-desc-${charge.id}`)}
                      onBlur={() => handleBlur(`charge-desc-${charge.id}`, charge.description)}
                      className="h-8 w-full text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-3"
                    />
                  </div>
                  <div className="relative flex-1">
                    <label
                      className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
                        isFloating(`charge-amount-${charge.id}`, charge.amount)
                          ? 'top-0 text-xs text-gray-400 bg-white px-1 -translate-y-1/2'
                          : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                      }`}
                    >
                      Amount (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.amount}
                      onChange={(e) => updateAdditionalCharge(charge.id, 'amount', e.target.value)}
                      onFocus={() => handleFocus(`charge-amount-${charge.id}`)}
                      onBlur={() => handleBlur(`charge-amount-${charge.id}`, charge.amount)}
                      className="h-8 w-full text-sm shadow-sm border-gray-200 focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 pt-3"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalCharge(charge.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer p-1 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cost Calculation - Modern Design */}
            {formData.weight && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl shadow-sm border border-green-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Base Amount</span>
                    <span className="font-semibold text-gray-800">₹{calculations.baseAmount}</span>
                  </div>
                  
                  {formData.additionalCharges.length > 0 && (
                    <>
                      {formData.additionalCharges.map((charge, index) => (
                        <div key={charge.id} className="flex items-center text-xs">
                          <span className="text-gray-600">Charge {index + 1}:</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Additional Charges Total</span>
                        <span className="font-semibold text-gray-800">₹{calculations.additionalChargesTotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-green-200 pt-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-800">₹{calculations.subtotal}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">GST ({formData.gstRate}%)</span>
                    <span className="font-semibold text-gray-800">₹{calculations.gstAmount}</span>
                  </div>
                  
                  <div className="border-t border-green-200 mt-3 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-gray-800">Total Amount</span>
                      <span className="font-bold text-base text-green-600">₹{calculations.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 h-12 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Generate Quotation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleQuotation;
