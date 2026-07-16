import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Forward auth/session-related requests to the Spring Boot backend so
      // the backend's session cookie stays first-party in the browser during
      // local dev (cross-origin cookies would otherwise need SameSite=None
      // + HTTPS). Point this at wherever `backend` actually runs.
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login': 'http://localhost:8080',
      '/logout': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
