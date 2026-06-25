"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import authApi from "@/lib/api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(({ data }) => setUser(data.data))
      .catch(() => _clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const { data } = await authApi.login({ username, password });
    const { access, refresh, user: userData } = data.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    // Clear all cached queries for the new user
    queryClient.clear();

    // Set initial user data
    setUser(userData);

    // Fetch complete user data including avatar_url
    try {
      const { data: completeUserData } = await authApi.me();
      setUser(completeUserData.data);
      return completeUserData.data;
    } catch (err) {
      // If me() fails, return the initial login data
      return userData;
    }
  }, [queryClient]);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    const { access, refresh, ...userData } = data.data ?? {};
    if (access) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setUser(userData);
    }
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // blacklist call failed — still clear locally
    }
    // Clear all cached queries before logout
    queryClient.clear();
    _clearTokens();
    setUser(null);
    router.push("/auth/login");
  }, [router, queryClient]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

function _clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
