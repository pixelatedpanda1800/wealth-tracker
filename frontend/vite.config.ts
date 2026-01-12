import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindhouse from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindhouse(),
  ],
  server: {
    proxy: {
      // Forward /api requests to the backend during local development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
