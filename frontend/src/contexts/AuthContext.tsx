"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  getAuth,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  signOut,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initFirebase() {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) return null;
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = initFirebase();
    if (!app) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const auth = getAuth(app);

    setPersistence(auth, browserLocalPersistence);

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        const loginTimestamp = localStorage.getItem(
          "fouri_login_timestamp"
        );
        const now = Date.now();
        if (loginTimestamp) {
          const elapsed = now - parseInt(loginTimestamp, 10);
          if (elapsed > 7 * 24 * 60 * 60 * 1000) {
            signOut(auth);
            localStorage.removeItem("fouri_login_timestamp");
            setUser(null);
            setLoading(false);
            return;
          }
        } else {
          localStorage.setItem(
            "fouri_login_timestamp",
            String(now)
          );
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
