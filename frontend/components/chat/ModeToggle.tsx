import { Database, Globe } from "lucide-react";
import type { SearchMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  disabled?: boolean;
}

const OPTIONS: { value: SearchMode; label: string; icon: typeof Database; hint: string }[] = [
  { value: "picture", label: "Picture Search", icon: Database, hint: "Search your knowledge base" },
  { value: "internet", label: "Internet Search", icon: Globe, hint: "Search the live web" },
];

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-sky-50 p-1">
      {OPTIONS.map(({ value, label, icon: Icon, hint }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value)}
            title={hint}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed",
              active ? "bg-white text-sky-700 shadow-card" : "text-ink-500 hover:text-ink-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
