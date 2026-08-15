import type { Config } from "tailwindcss";

// Palette SVOLTA — dark, stile Whoop (dal prototipo svolta-v3)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#101318",
        card: "#191E26",
        cardsoft: "#20262F",
        line: "#2B333E",
        ink: "#F2F5F8",
        dim: "#93A0AE",
        accblue: "#4A9DFF",
        accgreen: "#16EC9A",
        accyellow: "#FFD60A",
        accred: "#FF5C5C",
        accviolet: "#B58CFF",
        acccyan: "#3ED6E0",
        accorange: "#FF9F45",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
export default config;
