import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // App background layers
        bg: {
          base:   "#0B0F19",
          card:   "#111827",
          hover:  "#1a2235",
          border: "#1e2d40",
        },
        // Brand palette
        brand: {
          DEFAULT: "#6366F1",
          light:   "#818cf8",
          dark:    "#4f46e5",
        },
        // Semantic colours
        accent:  "#22C55E",
        warning: "#EF4444",
        // Recommendation colours
        rec: {
          strong_buy:  "#22C55E",
          buy:         "#4ade80",
          hold:        "#fbbf24",
          sell:        "#f97316",
          strong_sell: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":       "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.20), transparent)",
        "card-glow":       "radial-gradient(ellipse at top, rgba(99,102,241,0.06), transparent 70%)",
        "buy-glow":        "radial-gradient(ellipse at top, rgba(34,197,94,0.08), transparent 70%)",
        "sell-glow":       "radial-gradient(ellipse at top, rgba(239,68,68,0.08), transparent 70%)",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":   "spin 8s linear infinite",
        "fade-in":     "fadeIn 0.5s ease-out",
        "slide-up":    "slideUp 0.4s ease-out",
        "float":       "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                               to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float:   {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "brand-sm": "0 0 12px rgba(99,102,241,0.25)",
        "brand-md": "0 0 24px rgba(99,102,241,0.30)",
        "buy-sm":   "0 0 12px rgba(34,197,94,0.25)",
        "sell-sm":  "0 0 12px rgba(239,68,68,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
