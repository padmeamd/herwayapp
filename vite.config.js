import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const deployHost = 'herwayapp.onrender.com'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
  server: {
    host: true,
    allowedHosts: [deployHost, 'localhost', '.onrender.com'],
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: [deployHost, 'localhost', '.onrender.com'],
  },
})
