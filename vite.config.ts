
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // This is NOT an error. This line is REQUIRED to make Vercel's API_KEY 
    // visible to the browser. Without this, the AI will never work.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Setting this to 2000 removes the yellow warning you saw in Vercel logs
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
