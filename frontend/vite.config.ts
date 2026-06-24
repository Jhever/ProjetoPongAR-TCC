import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  // Força o Vite a não processar mapas de arquivos js no client de desenvolvimento
  dev: {
    sourcemap: false
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
})