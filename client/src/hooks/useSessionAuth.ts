import { useState, useEffect } from "react";
import axios from "axios";

export type SessionUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  enterpriseId: number | null;
  role: string;
  isActive: boolean;
};

export function useSessionAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/auth/me", { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
      window.location.href = "/sso-login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { user, loading, logout, refetch: checkAuth };
}


