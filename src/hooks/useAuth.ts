"use client";
import { useI18n } from "@/i18n/provider";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  hasAffiliate: boolean;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const { t: __tr } = useI18n();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          loading: false,
          error: null,
        });
      } else {
        // Not authenticated
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        router.push("/login");
      }
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: __tr("Failed to check authentication"),
      });
      router.push("/login");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      router.push("/login");
    }
  };

  return {
    ...authState,
    logout,
    checkAuth,
  };
}
