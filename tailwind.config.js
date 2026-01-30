// tailwind.config.js
const designSystemConfig = require("../../platform/design-system/tailwind.config.js");

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "../../platform/design-system/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      ...designSystemConfig.theme.extend,
      // Project-specific utility configurations (not design tokens)
      transitionProperty: {
        width: "width",
        height: "height",
        spacing: "margin, padding",
        shadow: "box-shadow",
        transform: "transform",
      },
      transitionDuration: {
        DEFAULT: "300ms",
        200: "200ms",
        500: "500ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      // Project-specific breakpoints (extending design system breakpoints)
      screens: {
        ...designSystemConfig.theme.extend.screens,
        xs: "480px",
        "3xl": "1792px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
