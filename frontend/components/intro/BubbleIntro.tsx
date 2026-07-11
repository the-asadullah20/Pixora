"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import { Button } from "@/components/ui/Button";

const SPARKLE_POSITIONS = [
  { top: "22%", left: "32%", delay: "0s", size: "6px" },
  { top: "38%", left: "60%", delay: "0.5s", size: "4px" },
  { top: "58%", left: "38%", delay: "1s", size: "5px" },
  { top: "30%", left: "48%", delay: "1.5s", size: "3px" },
  { top: "66%", left: "58%", delay: "0.8s", size: "4px" },
];

export function BubbleIntro() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const enter = () => router.replace("/app");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-sky-wash px-6">
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        {/* Outer soft glow */}
        <div className="absolute inset-0 animate-bubble-float rounded-full bg-bubble-radial blur-2xl" />

        {/* The bubble itself */}
        <div className="relative h-56 w-56 animate-bubble-float rounded-full border border-white/70 bg-white/40 shadow-float backdrop-blur-sm sm:h-64 sm:w-64">
          {/* Iridescent inner sheen, slowly rotating */}
          <div className="absolute inset-2 animate-bubble-spin-slow rounded-full bg-iris-sheen" />
          {/* Deep blue core */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-iris-400 shadow-inner" />
          {/* Glass highlight */}
          <div className="absolute left-6 top-5 h-16 w-10 rotate-[20deg] rounded-full bg-white/50 blur-sm" />

          {SPARKLE_POSITIONS.map((s, i) => (
            <span
              key={i}
              className="absolute animate-sparkle rounded-full bg-white"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
        </div>

        <RabbitMascot className="absolute -bottom-3 -right-2 h-12 w-12 drop-shadow-lg" />
      </div>

      <h1 className="mt-10 animate-fade-up text-center font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
        Welcome to Pixora
      </h1>
      <p
        className="mt-3 max-w-md animate-fade-up text-center text-ink-500"
        style={{ animationDelay: "0.15s" }}
      >
        Show it a picture, and Pixora finds what it means — in your knowledge base or across the web.
      </p>

      <div
        className="mt-8 animate-fade-up transition-opacity duration-500"
        style={{ animationDelay: "0.3s", opacity: ready ? 1 : 0 }}
      >
        <Button size="lg" onClick={enter} disabled={!ready}>
          Enter Pixora <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
