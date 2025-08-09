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
      },
      screens: {
        'max-2xl': { 'max': '1535px' },
        'max-xl': { 'max': '1279px' },
        'max-lg': { 'max': '1023px' },
        'max-md': { 'max': '767px' },
        'max-sm': { 'max': '639px' },
        'max-xsm': { 'max': '460px' },
      },
      fontFamily: {
        geistsans: "var(--font-geist-sans)",
        geistmono: "var(--font-geist-mono)",
      },
    },
  },
  plugins: [],
};
