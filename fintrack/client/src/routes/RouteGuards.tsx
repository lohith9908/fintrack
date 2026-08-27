import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Fullscreen initialization loader during session check
 */
export const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="text-xs font-semibold text-muted-foreground tracking-wide">
      Authenticating session...
    </span>
  </div>
);

/**
 * Protects application routes for authenticated users only.
 * Redirects unauthenticated requests to /auth/login with return path preserved.
 */
export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Ensures public-only routes (e.g. Login, Register) cannot be accessed by authenticated users.
 * Redirects active sessions to /dashboard.
 */
export const PublicOnlyRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    // If redirect location was stored in state, use that, else default to /dashboard
    const origin = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
    return <Navigate to={origin} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Restricts access to users with ADMIN role only.
 */
export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
