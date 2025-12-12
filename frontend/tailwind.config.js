// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3fbfb',
          100: '#e6f7f7',
          200: '#bfeef0',
          300: '#99e6e8',
          400: '#4fd3d8',
          500: '#00bfc5', // primary brand
          600: '#00a6ab',
          700: '#008682',
          800: '#00605e',
          900: '#00433f',
        },
        neutralSoft: {
          50: '#fbfbfc',
          100: '#f7f8f9',
          200: '#eef1f3',
          300: '#dde6ea',
          400: '#c5d5db',
          500: '#9fb3bb',
          600: '#6f8b93',
          700: '#4b6066',
          800: '#2f3f43',
          900: '#1a2628',
        }
      },
      boxShadow: {
        'card': '0 6px 18px rgba(15, 23, 42, 0.08)',
        'card-strong': '0 10px 30px rgba(15, 23, 42, 0.12)'
      },
      borderRadius: {
        'xl': '1rem'
      }
    },
  },
  plugins: [],
}
