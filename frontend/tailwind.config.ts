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
          base:  "#080b14",
          card:  "#0d1117",
          hover: "#111827",
          border: "#1e2a3a",
        },
        // Accent palette
        brand: {
          DEFAULT: "#6366f1",
          light:   "#818cf8",
          dark:    "#4f46e5",
        },
        // Recommendation colours
        rec: {
          strong_buy:  "#10b981",
          buy:         "#34d399",
          hold:        "#fbbf24",
          sell:        "#f97316",
          strong_sell: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":        "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.25), transparent)",
        "card-glow":        "radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":  "spin 8s linear infinite",
        "fade-in":    "fadeIn 0.5s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },               to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
