/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta personalizada — fugindo do azul/roxo padrão
        ink: {
          50: '#f7f7f5',
          100: '#eeeeea',
          200: '#d5d5cc',
          300: '#b0b0a3',
          400: '#83836f',
          500: '#666652',
          600: '#4f4f3e',
          700: '#3d3d2f',
          800: '#26261c',
          900: '#161610',
          950: '#0a0a06',
        },
        accent: {
          // Verde-limão vivo para destaques positivos
          DEFAULT: '#c4f542',
          dark: '#9bc92e',
        },
        positive: '#16a34a',
        negative: '#dc2626',
        warn: '#f59e0b',
      },
      fontFamily: {
        // Fontes distintivas (serif para display, mono pra números)
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'flat': '4px 4px 0 0 rgba(22, 22, 16, 1)',
        'flat-sm': '2px 2px 0 0 rgba(22, 22, 16, 1)',
        'flat-accent': '4px 4px 0 0 #c4f542',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
