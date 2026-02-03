import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Sab se zaroori line: is se White Screen khatam hogi
  base: './', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Taake WebView purani files cache na kare
    emptyOutDir: true, 
  }
});
