/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    // OneDrive klasorunde forks havuzu worker baslatirken zaman asimina ugruyor.
    pool: 'threads',
    setupFiles: ['./src/test/setup.ts'],
  },
})
