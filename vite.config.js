// Majok Aguer - mealmatch

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        planner: resolve(__dirname, 'planner.html'),
        favorites: resolve(__dirname, 'favorites.html')
      }
    }
  },
  server: {
    port: 5173
  }
});
