import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Относительные пути: сборка работает в подпапке хаба Midnight (/samurai-pool/)
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
});









