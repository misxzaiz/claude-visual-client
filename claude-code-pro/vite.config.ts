import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // 构建优化配置
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分包，将大型依赖分离到独立的 chunk
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom'],
          // CodeMirror 编辑器相关
          'codemirror': [
            '@codemirror/autocomplete',
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/lint',
            '@codemirror/search',
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-javascript',
            '@codemirror/lang-java',
            '@codemirror/lang-json',
            '@codemirror/lang-python',
            '@codemirror/lang-rust',
            '@codemirror/lang-html',
            '@codemirror/lang-css',
          ],
          // Markdown 和工具库
          'utils': ['marked', 'dompurify', 'zustand'],
          // Tauri API
          'tauri': ['@tauri-apps/api/core', '@tauri-apps/api/event'],
        },
        // 为每个 chunk 设置单独的 CSS 文件
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'main.css') return 'assets/main-[hash].css';
          return 'assets/[name]-[hash][extname]';
        },
        // chunk 文件命名
        chunkFileNames: 'assets/[name]-[hash].js',
        // 入口文件命名
        entryFileNames: 'assets/main-[hash].js',
      },
    },
    // chunk 大小警告阈值 (kb)
    chunkSizeWarningLimit: 1000,
    // 压缩配置
    minify: 'esbuild',
    // 目标环境
    target: 'es2020',
    // sourcemap 配置
    sourcemap: false,
  },

  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tauri-apps/api/core',
      '@tauri-apps/api/event',
    ],
  },
}));
