/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色主题配色 - GitHub 风格
        background: {
          DEFAULT: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
          elevation: '#30363d',
          hover: '#1c2128',
        },
        border: {
          DEFAULT: '#30363d',
          subtle: '#21262d',
          muted: '#484f58',
        },
        text: {
          DEFAULT: '#c9d1d9',
          muted: '#8b949e',
          subtle: '#6e7681',
          // 语义化文本颜色
          primary: '#58a6ff',
          success: '#3fb950',
          warning: '#d29922',
          error: '#f85149',
          info: '#58a6ff',
        },
        primary: {
          DEFAULT: '#58a6ff',
          hover: '#79c0ff',
          faint: 'rgba(88, 166, 255, 0.15)',
        },
        // 语义化颜色
        success: {
          DEFAULT: '#3fb950',
          faint: 'rgba(63, 185, 80, 0.15)',
          hover: '#46c954',
        },
        warning: {
          DEFAULT: '#d29922',
          faint: 'rgba(210, 153, 34, 0.15)',
          hover: '#e3b341',
        },
        danger: {
          DEFAULT: '#f85149',
          faint: 'rgba(248, 81, 73, 0.15)',
          hover: '#f96e66',
        },
        info: {
          DEFAULT: '#58a6ff',
          faint: 'rgba(88, 166, 255, 0.15)',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(88, 166, 255, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
}
