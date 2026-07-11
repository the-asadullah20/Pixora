"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, needsEmailVerification } from "@/lib/auth-context";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user && !needsEmailVerification(user) ? "/app" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-sky-wash">
      <RabbitMascot className="h-14 w-14 animate-rabbit-hop" />
      <p className="text-sm text-ink-500">Loading Pixora…</p>
    </div>
  );
}