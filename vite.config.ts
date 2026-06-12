import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// Servida bajo https://<usuario>.github.io/agent-cost/
export default defineConfig({
  base: '/agent-cost/',
  plugins: [react(), tailwindcss(), visualizer({ filename: 'dist/stats.html', gzipSize: true })],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
