/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'system-ui', 'sans-serif'],
        mono: ['"Ubuntu Mono"', 'monospace'],
      },
    },
  },
  variants: {
    extend: {
      ringWidth: ['focus-visible', 'focus-within-visible'],
      ringColor: ['focus-visible', 'focus-within-visible'],
      ringOffsetWidth: ['focus-visible', 'focus-within-visible'],
      ringOffsetColor: ['focus-visible', 'focus-within-visible'],
      backgroundColor: ['focus-visible'],
      textColor: ['focus-visible'],
    },
  },
  plugins: [],
};
