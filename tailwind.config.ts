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
        // Design System Colors
        background: "#1A1A1A",
        surface: "#2A2A2A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A0A0A0",
        "input-background": "#2C2C2C",
        "input-icon": "#B0B0B0",
        "button-red": "#FF2C2C",
        "button-red-hover": "#E02525",
        "social-google": "#DB4437",
        "social-apple": "#000000",
        "social-facebook": "#1877F2",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Design System Typography
        "heading": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "subheading": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "22px", fontWeight: "400" }],
        "caption": ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: {
        // Design System Spacing
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
      },
      borderRadius: {
        // Design System Radius
        "sm": "6px",
        "md": "12px",
        "lg": "20px",
      },
      animation: {
        "fadeIn": "fadeIn 2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
