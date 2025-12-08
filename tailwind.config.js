// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
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
      // Add other utilities if needed
    },
  },
  plugins: [],
}
