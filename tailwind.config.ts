import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f4f7fb",
          100: "#e5edf6",
          200: "#cbd9ed",
          300: "#a2bde0",
          400: "#789fce",
          500: "#527fb9",
          600: "#3d639d",
          700: "#314f7d",
          800: "#294065",
          900: "#223553"
        },
        accent: {
          50: "#f4fff8",
          100: "#d9ffe6",
          200: "#b4facc",
          300: "#81e5a8",
          400: "#44c676",
          500: "#27a95b",
          600: "#1a8646",
          700: "#17693a",
          800: "#145331",
          900: "#0f4129"
        }
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

