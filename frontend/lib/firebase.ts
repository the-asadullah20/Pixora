"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Remembers which provider the user last signed in with, so the login page
// can show a "Last used" badge. Purely cosmetic — never used for security.
const LAST_PROVIDER_KEY = "pixora:last-auth-provider";

export type AuthProviderId = "google" | "github" | "password";

export function rememberLastProvider(provider: AuthProviderId) {
  try {
    window.localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // localStorage unavailable (private browsing, etc.) — non-critical, ignore.
  }
}

export function getLastProvider(): AuthProviderId | null {
  try {
    return window.localStorage.getItem(LAST_PROVIDER_KEY) as AuthProviderId | null;
  } catch {
    return null;
  }
}
