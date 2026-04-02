/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FFCBA4',
          300: '#FFA96B',
          400: '#FF8534',
          500: '#FF6B35',
          600: '#E5501A',
          700: '#BF3D12',
          800: '#983316',
          900: '#7A2D15',
        },
        secondary: {
          50: '#EFFCF9',
          100: '#D7F7F0',
          200: '#B3EFE2',
          300: '#7FE2CF',
          400: '#4BCDB8',
          500: '#2EC4B6',
          600: '#1E9E93',
          700: '#1C7F78',
          800: '#1B6561',
          900: '#1A5350',
        },
        accent: {
          50: '#FFFCF0',
          100: '#FFF8D6',
          200: '#FFF0AD',
          300: '#FFE47A',
          400: '#FFD166',
          500: '#F5BC3D',
          600: '#DB9B1D',
          700: '#B57614',
          800: '#935D17',
          900: '#794C19',
        },
        surface: '#F8F9FA',
        ink: '#1F2933',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
