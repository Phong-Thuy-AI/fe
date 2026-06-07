/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        // Premium brand color setup for Feng Shui theme
        gold: {
          50: '#fbf8eb',
          100: '#f5edd1',
          200: '#ead79e',
          300: '#dbba64',
          400: '#cfa23d',
          500: '#b2822a',
          600: '#946320',
          700: '#75471c',
          800: '#5f391a',
          900: '#4f3019',
          950: '#2e190b',
        }
      }
    },
  },
  plugins: [],
}
