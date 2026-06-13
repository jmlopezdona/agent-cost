import { expect, test, type Page } from '@playwright/test'

// Caso de referencia P2 (PRD §8) sin recargo regional (deshabilitado por defecto):
// ponderado ≈ 6.040 $; blend ≈ 13,8 $/h
const P2_WEIGHTED = '6.023 $'
const USD = 'Mostrar cifras en dólares'

// La configuración vive en un acordeón exclusivo (Régimen abierto por defecto);
// abrir la sección de Tokens es necesario para acceder al slider Cache read.
const openTokens = (page: Page) => page.getByRole('button', { name: 'Tasa de tokens E/S' }).click()

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
  await expect(page.getByTestId('metric-blend')).toHaveText('13,8 $/h')
})

test('mover un control recalcula las métricas al instante', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: USD }).click()
  const weighted = page.getByTestId('metric-weighted')
  await expect(weighted).toHaveText(P2_WEIGHTED)

  // Cache read 30 → 60 M/h recalcula al instante
  await openTokens(page)
  await page.getByRole('spinbutton', { name: 'Cache read' }).fill('60')

  await expect(weighted).not.toHaveText(P2_WEIGHTED)
  await expect(weighted).toHaveText('9.823 $')
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
  // Clave de perfil de tokens canónica por proveedor (D8); el régimen mantiene su clave corta
  expect(sharedUrl).toContain('t.cacheReadM=60')
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
  // P4 sin recargo: blend ≈ 10,2 $/h · ponderado ≈ 5.177 $
  await expect(page.getByTestId('metric-blend')).toHaveText('10,2 $/h')
  await expect(page.getByTestId('metric-weighted')).toHaveText('5.177 $')
})

test('cambiar de familia carga su preset, filtra modelos y comparte con pr', async ({
  page,
  browser,
}) => {
  await page.goto('./')
  const anthropicBtn = page.getByRole('button', { name: 'Anthropic · Claude' })
  const googleBtn = page.getByRole('button', { name: 'Google · Gemini' })
  // Arranca en Anthropic (selector de familia presionado)
  await expect(anthropicBtn).toHaveAttribute('aria-pressed', 'true')

  // Cambiar a la familia Google fija el proveedor activo
  await googleBtn.click()
  await expect(googleBtn).toHaveAttribute('aria-pressed', 'true')
  await expect(anthropicBtn).toHaveAttribute('aria-pressed', 'false')

  // Compartir: la URL lleva pr=google
  await page.getByRole('button', { name: 'Compartir' }).click()
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toContain('pr=google')

  // Abrir el enlace restaura la familia Google
  const freshContext = await browser.newContext()
  const freshPage = await freshContext.newPage()
  await freshPage.goto(sharedUrl)
  await expect(freshPage.getByRole('button', { name: 'Google · Gemini' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await freshContext.close()
})

test('desempeño SWE-Pro: tarjetas, paréntesis por modelo y recálculo al mover el mix', async ({
  page,
}) => {
  await page.goto('./')
  // Tarjetas no héroe del caso P2: desempeño ponderado aproximado y coste/punto en EUR
  await expect(page.getByTestId('metric-swePro')).toHaveText('≈61 %')
  await expect(page.getByTestId('metric-costPerPoint')).toHaveText(/ €$/)

  // Abrir la mezcla: score por modelo entre paréntesis (Opus vendor sin ≈, Sonnet estimado con ≈)
  await page.getByRole('button', { name: 'Mezcla de modelos' }).click()
  await expect(page.getByText('(69 %)')).toBeVisible()
  await expect(page.getByText('(≈62 %)')).toBeVisible()
  const perf = page.getByTestId('mix-performance')
  await expect(perf).toHaveText('≈61 %')

  // Bajar Sonnet a 0 deja la mezcla en 15% Opus / 85% Haiku → 0,15×69,2 + 0,85×54 = 56,28
  await page.getByRole('spinbutton', { name: 'Claude Sonnet 4.6' }).fill('0')
  await expect(perf).toHaveText('≈56 %')
  await expect(page.getByTestId('metric-swePro')).toHaveText('≈56 %')
})

test('cambiar de familia muestra los scores propios de cada proveedor', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Google · Gemini' }).click()
  await page.getByRole('button', { name: 'Mezcla de modelos' }).click()
  // Gemini 3.1 Pro lleva score de proveedor (sin ≈); Flash-Lite (resto) va estimado (con ≈)
  await expect(page.getByText('(46 %)')).toBeVisible()
  await expect(page.getByText('(≈25 %)')).toBeVisible()
  // El desempeño ponderado refleja el mix de Google, no el de Anthropic
  await expect(page.getByTestId('metric-swePro')).toHaveText(/≈\d+ %/)
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

test('en presentación se puede cambiar entre las tres familias de modelos', async ({ page }) => {
  await page.goto('./?present=1')
  // Los controles siguen ocultos, pero el selector de familia está disponible
  await expect(page.getByText('Tasa de tokens E/S')).toBeHidden()
  const anthropic = page.getByRole('button', { name: 'Anthropic · Claude' })
  const google = page.getByRole('button', { name: 'Google · Gemini' })
  await expect(anthropic).toHaveAttribute('aria-pressed', 'true')

  // Cambiar a Google fija el proveedor activo y las métricas se mantienen visibles
  await google.click()
  await expect(google).toHaveAttribute('aria-pressed', 'true')
  await expect(anthropic).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('metric-weighted')).toBeVisible()
})

test('en presentación, el botón atrás del navegador vuelve a la calculadora', async ({ page }) => {
  await page.goto('./?present=1')
  await expect(page.getByText('Tasa de tokens E/S')).toBeHidden()

  // "Atrás" del navegador sale del modo presentación en vez de abandonar la página
  await page.goBack()
  await expect(page.getByText('Tasa de tokens E/S')).toBeVisible()
})

test('exportar JSON desde el menú de la cabecera descarga el escenario', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Exportar', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: 'Exportar JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('agentcost-escenario.json')
})
