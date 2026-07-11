import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SocialButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  lastUsed?: boolean;
}

export function SocialButton({ icon, label, onClick, loading, lastUsed }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border bg-white text-sm font-medium text-ink-900 transition-all",
        "hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60",
        lastUsed ? "border-sky-300 ring-1 ring-sky-200" : "border-sky-100"
      )}
    >
      {icon}
      Continue with {label}
      {lastUsed && (
        <span className="absolute -top-2.5 right-3 rounded-full bg-sky-500 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-white shadow-soft">
          Last used
        </span>
      )}
    </button>
  );
}
