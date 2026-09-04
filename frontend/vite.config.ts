import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'

const logger = createLogger()
const originalWarn = logger.warn

// Intercepta e silencia apenas o aviso de source map ausente do MediaPipe
logger.warn = (msg, options) => {
  if (msg.includes('Failed to load source map') && msg.includes('@mediapipe')) {
    return
  }
  originalWarn(msg, options)
}

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
})