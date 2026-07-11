"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth, needsEmailVerification } from "@/lib/auth-context";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't bounce to /app if this is a password account that hasn't
    // verified yet — ProtectedRoute would immediately send it back here,
    // creating an infinite /login <-> /app redirect loop.
    if (!loading && user && !needsEmailVerification(user)) {
      router.replace("/app");
    }
  }, [loading, user, router]);

  return (
    <main className="relative flex h-dvh items-center justify-center overflow-y-auto bg-sky-wash px-4 py-6">
      {/* Ambient floating bubbles */}
      <div className="pointer-events-none absolute -left-16 top-16 h-40 w-40 animate-bubble-float rounded-full bg-bubble-radial blur-xl" />
      <div
        className="pointer-events-none absolute -right-10 top-1/3 h-56 w-56 animate-bubble-float rounded-full bg-bubble-radial blur-2xl"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="pointer-events-none absolute bottom-10 left-1/4 h-28 w-28 animate-bubble-float rounded-full bg-bubble-radial blur-lg"
        style={{ animationDelay: "2.4s" }}
      />

      <AuthCard />
    </main>
  );
}