import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        "4.5": "1.125rem",
      },
      colors: {
        // Core palette — bubble / sky-blue / white
        mist: {
          50: "#F7FBFF",
          100: "#EEF6FE",
          200: "#DDEEFC",
        },
        sky: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
        iris: {
          200: "#E0D7FB",
          300: "#C4B5FD",
          400: "#A78BFA",
        },
        mint: {
          200: "#C7F9EF",
          300: "#99F6E4",
        },
        ink: {
          500: "#3E5A76",
          700: "#1F3A5C",
          900: "#0B2545",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "bubble-radial":
          "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), rgba(224,242,254,0.4) 45%, rgba(125,211,252,0.25) 70%, transparent 100%)",
        "sky-wash":
          "linear-gradient(180deg, #F7FBFF 0%, #EEF6FE 45%, #E0F2FE 100%)",
        "iris-sheen":
          "linear-gradient(135deg, rgba(196,181,253,0.35), rgba(125,211,252,0.35), rgba(153,246,228,0.35))",
      },
      boxShadow: {
        soft: "0 8px 30px -8px rgba(14, 165, 233, 0.25)",
        card: "0 4px 24px -4px rgba(11, 37, 69, 0.08)",
        float: "0 20px 60px -15px rgba(14, 165, 233, 0.35)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        "bubble-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-14px) scale(1.015)" },
        },
        "bubble-spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "rabbit-hop": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-6px) rotate(-3deg)" },
        },
        "rabbit-walk": {
          "0%": { transform: "translateX(-10%)" },
          "100%": { transform: "translateX(110%)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "bubble-float": "bubble-float 6s ease-in-out infinite",
        "bubble-spin-slow": "bubble-spin-slow 40s linear infinite",
        "rabbit-hop": "rabbit-hop 0.6s ease-in-out infinite",
        "rabbit-walk": "rabbit-walk 18s linear infinite",
        sparkle: "sparkle 2.4s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;