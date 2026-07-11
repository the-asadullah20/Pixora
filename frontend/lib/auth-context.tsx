"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns a fresh Firebase ID token for calling the backend, or null if signed out. */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, getToken }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * True when `user` signed up with email/password and hasn't confirmed their
 * email yet. Google/GitHub accounts are already provider-verified, so this
 * is always false for them. Used everywhere that decides whether a signed-in
 * user is actually allowed into the app (ProtectedRoute, login redirect,
 * root redirect) — keeping this logic in one place avoids the redirect
 * loops that happen when one page's check drifts out of sync with another's.
 */
export function needsEmailVerification(user: User | null): boolean {
  if (!user) return false;
  const isPasswordAccount = user.providerData.some((p) => p.providerId === "password");
  return isPasswordAccount && !user.emailVerified;
}