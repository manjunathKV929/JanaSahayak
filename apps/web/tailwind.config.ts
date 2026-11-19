import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        civic: {
          navy: '#183B50',
          'navy-dark': '#102D3D',
          'navy-light': '#EAF1F5',
          green: '#386B55',
          'green-light': '#EAF3ED',
          ivory: '#F7F6F1',
          surface: '#F3F5F4',
          charcoal: '#263238',
          muted: '#66727A',
          border: '#DDE3E5',
          warning: '#A66A18',
          error: '#B42318',
          info: '#245C7A',
        },
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
