"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface OwnerContextType {
  token: string | null;
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const OwnerContext = createContext<OwnerContextType>({
  token: null,
  email: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("fouri_owner_token");
    const storedEmail = localStorage.getItem("fouri_owner_email");
    if (stored && storedEmail) {
      fetch(`${API}/owner/verify`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error("Invalid");
          return r.json();
        })
        .then(() => {
          setToken(stored);
          setEmail(storedEmail);
        })
        .catch(() => {
          localStorage.removeItem("fouri_owner_token");
          localStorage.removeItem("fouri_owner_email");
        })
        .finally(() => setLoading(false));
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Login failed");
    }

    const data = (await res.json()) as { token: string; email: string };
    localStorage.setItem("fouri_owner_token", data.token);
    localStorage.setItem("fouri_owner_email", data.email);
    setToken(data.token);
    setEmail(data.email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fouri_owner_token");
    localStorage.removeItem("fouri_owner_email");
    setToken(null);
    setEmail(null);
  }, []);

  return (
    <OwnerContext.Provider
      value={{ token, email, loading, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  return useContext(OwnerContext);
}

export function useOwnerApi() {
  const { token } = useOwner();
  const api = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const res = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
      }
      return res.json();
    },
    [token]
  );
  return api;
}
