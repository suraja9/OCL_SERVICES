import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import oclLogo from "@/assets/ocl-logo.png";
import unnamedImage from "@/assets/unnamed.jpg";

const MedicineLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('medicineToken');
    const info = localStorage.getItem('medicineInfo');
    if (token && info) {
      navigate('/medicine/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/medicine/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('medicineToken', data.token);
        localStorage.setItem('medicineInfo', JSON.stringify(data.user));
        toast({ title: 'Login Successful', description: `Welcome, ${data.user.name}!` });
        navigate('/medicine/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
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
          backgroundImage: `url(${unnamedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      
      <div 
        className="relative z-10 bg-white rounded-2xl shadow-2xl px-8 pt-16 pb-0 w-full max-w-lg flex flex-col justify-center"
        style={{
          background: 'linear-gradient(to bottom, #F9FAFB, #FEF3C7)',
          boxShadow: 'rgb(38, 57, 77) 0px 20px 30px -10px',
          minHeight: '500px'
        }}
      >
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

        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontWeight: 700 }}>
          Medicine Login
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4">
            <div className="input-group relative w-8/12 mx-auto" style={{ marginBottom: '22px' }}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  boxShadow: 'none'
                }}
                required
                disabled={isLoading}
              />
              <label
                htmlFor="email"
                className="absolute left-0 transition-all duration-300 ease-in-out pointer-events-none"
                style={{
                  top: emailFocused || email ? '-16px' : '50%',
                  transform: emailFocused || email ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: emailFocused || email ? '12px' : '14px',
                  color: emailFocused ? '#3B82F6' : '#9CA3AF',
                  backgroundColor: 'transparent',
                  marginBottom: emailFocused || email ? '4px' : '0'
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
                  boxShadow: 'none'
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
                  color: passwordFocused ? '#3B82F6' : '#9CA3AF',
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
                className="absolute right-0 bottom-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between w-8/12 mx-auto -mt-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 focus:ring-2"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Forgot Password",
                  description: "Please contact your administrator to reset your password.",
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>

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

          <div className="pt-2 text-sm text-gray-600">
            <div className="flex flex-wrap gap-3 justify-center text-xs">
              <span 
                className="underline cursor-pointer hover:text-gray-900"
                onClick={() => {
                  toast({
                    title: "Terms & Conditions",
                    description: "Redirecting to Terms & Conditions...",
                  });
                }}
              >
                Terms & Conditions
              </span>
              <span className="text-gray-400">|</span>
              <span 
                className="underline cursor-pointer hover:text-gray-900"
                onClick={() => {
                  toast({
                    title: "Privacy Policy",
                    description: "Redirecting to Privacy Policy...",
                  });
                }}
              >
                Privacy Policy
              </span>
              <span className="text-gray-400">|</span>
              <span 
                className="underline cursor-pointer hover:text-gray-900"
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
    </>
  );
};

export default MedicineLogin;


