import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useSessionAuth } from "@/hooks/useSessionAuth";

type ProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Protected Route wrapper for OAuth-authenticated pages
 * Redirects to SSO login if user is not authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useSessionAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sso-login" />;
  }

  return <>{children}</>;
}


