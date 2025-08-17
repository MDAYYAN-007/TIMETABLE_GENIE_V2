/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Lato", "sans-serif"],
        geistsans: "var(--font-geist-sans)",
        geistmono: "var(--font-geist-mono)",
      },
      screens: {
        'max-2xl': { 'max': '1535px' },
        'max-xl': { 'max': '1279px' },
        'max-lg': { 'max': '1023px' },
        'max-md': { 'max': '767px' },
        'max-sm': { 'max': '639px' },
        'max-xsm': { 'max': '460px' },
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-medium": "float 4s ease-in-out infinite",
        "float-fast": "float 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};
