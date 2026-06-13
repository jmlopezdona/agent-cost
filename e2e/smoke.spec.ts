import { expect, test, type Page } from '@playwright/test'

// Caso de referencia P2 (PRD §8) con el recargo Bedrock (+10%) activo por defecto:
// ponderado ≈ 6.040 $ × 1,10 = 6625 $; blend 13,8 × 1,10 = 15,2 $/h
const P2_WEIGHTED = '6625 $'
const USD = 'Mostrar cifras en dólares'

// La configuración vive en un acordeón exclusivo (Régimen abierto por defecto);
// abrir la sección de Tokens es necesario para acceder al slider Cache read.
const openTokens = (page: Page) =>
  page.getByRole('button', { name: 'Tasa de tokens E/S' }).click()

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
  await openTokens(page)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')

  await expect(weighted).not.toHaveText(P2_WEIGHTED)
  await expect(weighted).toHaveText('10.805 $')
  // Estado personalizado (CA del spec scenario-presets)
  await expect(
    page.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeVisible()
})

test('editar un valor no ensucia la URL y el estado sobrevive al refresco', async ({ page }) => {
  await page.goto('./')
  await openTokens(page)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')

  // La barra de direcciones permanece limpia (persistencia en sessionStorage, no en la URL)
  expect(new URL(page.url()).search).toBe('')

  // Refrescar conserva el escenario editado desde sessionStorage; el estado de UI
  // (sección abierta) no se persiste, así que hay que reabrir Tokens
  await page.reload()
  await openTokens(page)
  await expect(page.getByRole('spinbutton', { name: 'Cache read' })).toHaveValue('60')
  expect(new URL(page.url()).search).toBe('')
})

test('Reset devuelve al preset por defecto', async ({ page }) => {
  await page.goto('./')
  await openTokens(page)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')
  await expect(
    page.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Restablecer el escenario al preset por defecto' }).click()

  // Vuelve al valor por defecto de P2 (cache read 30) y deja de estar personalizado
  await expect(page.getByRole('spinbutton', { name: 'Cache read' })).toHaveValue('30')
  await expect(
    page.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeHidden()
})

test('copiar enlace genera una URL con los diffs y abrirla restaura el escenario con la URL limpia', async ({
  page,
  browser,
}) => {
  await page.goto('./')
  // Duty cycle vive en "Régimen y utilización" (abierta por defecto); Cache read en
  // "Tasa de tokens E/S" (abrirla cierra Régimen), de ahí el orden
  await page.getByRole('spinbutton', { name: 'Duty cycle' }).fill('80')
  await openTokens(page)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')
  const weighted = await page.getByTestId('metric-weighted').textContent()

  await page.getByRole('button', { name: 'Compartir' }).click()
  await expect(page.getByRole('button', { name: 'Enlace copiado' })).toBeVisible()

  // El portapapeles lleva los diffs aunque la barra de direcciones esté limpia
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(new URL(page.url()).search).toBe('')
  expect(sharedUrl).toContain('cr=60')
  expect(sharedUrl).toContain('dc=80')

  // Abrir el enlace en un contexto limpio restaura el escenario y deja la URL limpia
  const freshContext = await browser.newContext()
  const freshPage = await freshContext.newPage()
  await freshPage.goto(sharedUrl)
  await expect(freshPage.getByTestId('metric-weighted')).toHaveText(weighted!)
  await expect(
    freshPage.getByText('Personalizado (basado en Agente de delivery balanceado)'),
  ).toBeVisible()
  expect(new URL(freshPage.url()).search).toBe('')
  await freshContext.close()
})

test('seleccionar un preset carga todos los parámetros', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: USD }).click()
  await page.getByRole('button', { name: /Evolutivos sobre código maduro/ }).click()
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
  await page.getByRole('button', { name: 'Calculadora' }).click()
  await expect(page.getByText('Tasa de tokens E/S')).toBeVisible()

  // Y se puede volver a entrar
  await page.getByRole('button', { name: 'Presentación' }).click()
  await expect(page.getByText('Tasa de tokens E/S')).toBeHidden()
})

test('exportar JSON desde el menú de la cabecera descarga el escenario', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Exportar', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: 'Exportar JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('agentcost-escenario.json')
})
