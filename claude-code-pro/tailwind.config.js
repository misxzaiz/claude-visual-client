/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色主题配色
        background: {
          DEFAULT: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
        },
        border: {
          DEFAULT: '#30363d',
        },
        text: {
          DEFAULT: '#c9d1d9',
          muted: '#8b949e',
        },
        primary: {
          DEFAULT: '#58a6ff',
          hover: '#79c0ff',
        },
        danger: '#f85149',
        success: '#3fb950',
        warning: '#d29922',
      },
    },
  },
  plugins: [],
}
