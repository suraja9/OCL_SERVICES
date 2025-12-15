import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import oclLogo from "@/assets/ocl-logo.png";
import corporateBackground from "@/assets/corporate-1.jpg";

const CorporateLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if corporate is already logged in
  useEffect(() => {
    const token = localStorage.getItem('corporateToken');
    const corporateInfo = localStorage.getItem('corporateInfo');
    
    if (token && corporateInfo) {
      try {
        const corporate = JSON.parse(corporateInfo);
        // Check if it's first login
        if (corporate.isFirstLogin) {
          navigate('/corporate/change-password');
        } else {
          navigate('/corporate/dashboard');
        }
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('corporateToken');
        localStorage.removeItem('corporateInfo');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/corporate/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        localStorage.setItem('corporateToken', data.token);
        localStorage.setItem('corporateInfo', JSON.stringify(data.corporate));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.corporate.companyName}!`,
        });
        
        // Check if it's first login
        if (data.corporate.isFirstLogin) {
          navigate('/corporate/change-password');
        } else {
          navigate('/corporate/dashboard');
        }
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
        .button-71 {
          background-color: #FFC966;
          border: 0;
          border-radius: 56px;
          color: #fff;
          cursor: pointer;
          display: inline-block;
          font-family: system-ui,-apple-system,system-ui,"Segoe UI",Roboto,Ubuntu,"Helvetica Neue",sans-serif;
          font-size: 14px;
          font-weight: 600;
          outline: 0;
          padding: 8px 32px;
          position: relative;
          text-align: center;
          text-decoration: none;
          transition: all .3s;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .button-71:before {
          background-color: initial;
          background-image: linear-gradient(#fff 0, rgba(255, 255, 255, 0) 100%);
          border-radius: 125px;
          content: "";
          height: 50%;
          left: 4%;
          opacity: .5;
          position: absolute;
          top: 0;
          transition: all .3s;
          width: 92%;
        }

        .button-71:hover:not(:disabled) {
          box-shadow: rgba(255, 255, 255, .2) 0 3px 15px inset, rgba(0, 0, 0, .1) 0 3px 5px, rgba(0, 0, 0, .1) 0 10px 13px;
          transform: scale(1.05);
        }

        .button-71:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (min-width: 768px) {
          .button-71 {
            padding: 10px 40px;
          }
        }
      `}</style>
      <div 
        className="min-h-screen flex items-center justify-center p-6 relative"
        style={{ 
          backgroundImage: `url(${corporateBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      
      {/* Centered Login Card */}
      <div 
        className="relative z-10 rounded-2xl shadow-2xl px-8 pt-16 pb-0 w-full max-w-lg flex flex-col justify-center backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: 'rgb(38, 57, 77) 0px 20px 30px -10px',
          minHeight: '500px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Logo - Floating at border */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20">
          <div 
            className="inline-flex items-center justify-center p-2 rounded-full bg-white shadow-lg w-fit border-2 border-white"
            style={{
              boxShadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px'
            }}
          >
            <img src={oclLogo} alt="OCL Logo" className="h-24 w-24 object-contain rounded-full" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ fontWeight: 700, color: '#000000' }}>
          Corporate Login
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4">
            {/* Email / Username field */}
            <div className="input-group relative w-8/12 mx-auto" style={{ marginBottom: '22px' }}>
              <input
                id="email"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className="w-full block px-0 text-sm bg-transparent focus:outline-none transition-all duration-300 ease-in-out"
                style={{ 
                  fontSize: '14px',
                  height: '32px',
                  paddingTop: '8px',
                  paddingBottom: '4px',
                  border: 'none',
                  borderBottom: emailFocused ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  borderRadius: '0',
                  boxShadow: 'none',
                  color: '#000000'
                }}
                required
                disabled={isLoading}
              />
              <label
                htmlFor="email"
                className="absolute left-0 transition-all duration-300 ease-in-out pointer-events-none"
                style={{
                  top: emailFocused || username ? '-16px' : '50%',
                  transform: emailFocused || username ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: emailFocused || username ? '12px' : '14px',
                  color: emailFocused ? '#3B82F6' : '#000000',
                  backgroundColor: 'transparent',
                  marginBottom: emailFocused || username ? '4px' : '0'
                }}
              >
                Email ID:
              </label>
              <div 
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-in-out"
                style={{
                  width: emailFocused ? '100%' : '0%',
                  backgroundColor: '#3B82F6',
                  transform: emailFocused ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left'
                }}
              />
            </div>

            {/* Password field */}
            <div className="input-group relative w-8/12 mx-auto" style={{ marginBottom: '12px' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="w-full block pr-10 px-0 text-sm bg-transparent focus:outline-none transition-all duration-300 ease-in-out"
                style={{ 
                  fontSize: '14px',
                  height: '32px',
                  paddingTop: '8px',
                  paddingBottom: '4px',
                  border: 'none',
                  borderBottom: passwordFocused ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  borderRadius: '0',
                  boxShadow: 'none',
                  color: '#000000'
                }}
                required
                disabled={isLoading}
              />
              <label
                htmlFor="password"
                className="absolute left-0 transition-all duration-300 ease-in-out pointer-events-none"
                style={{
                  top: passwordFocused || password ? '-16px' : '50%',
                  transform: passwordFocused || password ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: passwordFocused || password ? '12px' : '14px',
                  color: passwordFocused ? '#3B82F6' : '#000000',
                  backgroundColor: 'transparent',
                  marginBottom: passwordFocused || password ? '4px' : '0'
                }}
              >
                Password:
              </label>
              <div 
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-in-out"
                style={{
                  width: passwordFocused ? '100%' : '0%',
                  backgroundColor: '#3B82F6',
                  transform: passwordFocused ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute transition-colors duration-200 flex items-center justify-center"
                style={{
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#000000',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" style={{ color: '#000000' }} /> : <Eye className="h-5 w-5" style={{ color: '#000000' }} />}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Password in same line */}
          <div className="mb-4 flex items-center justify-between w-8/12 mx-auto -mt-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 focus:ring-2 cursor-pointer"
                style={{ 
                  width: '12px', 
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  flexShrink: 0
                }}
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer" style={{ color: '#000000' }}>
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                // TODO: Implement forgot password functionality
                toast({
                  title: "Forgot Password",
                  description: "Please contact your administrator to reset your password.",
                });
              }}
              className="text-sm hover:underline"
              style={{ color: '#000000' }}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mb-4 mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="button-71"
              role="button"
            >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </span>
            ) : (
              'Submit'
            )}
            </button>
          </div>

          {/* Footer Links */}
          <div className="pt-2 text-sm text-gray-600">
            <div className="flex flex-wrap gap-3 justify-center text-xs">
              <span 
                className="underline cursor-pointer hover:text-gray-900"
                style={{ color: '#000000' }}
                onClick={() => {
                  // TODO: Navigate to Terms & Conditions page
                  toast({
                    title: "Terms & Conditions",
                    description: "Redirecting to Terms & Conditions...",
                  });
                }}
              >
                Terms & Conditions
              </span>
              <span className="text-gray-400" style={{ color: '#000000' }}>|</span>
              <span 
                className="underline cursor-pointer hover:text-gray-900"
                style={{ color: '#000000' }}
                onClick={() => {
                  // TODO: Navigate to Privacy Policy page
                  toast({
                    title: "Privacy Policy",
                    description: "Redirecting to Privacy Policy...",
                  });
                }}
              >
                Privacy Policy
              </span>
              <span className="text-gray-400" style={{ color: '#000000' }}>|</span>
              <span 
                className="underline cursor-pointer hover:text-gray-900"
                style={{ color: '#000000' }}
                onClick={() => {
                  // TODO: Navigate to Help Center page
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
    </>
  );
};

export default CorporateLogin;
