import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API = 'http://localhost:5100';

// Front e API rodam somente na própria máquina (localhost); nada fica exposto na rede.
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/uploads': { target: API, changeOrigin: true }
    }
  }
});
