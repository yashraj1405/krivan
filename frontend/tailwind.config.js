/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2faf5',
          100: '#e2f4ea',
          200: '#c7e9d7',
          300: '#9cd5b9',
          400: '#6ab894',
          500: '#439c73',
          600: '#327e5c',
          700: '#27654a',
          800: '#21503c',
          900: '#1b4233',
          950: '#0e251d',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
