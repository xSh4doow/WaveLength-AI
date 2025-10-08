/**
 * UserContext - Manages user state
 * Temporarily uses localStorage until authentication is implemented
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserContextType {
  userName: string | null;
  setUserName: (name: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wavelength_user_name");
    if (stored) {
      setUserNameState(stored);
    }
  }, []);

  const setUserName = (name: string) => {
    localStorage.setItem("wavelength_user_name", name);
    setUserNameState(name);
  };

  const clearUser = () => {
    localStorage.removeItem("wavelength_user_name");
    setUserNameState(null);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
