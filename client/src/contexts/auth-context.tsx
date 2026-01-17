import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SessionUser } from "@shared/schema";
import { getAuthSession, logout as logoutApi } from "@/lib/auth";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setUser(session.user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshSession,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
