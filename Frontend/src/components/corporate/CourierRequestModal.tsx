import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  Package,
  CheckCircle,
  AlertCircle,
  Weight,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CourierRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateName: string;
  corporateContact: string;
  isDarkMode?: boolean;
}

const CourierRequestModal: React.FC<CourierRequestModalProps> = ({
  isOpen,
  onClose,
  corporateName,
  corporateContact,
  isDarkMode = false
}) => {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    urgency: 'normal',
    specialInstructions: '',
    packageCount: '',
    weight: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare payload and log before sending
    // Use corporate name and contact automatically
    const payload: any = {
      ...formData,
      contactPerson: corporateName,
      contactPhone: corporateContact,
      packageCount: parseInt(formData.packageCount) || 1
    };
    if (!formData.pickupAddress.trim()) {
      delete payload.pickupAddress;
    }
    if (!formData.specialInstructions.trim()) {
      delete payload.specialInstructions;
    }
    console.log('Form data being sent:', payload);

    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch('/api/corporate/request-courier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setIsSubmitted(true);
        
        toast({
          title: "Courier Request Submitted!",
          description: `Request ID: ${result.requestId}. We will send a courier boy to your location shortly. You will receive a confirmation call within 10 minutes.`,
          duration: 5000,
        });

        // Log the request for admin notification
        console.log('🚚 Courier Request Submitted:', {
          corporate: corporateName,
          timestamp: new Date().toISOString(),
          requestId: result.requestId,
          request: payload
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

    } catch (error) {
      console.error('Courier request error:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit courier request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSubmitted(false);
      setFormData({
        pickupAddress: '',
        urgency: 'normal',
        specialInstructions: '',
        packageCount: '',
        weight: ''
      });
      onClose();
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isDarkMode && "bg-slate-900 border-slate-700"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center",
              isDarkMode ? "text-green-400" : "text-green-600"
            )}>
              <CheckCircle className="h-5 w-5 mr-2" />
              Request Submitted Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <div className={cn(
                "p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center",
                isDarkMode ? "bg-green-900/30" : "bg-green-100"
              )}>
                <Truck className={cn("h-8 w-8", isDarkMode ? "text-green-400" : "text-green-500")} />
              </div>
              <h3 className={cn(
                "text-lg font-semibold mb-2",
                isDarkMode ? "text-slate-200" : "text-gray-800"
              )}>
                Courier Request Confirmed
              </h3>
              <p className={cn("mb-4", isDarkMode ? "text-slate-300" : "text-gray-600")}>
                We have received your courier request for <strong className={isDarkMode ? "text-slate-100" : "text-gray-900"}>{corporateName}</strong>. 
                Our team will dispatch a courier boy to your location shortly.
              </p>
              <div className={cn(
                "border rounded-lg p-3 mb-4",
                isDarkMode ? "bg-blue-900/30 border-blue-700/50" : "bg-blue-50 border-blue-200"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isDarkMode ? "text-blue-300" : "text-blue-800"
                )}>
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">You will receive a confirmation call within 10 minutes</span>
                </div>
              </div>
              <div className={cn(
                "border rounded-lg p-3",
                isDarkMode ? "bg-yellow-900/30 border-yellow-700/50" : "bg-yellow-50 border-yellow-200"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isDarkMode ? "text-yellow-300" : "text-yellow-800"
                )}>
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please keep your phone accessible for the courier call</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-md max-h-[80vh] overflow-y-auto rounded-xl shadow-xl",
        isDarkMode && "bg-slate-900 border-slate-700"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center",
            isDarkMode ? "text-blue-400" : "text-blue-600"
          )}>
            <Truck className="h-5 w-5 mr-2" />
            Request For Pickup
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Floating Label Input Component */}
          <div className="relative">
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                className={cn(
                  "h-12 pt-5 px-3 text-sm border rounded-md focus:border-blue-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode && "bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-400"
                )}
              />
            <Label 
              htmlFor="pickupAddress"
              className={cn(
                "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
                formData.pickupAddress 
                  ? cn(
                      "-top-2 text-xs font-medium px-1",
                      isDarkMode 
                        ? "text-blue-400 bg-slate-900" 
                        : "text-blue-600 bg-white"
                    )
                  : cn(
                      "top-4 text-sm",
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    )
              )}
            >
              <MapPin className={cn("h-3 w-3 inline mr-1", isDarkMode ? "text-blue-400" : "text-blue-500")} />
              Pickup Address (optional)
            </Label>
          </div>


          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Input
                id="packageCount"
                type="number"
                min="1"
                max="50"
                value={formData.packageCount}
                onChange={(e) => setFormData(prev => ({ ...prev, packageCount: e.target.value }))}
                className={cn(
                  "h-12 pt-5 px-3 text-sm border rounded-md focus:border-blue-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode && "bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-400"
                )}
              />
              <Label 
                htmlFor="packageCount"
                className={cn(
                  "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
                  formData.packageCount 
                    ? cn(
                        "-top-2 text-xs font-medium px-1",
                        isDarkMode 
                          ? "text-blue-400 bg-slate-900" 
                          : "text-blue-600 bg-white"
                      )
                    : cn(
                        "top-4 text-sm",
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      )
                )}
              >
                <Package className={cn("h-3 w-3 inline mr-1", isDarkMode ? "text-blue-400" : "text-blue-500")} />
                Number of Packages
              </Label>
            </div>
            
            <div className="relative">
              <Input
                id="weight"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                required
                className={cn(
                  "h-12 pt-5 px-3 text-sm border rounded-md focus:border-blue-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isDarkMode && "bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-400"
                )}
              />
              <Label 
                htmlFor="weight"
                className={cn(
                  "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
                  formData.weight 
                    ? cn(
                        "-top-2 text-xs font-medium px-1",
                        isDarkMode 
                          ? "text-blue-400 bg-slate-900" 
                          : "text-blue-600 bg-white"
                      )
                    : cn(
                        "top-4 text-sm",
                        isDarkMode ? "text-slate-400" : "text-gray-500"
                      )
                )}
              >
                <Weight className={cn("h-3 w-3 inline mr-1", isDarkMode ? "text-blue-400" : "text-blue-500")} />
                Weight (kg) *
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isDarkMode ? "text-slate-300" : "text-gray-700"
            )}>
              <Clock className={cn("h-4 w-4", isDarkMode ? "text-blue-400" : "text-blue-500")} />
              Urgency
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={formData.urgency === 'normal' ? "default" : "outline"}
                className={cn(
                  "h-9 text-sm",
                  formData.urgency === 'normal' ? "bg-blue-600 hover:bg-blue-700" : "",
                  isDarkMode && formData.urgency !== 'normal' && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                )}
                onClick={() => setFormData(prev => ({ ...prev, urgency: 'normal' }))}
              >
                Normal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.urgency === 'urgent' ? "default" : "outline"}
                className={cn(
                  "h-9 text-sm",
                  formData.urgency === 'urgent' ? "bg-orange-600 hover:bg-orange-700" : "",
                  isDarkMode && formData.urgency !== 'urgent' && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                )}
                onClick={() => setFormData(prev => ({ ...prev, urgency: 'urgent' }))}
              >
                Urgent
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.urgency === 'immediate' ? "default" : "outline"}
                className={cn(
                  "h-9 text-sm",
                  formData.urgency === 'immediate' ? "bg-red-600 hover:bg-red-700" : "",
                  isDarkMode && formData.urgency !== 'immediate' && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                )}
                onClick={() => setFormData(prev => ({ ...prev, urgency: 'immediate' }))}
              >
                Immediate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions" className={cn(
              "text-sm font-medium flex items-center gap-2",
              isDarkMode ? "text-slate-300" : "text-gray-700"
            )}>
              <Truck className={cn("h-4 w-4", isDarkMode ? "text-blue-400" : "text-blue-500")} />
              Special Instructions
            </Label>
            <Select
              value={formData.specialInstructions}
              onValueChange={(value) => setFormData(prev => ({ ...prev, specialInstructions: value }))}
            >
              <SelectTrigger className={cn(
                "h-12 w-full",
                isDarkMode && "bg-slate-800 border-slate-600 text-slate-200"
              )}>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? "bg-slate-800 border-slate-700" : ""}>
                <SelectItem 
                  value="Send 2 Wheeler Vehicle"
                  className={isDarkMode ? "text-slate-200 focus:bg-slate-700" : ""}
                >
                  Send 2 Wheeler Vehicle
                </SelectItem>
                <SelectItem 
                  value="Send 3 Wheeler Vehicle"
                  className={isDarkMode ? "text-slate-200 focus:bg-slate-700" : ""}
                >
                  Send 3 Wheeler Vehicle
                </SelectItem>
                <SelectItem 
                  value="Send 4 Wheeler Vehicle"
                  className={isDarkMode ? "text-slate-200 focus:bg-slate-700" : ""}
                >
                  Send 4 Wheeler Vehicle
                </SelectItem>
                <SelectItem 
                  value="Send 6 Wheeler Vehicle"
                  className={isDarkMode ? "text-slate-200 focus:bg-slate-700" : ""}
                >
                  Send 6 Wheeler Vehicle
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={cn(
            "rounded-md p-3",
            isDarkMode ? "bg-blue-900/30 border border-blue-700/50" : "bg-blue-50"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              isDarkMode ? "text-blue-300" : "text-blue-800"
            )}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Response time: 10-15 minutes</span>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className={cn(
                "h-9 text-sm",
                isDarkMode && "border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Request Courier
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourierRequestModal;