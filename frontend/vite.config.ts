import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Configurações de segurança obrigatórias para o MediaPipe acessar a GPU
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: {
    // Exclua a biblioteca do processamento do Vite para evitar erros de exportação
    exclude: ['@mediapipe/tasks-vision']
  }
})