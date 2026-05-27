import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end monochrome palette
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#0a0a0a",
          hover: "#121212",
        },
        border: "#1a1a1a",
        muted: "#737373",
        accent: "#ffffff", // Pure white for primary actions
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
      },
      boxShadow: {
        "premium-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.5)",
        "premium-lg": "0 20px 40px -12px rgba(0, 0, 0, 0.8)",
        "glass": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;