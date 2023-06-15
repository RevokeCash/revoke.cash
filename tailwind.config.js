/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './lib/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      spacing: {
        12: '3rem',
        20: '5rem',
        30: '7.5rem',
        38: '9.5rem',
        46: '11.5rem',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        monosans: ['Helvetica Neue', 'sans-serif'],
        futura: ['Futura Condensed'],
        code: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        monospace: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      typography: (theme) => ({
        zinc: {
          css: {
            '--tw-prose-body': theme('colors.zinc.900'),
            '--tw-prose-invert-body': theme('colors.zinc.100'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
