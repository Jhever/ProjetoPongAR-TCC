import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // REMOVA as bibliotecas do exclude
    // COLOQUE-AS no include para o Vite processar corretamente
    // include: ['@mediapipe/hands', '@mediapipe/drawing_utils']
    include: []
  }
})