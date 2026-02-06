import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Cloudflare dashboard uses VITE_GEMINI_API_KEY as seen in your screenshot.
    // We map it to process.env.API_KEY so the service can use it.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || ""),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'genai': ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});