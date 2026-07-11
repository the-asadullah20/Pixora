"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogOut, ShieldCheck, ShieldAlert, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthActionError, logout, resendVerificationEmail } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const initial = (user.email ?? "P")[0].toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleResend = async () => {
    setResendError(null);
    setResending(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch (err) {
      setResendError(err instanceof AuthActionError ? err.message : "Couldn't send the email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 py-1 pl-1 pr-3 transition-colors hover:border-sky-300"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 font-display text-sm text-white">
          {initial}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 animate-fade-up rounded-2xl border border-sky-100 bg-white p-3 shadow-float">
          <div className="border-b border-sky-100 px-2 pb-3">
            <p className="truncate font-medium text-ink-900">{user.email}</p>
            {user.emailVerified ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-sky-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Email verified
              </p>
            ) : (
              <div className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs text-amber-700">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> Email not verified
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="shrink-0 text-xs font-medium text-sky-600 hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending…" : resent ? "Sent!" : "Resend"}
                  </button>
                </div>
                {resendError && <p className="mt-1 text-[11px] text-rose-600">{resendError}</p>}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-ink-700 transition-colors hover:bg-sky-50"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}