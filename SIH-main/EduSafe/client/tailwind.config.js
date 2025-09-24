/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
      },
      colors: {
        'primary': {
          100: '#e6f7ff',
          200: '#bae7ff',
          300: '#91d5ff',
          400: '#69c0ff',
          500: '#40a9ff',
          600: '#1890ff',
          700: '#096dd9',
          800: '#0050b3',
          900: '#003a8c',
        },
      },
    },
  },
  plugins: [],
}
