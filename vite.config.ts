
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // This trick tells Vite to replace 'process.env.API_KEY' with the actual value from Vercel during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  }
});
