import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  if (mode === 'production' && !env.VITE_API_URL?.trim() && process.env.VERCEL) {
    console.warn(
      '\n⚠️  Vercel 构建未检测到 VITE_API_URL：登录会 404。请在 Vercel → Settings → Environment Variables 添加 VITE_API_URL=https://你的API域名（Express 部署地址），勿带尾斜杠，然后 Redeploy。\n'
    );
  }
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
        '/uploads': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      },
    },
  };
});
