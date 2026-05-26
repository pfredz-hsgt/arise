import { defineConfig } from 'vite'

export default defineConfig({
  base: "/arise", 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    host: true, 
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  }
})
