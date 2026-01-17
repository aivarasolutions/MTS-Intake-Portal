import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === "client") {
      return <Redirect to="/dashboard/client" />;
    } else {
      return <Redirect to="/dashboard/admin" />;
    }
  }

  return <>{children}</>;
}
