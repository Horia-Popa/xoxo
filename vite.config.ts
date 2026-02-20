/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
  future: {
    removeServerModuleGraph: 'warn',
    removeServerTransformRequest: 'warn',
    removeServerHot: 'warn',
  },
})
