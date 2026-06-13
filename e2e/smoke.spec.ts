import { expect, test } from '@playwright/test'

// Caso de referencia P2 (PRD §8) con el recargo Bedrock (+10%) activo por defecto:
// ponderado ≈ 6.040 $ × 1,10 = 6625 $; blend 13,8 × 1,10 = 15,2 $/h
const P2_WEIGHTED = '6625 $'
const USD = 'Mostrar cifras en dólares'

test('carga P2 por defecto en EUR y el selector propaga el símbolo a las métricas', async ({
  page,
}) => {
  await page.goto('./')
  // Defecto EUR (CA currency-display): las métricas muestran el símbolo €
  await expect(page.getByTestId('metric-blend')).toHaveText(/€\/h$/)
  await expect(page.getByTestId('metric-weighted')).toHaveText(/ €$/)

  // Cambiar a USD propaga el símbolo $ y muestra la referencia en USD nativo
  await page.getByRole('button', { name: USD }).click()
  await expect(page.getByTestId('metric-weighted')).toHaveText(P2_WEIGHTED)
  await expect(page.getByTestId('metric-blend')).toHaveText('15,2 $/h')
})

test('mover un control recalcula las métricas al instante', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: USD }).click()
  const weighted = page.getByTestId('metric-weighted')
  await expect(weighted).toHaveText(P2_WEIGHTED)

  // Cache read 30 → 60 M/h recalcula al instante (con recargo +10% por defecto)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')

  await expect(weighted).not.toHaveText(P2_WEIGHTED)
  await expect(weighted).toHaveText('10.805 $')
  // Estado personalizado (CA del spec scenario-presets)
  await expect(
    page.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeVisible()
})

test('copiar URL y abrirla en un contexto nuevo reproduce resultados idénticos', async ({
  page,
  browser,
}) => {
  await page.goto('./')
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')
  await page.getByRole('spinbutton', { name: 'Duty cycle' }).fill('80')
  const weighted = await page.getByTestId('metric-weighted').textContent()

  await page.getByRole('button', { name: 'Copiar enlace del escenario' }).click()
  await expect(page.getByRole('button', { name: 'Enlace copiado' })).toBeVisible()

  // El portapapeles contiene la URL con el estado serializado (replaceState)
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toBe(page.url())
  expect(sharedUrl).toContain('cr=60')
  expect(sharedUrl).toContain('dc=80')

  const freshContext = await browser.newContext()
  const freshPage = await freshContext.newPage()
  await freshPage.goto(sharedUrl)
  await expect(freshPage.getByTestId('metric-weighted')).toHaveText(weighted!)
  await expect(
    freshPage.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeVisible()
  await freshContext.close()
})

test('seleccionar un preset carga todos los parámetros', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: USD }).click()
  await page.getByRole('button', { name: /Sonnet-first con escalación/ }).click()
  // P4 con recargo +10%: blend 10,1591 × 1,10 = 11,2 $/h · ponderado ≈ 5695 $
  await expect(page.getByTestId('metric-blend')).toHaveText('11,2 $/h')
  await expect(page.getByTestId('metric-weighted')).toHaveText('5695 $')
})

test('el disclaimer de la comparativa salarial es visible', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText(/no implica equivalencia de capacidades/)).toBeVisible()
})

test('la configuración avanzada activa batch y muestra el badge', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: USD }).click()
  const weighted = page.getByTestId('metric-weighted')
  await expect(weighted).toHaveText(P2_WEIGHTED)

  // El panel está plegado por defecto; al desplegarlo aparecen sus controles
  await expect(page.getByRole('checkbox', { name: /Batch API/ })).toBeHidden()
  await page.getByText('Configuración avanzada').click()
  await page.getByRole('checkbox', { name: /Batch API/ }).check()

  // Badge visible (50% por defecto) y resultados con el descuento ×0,75
  await expect(page.getByText(/batch 50\s*% aplicado/)).toBeVisible()
  await expect(weighted).not.toHaveText(P2_WEIGHTED)
})

test('present=1 arranca en modo presentación y el conmutador restaura los controles', async ({
  page,
}) => {
  await page.goto('./?present=1')
  // En presentación se ocultan los controles (régimen, tokens, configuración avanzada)
  await expect(page.getByText('Tasa de tokens E/S')).toBeHidden()
  await expect(page.getByText('Configuración avanzada')).toBeHidden()
  await expect(page.getByTestId('metric-weighted')).toBeVisible()

  // Salir restaura los controles
  await page.getByRole('button', { name: 'Salir del modo presentación' }).click()
  await expect(page.getByText('Tasa de tokens E/S')).toBeVisible()

  // Y se puede volver a entrar
  await page.getByRole('button', { name: 'Modo presentación' }).click()
  await expect(page.getByText('Tasa de tokens E/S')).toBeHidden()
})

test('exportar JSON descarga el escenario', async ({ page }) => {
  await page.goto('./')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('agentcost-escenario.json')
})
