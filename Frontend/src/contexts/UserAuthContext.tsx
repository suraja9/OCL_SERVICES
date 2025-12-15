import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnlineCustomer {
  _id: string;
  phoneNumber: string;
  name: string;
  email: string;
}

interface UserAuthContextType {
  customer: OnlineCustomer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (customer: OnlineCustomer) => void;
  logout: () => void;
  updateCustomer: (customer: OnlineCustomer) => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'onlineCustomer';

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<OnlineCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load customer from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const customerData = JSON.parse(stored);
        setCustomer(customerData);
      } catch (error) {
        console.error('Error parsing stored customer data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (customerData: OnlineCustomer) => {
    setCustomer(customerData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateCustomer = (customerData: OnlineCustomer) => {
    setCustomer(customerData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
  };

  return (
    <UserAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        login,
        logout,
        updateCustomer
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

