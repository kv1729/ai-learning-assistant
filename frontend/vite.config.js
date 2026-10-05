import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to FastAPI, so the browser sees one origin (no CORS in dev).
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
