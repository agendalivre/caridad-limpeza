import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#f5f2ea",
        paper: "#fffdf8",
        ink: {
          DEFAULT: "#17150f",
          soft: "#4b4740",
          mute: "#8a8478",
        },
        emerald: {
          50: "#e9f4ef",
          100: "#cfe8dd",
          500: "#0f8a68",
          600: "#0b6b53",
          700: "#084d3c",
        },
        gold: "#b08d4f",
        line: "#e6dfcf",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-18px)" },
        },
        drift: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(20px,-10px) scale(1.08)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        drift: "drift 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
