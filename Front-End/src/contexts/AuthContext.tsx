/**
 * AuthContext - Manages authentication state
 * Integrates with backend /auth endpoints
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface User {
  userId: number;
  userName: string;
  email: string;
}

interface AuthContextType {
  userId: number | null;
  userName: string;
  email: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("wavelength_user_id");
    const storedUserName = localStorage.getItem("wavelength_user_name");
    const storedEmail = localStorage.getItem("wavelength_email");

    if (storedUserId && storedUserName && storedEmail) {
      setUser({
        userId: parseInt(storedUserId),
        userName: storedUserName,
        email: storedEmail,
      });
    }

    setIsLoading(false);
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Save to state and localStorage
      const newUser = {
        userId: data.user_id,
        userName: data.name,
        email: data.email,
      };
      setUser(newUser);
      localStorage.setItem("wavelength_user_id", newUser.userId.toString());
      localStorage.setItem("wavelength_user_name", newUser.userName);
      localStorage.setItem("wavelength_email", newUser.email);

      toast({
        title: "Conta criada!",
        description: `Bem-vindo, ${data.name}!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Save to state and localStorage
      const newUser = {
        userId: data.user_id,
        userName: data.name,
        email: data.email,
      };
      setUser(newUser);
      localStorage.setItem("wavelength_user_id", newUser.userId.toString());
      localStorage.setItem("wavelength_user_name", newUser.userName);
      localStorage.setItem("wavelength_email", newUser.email);

      toast({
        title: "Login realizado!",
        description: `Bem-vindo de volta, ${data.name}!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Verifique suas credenciais",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("wavelength_user_id");
    localStorage.removeItem("wavelength_user_name");
    localStorage.removeItem("wavelength_email");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        userId: user?.userId ?? null,
        userName: user?.userName ?? "",
        email: user?.email ?? "",
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
