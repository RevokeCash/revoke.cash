/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './lib/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        2.75: '0.6875rem',
        12: '3rem',
        20: '5rem',
        30: '7.5rem',
        38: '9.5rem',
        46: '11.5rem',
        58: '14.5rem',
        88: '22rem',
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
        heading: ['var(--font-heading)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        monosans: ['Helvetica Neue', 'sans-serif'],
        mono: ['var(--font-mono)', 'source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        code: ['var(--font-mono)', 'source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        monospace: ['var(--font-mono)', 'source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        brand: '#fdb952',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
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
