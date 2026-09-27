/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#080C15",
          surface: "#0E1424",
          card: "#141C30",
          cardLight: "#1A243D",
          border: "#222F4C",
        },
        cyan: {
          accent: "#00E5FF",
          glow: "#0284C7",
        },
      },
    },
  },
  plugins: [],
}
