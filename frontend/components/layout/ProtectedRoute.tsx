"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-sky-wash">
        <RabbitMascot className="h-14 w-14 animate-rabbit-hop" />
        <p className="font-body text-sm text-ink-500">Getting things ready…</p>
      </div>
    );
  }

  return <>{children}</>;
}
