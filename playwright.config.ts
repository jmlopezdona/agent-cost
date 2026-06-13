import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173/agent-cost/',
    permissions: ['clipboard-read', 'clipboard-write'],
    // El humo asume la UI en español; con i18n el idioma se autodetecta de navigator.language,
    // así que se fija el locale del navegador a es-ES para que el chrome arranque en español.
    locale: 'es-ES',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/agent-cost/',
    reuseExistingServer: !process.env.CI,
  },
})
