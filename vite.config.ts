import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // forward /api/klaviyo/* -> https://a.klaviyo.com/api/*
      '/api/klaviyo': {
        target: 'https://a.klaviyo.com/api',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/klaviyo/, ''),
      },
    },
  },
});
