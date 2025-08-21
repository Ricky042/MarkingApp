import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": "/src" } },
    server: {
      proxy: {
        '/signup': 'http://localhost:5000',
        '/login': 'http://localhost:5000',
        '/users': 'http://localhost:5000',
      },
    },
  })
