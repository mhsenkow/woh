import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://mhsenkow.github.io/woh/
export default defineConfig({
  base: '/woh/',
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': new URL('./src/engine', import.meta.url).pathname,
      '@sim': new URL('./src/sim', import.meta.url).pathname,
      '@game': new URL('./src/game', import.meta.url).pathname,
      '@input': new URL('./src/input', import.meta.url).pathname,
      '@ui': new URL('./src/ui', import.meta.url).pathname,
      '@net': new URL('./src/net', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
  },
});
