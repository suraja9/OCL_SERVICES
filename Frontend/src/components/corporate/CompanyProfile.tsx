import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  FileText,
  AlertCircle,
  Loader2,
  Building2
} from "lucide-react";

interface CorporateProfile {
  id: string;
  corporateId: string;
  companyName: string;
  concernName?: string;
  email: string;
  contactNumber: string;
  companyAddress: string;
  flatNumber?: string;
  landmark?: string;
  city: string;
  state: string;
  pin: string;
  locality: string;
  gstNumber?: string;
  logo?: string;
  registrationDate: string;
  lastLogin: string;
  isActive: boolean;
}

interface CompanyProfileProps {
  onLogoUpdate?: (logoUrl: string) => void;
  isDarkMode?: boolean;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ isDarkMode = false }) => {
  const [profile, setProfile] = useState<CorporateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('corporateToken');
      const response = await fetch('/api/corporate/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.corporate);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load company profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center h-64 -m-4 md:-m-6 p-4",
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" 
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-md",
          isDarkMode 
            ? "bg-slate-800/80 border border-slate-700/60" 
            : "bg-white"
        )}>
          <Loader2 className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 animate-spin",
            isDarkMode ? "text-blue-400" : "text-blue-600"
          )} />
          <span className={cn(
            "text-sm sm:text-base",
            isDarkMode ? "text-slate-200" : "text-gray-700"
          )}>Loading company profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={cn(
        "flex items-center justify-center h-64 -m-4 md:-m-6 p-4",
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" 
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-md",
          isDarkMode 
            ? "bg-slate-800/80 border border-slate-700/60" 
            : "bg-white"
        )}>
          <AlertCircle className={cn(
            "h-5 w-5 sm:h-6 sm:w-6",
            isDarkMode ? "text-red-400" : "text-red-600"
          )} />
          <span className={cn(
            "text-sm sm:text-base",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}>Failed to load company profile</span>
        </div>
      </div>
    );
  }

  return (
    <div className="md:-m-6 !max-h-[90vh] md:min-h-[calc(100vh-3rem)] md:p-6 md:flex md:justify-center">
      <div className="w-full max-w-[95rem] px-0 md:px-32 py-0 md:py-6 h-fit">
      {/* Single Consolidated Card */}
      <Card className={cn(
        "bg-transparent shadow-none border-0 rounded-none md:rounded-lg m-0 w-full h-fit min-h-0",
        isDarkMode 
          ? "md:bg-slate-800/80 md:border md:border-blue-500/40 md:shadow-[0_12px_35px_rgba(37,99,235,0.18)]" 
          : "md:bg-white md:border md:border-blue-400/40 md:shadow-[0_18px_45px_rgba(59,130,246,0.18)]"
      )}>
        
        <CardContent className="space-y-2 md:space-y-6 !p-0 md:!p-12 lg:!p-16 min-h-0">
          {/* Company Logo Display */}
          <div className={cn(
            "relative flex items-center justify-between pb-1 md:pb-3 mb-1 md:mb-3",
            isDarkMode 
              ? "border-b border-slate-700/60" 
              : "border-b border-gray-200"
          )}>
            {/* Corporate ID on the left */}
            <div className="flex flex-col">
              <Label className={cn(
                "text-xs sm:text-sm font-medium mb-1",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Company ID : </Label>
              <div className={cn(
                "text-[11px] sm:text-xs font-bold",
                isDarkMode ? "text-slate-200" : "text-gray-700"
              )}>
                {profile.corporateId}
              </div>
            </div>
            
            {/* Logo in the center */}
            <div className="flex flex-col items-center gap-2">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt="Company Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-xl shadow-md"
                />
              ) : (
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl shadow-md flex items-center justify-center",
                  isDarkMode 
                    ? "bg-gradient-to-br from-slate-700 to-slate-800" 
                    : "bg-gradient-to-br from-gray-100 to-gray-200"
                )}>
                  <Building2 className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
                    isDarkMode ? "text-slate-400" : "text-gray-400"
                  )} />
                </div>
              )}
            </div>
            
            {/* Badge on the right */}
            <Badge 
              variant={profile.isActive ? "default" : "destructive"}
              className={`text-[10px] sm:text-xs shadow-sm ${
                profile.isActive 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200' 
                  : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-red-200'
              }`}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {/* Company Name */}
            <div className="space-y-1">
              <Label htmlFor="companyName" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Company Name :</Label>
              <Input
                id="companyName"
                value={profile.companyName}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Concern Name */}
            <div className="space-y-1">
              <Label htmlFor="concernName" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Concern Name :</Label>
              <Input
                id="concernName"
                value={profile.concernName || ''}
                disabled
                placeholder="Not provided"
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Email */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label htmlFor="email" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Email :</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="contactNumber" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Contact Number :</Label>
              <Input
                id="contactNumber"
                value={profile.contactNumber}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* GST Number */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="gstNumber" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>GST Number :</Label>
              <Input
                id="gstNumber"
                value={profile.gstNumber || ''}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Company Address */}
            <div className="space-y-1 col-span-2 sm:col-span-2 md:col-span-1">
              <Label htmlFor="companyAddress" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Company Address :</Label>
              <Input
                id="companyAddress"
                value={profile.companyAddress}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Flat Number */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="flatNumber" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Flat/Building No. :</Label>
              <Input
                id="flatNumber"
                value={profile.flatNumber || ''}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Landmark */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="landmark" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Landmark :</Label>
              <Input
                id="landmark"
                value={profile.landmark || ''}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Locality */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="locality" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Locality :</Label>
              <Input
                id="locality"
                value={profile.locality}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* City */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="city" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>City :</Label>
              <Input
                id="city"
                value={profile.city}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* State */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="state" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>State :</Label>
              <Input
                id="state"
                value={profile.state}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Pin Code */}
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="pin" className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Pin Code :</Label>
              <Input
                id="pin"
                value={profile.pin}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Registration Date */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Registration Date :</Label>
              <Input
                value={formatDate(profile.registrationDate)}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>

            {/* Last Login */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className={cn(
                "text-xs sm:text-sm font-medium",
                isDarkMode ? "text-slate-300" : "text-gray-700"
              )}>Last Login :</Label>
              <Input
                value={formatDateTime(profile.lastLogin)}
                disabled
                className={cn(
                  "h-auto text-[11px] sm:text-xs bg-transparent p-0 shadow-none border-0 focus:shadow-none",
                  isDarkMode ? "text-slate-200" : "text-gray-900"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default CompanyProfile;
