/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        heading: ['"Hanken Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F4FA',
          100: '#D9E2F5',
          200: '#B1C5FF',
          300: '#90AAF1',
          400: '#5E81C7',
          500: '#274484',
          600: '#1F3D7D', // Primary Navy
          700: '#123E80',
          800: '#00285E',
          900: '#002664', // Deep Navy
          950: '#001947'
        },
        accent: {
          500: '#E1251B', // Secondary Red
          600: '#BC0004',
          700: '#930002',
        },
        paper: {
          surface: '#F7F9FB',
          container: '#ECEEF0',
          white: '#FFFFFF',
          dark: '#191C1E',
          slate: '#1E293B',
          border: '#E2E8F0',
          outline: '#747781'
        }
      },
      borderRadius: {
        'xl': '1.5rem',
        'lg': '1rem',
        'md': '0.75rem',
        'DEFAULT': '0.5rem',
        'sm': '0.25rem'
      }
    },
  },
  plugins: [],
}
