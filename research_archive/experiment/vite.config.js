import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/react-hero.js`,
        chunkFileNames: `assets/react-hero-[name].js`,
        assetFileNames: `assets/react-hero.[ext]`
      }
    }
  }
})
