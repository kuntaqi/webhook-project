/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-bg)',
        secondary: 'var(--secondary-bg)',
        card: 'var(--card-bg)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border-color)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover)',
        danger: 'var(--danger-color)',
        'danger-hover': 'var(--danger-hover)',
      },
    },
  },
  plugins: [],
};