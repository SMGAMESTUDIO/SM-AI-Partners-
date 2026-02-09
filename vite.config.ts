import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Ye line dashboard wali API_KEY ko code mein shamil karti hai
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || ""),
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