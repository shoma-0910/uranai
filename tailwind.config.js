/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#B8860B',
          light: '#DAA520',
          dark: '#8B6914',
          50: '#FDF5E6',
          100: '#F9E5C3',
          200: '#F4D4A5',
          300: '#EFC386',
          400: '#DAA520',
          500: '#B8860B',
          600: '#8B6914',
          700: '#654D0F',
          800: '#3E300A',
          900: '#1C1505'
        }
      },
      fontFamily: {
        japanese: ['Noto Sans JP', 'sans-serif']
      },
      boxShadow: {
        'gold': '0 4px 20px -2px rgba(184, 134, 11, 0.15)',
        'gold-lg': '0 20px 40px -4px rgba(184, 134, 11, 0.2), 0 8px 16px -4px rgba(184, 134, 11, 0.1)'
      }
    }
  },
  plugins: [],
}