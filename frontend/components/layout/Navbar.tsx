"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { History, Search, Menu, X } from "lucide-react";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/app", label: "Search", icon: Search },
  { href: "/history", label: "History", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/75 backdrop-blur-xl">
      {/* Decorative rabbit that wanders across the top hairline, carrot in tow */}
      <div className="pointer-events-none relative h-1.5 overflow-hidden">
        <RabbitMascot className="absolute top-[-9px] h-6 w-6 animate-rabbit-walk opacity-90" />
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="flex items-center gap-2.5">
          <RabbitMascot className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink-900">
            Pixora
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-sky-100 text-sky-700" : "text-ink-500 hover:bg-sky-50 hover:text-ink-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <UserMenu />
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-sky-50 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-sky-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
                  pathname === href ? "bg-sky-100 text-sky-700" : "text-ink-600"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex justify-end border-t border-sky-100 pt-3">
            <UserMenu />
          </div>
        </div>
      )}
    </header>
  );
}
