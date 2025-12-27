import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdminLoggedIn, storeAuthData, clearAuthData } from "@/utils/auth";
import adminIllustration from "@/assets/admin-login.png";
import oclLogo from "@/assets/ocl-logo.png";

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if admin is already logged in
  useEffect(() => {
    if (isAdminLoggedIn()) {
      // Still logged in, redirect to dashboard
      navigate('/admin/dashboard');
    } else {
      // Token expired or not logged in, clear any stale data
      clearAuthData();
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data for persistent login
        storeAuthData(data.token, data.admin);
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.admin.name}! You will stay logged in until you logout.`,
        });
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .button-medicine {
          background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
          border: 0;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          display: inline-block;
          font-family: system-ui,-apple-system,system-ui,"Segoe UI",Roboto,Ubuntu,"Helvetica Neue",sans-serif;
          font-size: 15px;
          font-weight: 600;
          outline: 0;
          padding: 10px 40px;
          position: relative;
          text-align: center;
          text-decoration: none;
          transition: all .3s;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .button-medicine:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
          background: linear-gradient(135deg, #4F9FF9 0%, #2563EB 100%);
        }

        .button-medicine:active:not(:disabled) {
          transform: translateY(0);
        }

        .button-medicine:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (min-width: 768px) {
          .button-medicine {
            padding: 11px 48px;
            font-size: 16px;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10 font-sans">
      <div className="relative w-full max-w-5xl">
        <div className="absolute top-0 left-[72%] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="h-24 w-24 rounded-full bg-white shadow-[0_12px_34px_rgba(0,0,0,0.15)] flex items-center justify-center border border-white/70">
            <img
              src={oclLogo}
              alt="OCL logo"
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>
        <Card
          className="w-full rounded-[28px] border border-gray-100 overflow-hidden bg-white"
          style={{ boxShadow: 'rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[45%_55%]">
          <div className="relative bg-[#0b1b3c] flex items-center justify-center overflow-hidden">
            <img
              src={adminIllustration}
              alt="Admin login illustration"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white p-10 md:p-14 flex flex-col justify-center items-center">
            <div className="space-y-3 text-center w-full">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md px-10 space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder=" "
                  aria-label="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="peer h-12 w-full rounded-none border-0 border-b border-gray-300 bg-transparent px-0 text-gray-800 placeholder-transparent focus:border-gray-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                />
                <label
                  htmlFor="email"
                  className="pointer-events-none absolute left-0 top-0 text-xs text-gray-600 transition-all duration-150
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500
                    peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-xs peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Email ID
                </label>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="peer h-12 w-full rounded-none border-0 border-b border-gray-300 bg-transparent pr-12 px-0 text-gray-800 placeholder-transparent focus:border-gray-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                />
                <label
                  htmlFor="password"
                  className="pointer-events-none absolute left-0 top-0 text-xs text-gray-600 transition-all duration-150
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500
                    peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-xs peer-focus:text-blue-600
                    peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1 peer-[&:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between -mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="flex justify-center w-full -mt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="button-medicine"
                  role="button"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    'Log In'
                  )}
                </button>
              </div>

              <div className="pt-4 text-sm text-gray-500">
                <div className="flex flex-wrap gap-3 justify-center text-xs">
                  <span 
                    className="underline cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Terms & Conditions",
                        description: "Redirecting to Terms & Conditions...",
                      });
                    }}
                  >
                    Terms & Conditions
                  </span>
                  <span className="text-gray-300">|</span>
                  <span 
                    className="underline cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Privacy Policy",
                        description: "Redirecting to Privacy Policy...",
                      });
                    }}
                  >
                    Privacy Policy
                  </span>
                  <span className="text-gray-300">|</span>
                  <span 
                    className="underline cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      toast({
                        title: "Help Center",
                        description: "Redirecting to Help Center...",
                      });
                    }}
                  >
                    Help Center
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default AdminLogin;
