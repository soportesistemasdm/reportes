import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Obligatorio para Docker
    port: 5173,
    // 👇 AGREGA ESTE BLOQUE DE AQUÍ ABAJO
    watch: {
      usePolling: true,
    },
  },
});
