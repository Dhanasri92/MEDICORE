/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medicore: {
          blue: '#329BFA',
          'blue-hover': '#2486E3',
          'blue-light': '#EBF5FE',
          bg: '#F5F6F8',
          card: '#FFFFFF',
          text: '#171B22',
          muted: '#9298A1',
          border: '#E9EDF2',
          teal: '#00C2B2',
          'teal-light': '#E6F9F7',
          amber: '#FF9F43',
          'amber-light': '#FFF5EB',
          pink: '#FF5E7E',
          'pink-light': '#FFEBF0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
