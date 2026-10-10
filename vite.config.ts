import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Code-split Firebase into its own chunk to reduce main bundle size
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Split animation library
          motion: ['motion/react'],
        },
      },
    },
  },
});
