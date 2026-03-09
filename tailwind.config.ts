import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f2f4ea",
        ink: "#1f2d1f",
        muted: "#6d7461",
        line: "#d2d8c7",
      },
      keyframes: {
        "draw-x": {
          "0%": { transform: "scale(0.2)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "draw-x": "draw-x 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
