import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      // Las imágenes subidas desde el panel se sirven desde el backend.
      '/uploads': 'http://localhost:8080',
    },
  },
})
