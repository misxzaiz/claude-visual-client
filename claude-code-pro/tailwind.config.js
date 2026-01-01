/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 蓝色系
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          faint: 'rgba(59, 130, 246, 0.15)',
          glow: 'rgba(59, 130, 246, 0.3)',
        },
        // 背景色系 - 分层深色
        background: {
          base: '#0A0A0B',           // 全局背景
          elevated: '#141416',        // 侧边栏/面板
          surface: '#1C1C1E',         // 卡片/输入框
          hover: '#27272A',           // 悬停
          active: '#2D2D30',          // 激活
          tertiary: '#21262D',         // 兼容旧名
          secondary: '#161B22',       // 兼容旧名
        },
        // 边框色系
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          default: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
          muted: 'rgba(255, 255, 255, 0.08)',
        },
        // 文本色系
        text: {
          DEFAULT: '#FAFAFA',
          primary: '#FAFAFA',          // 主要文本
          secondary: '#A1A1AA',        // 次要文本
          tertiary: '#71717A',         // 辅助文本
          muted: '#52525B',            // 弱化文本
        },
        // 语义化颜色
        success: {
          DEFAULT: '#22C55E',
          faint: 'rgba(34, 197, 94, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          faint: 'rgba(245, 158, 11, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          faint: 'rgba(239, 68, 68, 0.15)',
        },
        info: {
          DEFAULT: '#06B6D4',
          faint: 'rgba(6, 182, 212, 0.15)',
        },
        // 兼容旧配色
        'text-success': '#22C55E',
        'text-warning': '#F59E0B',
        'text-error': '#EF4444',
        'text-info': '#06B6D4',
        'text-muted': '#71717A',
        'text-subtle': '#A1A1AA',
      },
      // 阴影
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.2)',
      },
      // 间距
      spacing: {
        '18': '4.5rem',   // 72px
        '19': '4.75rem',  // 76px
      },
      // 圆角
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
