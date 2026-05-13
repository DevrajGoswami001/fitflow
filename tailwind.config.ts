import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0A0A0F",
          50: "#F5F5FF",
          100: "#E8E8F8",
          900: "#0A0A0F",
        },
        violet: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
          glow: "rgba(124,58,237,0.15)",
        },
        surface: {
          0: "#0A0A0F",
          1: "#111118",
          2: "#1A1A24",
          3: "#22222F",
        },
        muted: {
          DEFAULT: "#6B7280",
          light: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backgroundImage: {
        shimmer:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
      },
      boxShadow: {
        "glow-violet": "0 0 30px rgba(124,58,237,0.3)",
        "glow-sm": "0 0 10px rgba(124,58,237,0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
