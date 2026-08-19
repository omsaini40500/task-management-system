import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // '/' if deployed at domain root, e.g. yourdomain.com
  // './' if deployed in a subfolder, e.g. yourdomain.com/app/
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})