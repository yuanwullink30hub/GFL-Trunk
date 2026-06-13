/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    // Scan every workspace package the platform renders, so Tailwind classes
    // used only inside shared packages (e.g. @gfl/brands' arbitrary positioning
    // like top-[12%]) are still generated. Without this the Gardens page's
    // <main> lost its top/left utilities and rendered too high / off to the left.
    '../../packages/*/src/**/*.{js,jsx,ts,tsx}',
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
