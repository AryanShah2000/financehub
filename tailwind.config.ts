import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#E4E4DE",
        sage: "#C4C5BA",
        black: "#1B1B1B",
        moss: "#595F39",
      },
    },
  },
  plugins: [],
};

export default config;
