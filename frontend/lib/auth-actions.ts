"use client";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth, githubProvider, googleProvider, rememberLastProvider } from "./firebase";

export class AuthActionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function friendlyMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email or password doesn't match an account.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function wrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: { code?: string; message?: string }) => {
    const code = err.code ?? "unknown";
    throw new AuthActionError(code, friendlyMessage(code));
  });
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const cred = await wrap(signInWithPopup(auth, googleProvider));
  rememberLastProvider("google");
  return cred;
}

export async function signInWithGithub(): Promise<UserCredential> {
  const cred = await wrap(signInWithPopup(auth, githubProvider));
  rememberLastProvider("github");
  return cred;
}

export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  const cred = await wrap(createUserWithEmailAndPassword(auth, email, password));
  await sendEmailVerification(cred.user);
  rememberLastProvider("password");
  return cred;
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const cred = await wrap(signInWithEmailAndPassword(auth, email, password));
  rememberLastProvider("password");
  return cred;
}

export async function resetPassword(email: string): Promise<void> {
  await wrap(sendPasswordResetEmail(auth, email));
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new AuthActionError("auth/no-current-user", "You're signed out — log in again to resend.");
  }
  await wrap(sendEmailVerification(auth.currentUser));
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}