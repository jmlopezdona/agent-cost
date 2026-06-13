## 1. Presets restantes y learnings

- [x] 1.1 Añadir el campo `learnings: string` a `Preset` en `src/engine/types.ts` y al type guard `isPreset` en `src/data/index.ts` (rechaza preset sin `learnings`)
- [x] 1.2 Añadir un bloque opcional `modifiers` al preset (`{ batchEnabled?: boolean; batchFraction?: number }`) en el tipo y el type guard
- [x] 1.3 Completar `src/data/presets.json`: añadir `learnings` a P1/P2/P4 y crear P3, P5, P6 con todos los valores del PRD §8; P5 con `modifiers: { batchEnabled: true, batchFraction: 0.8 }`
- [x] 1.4 Mostrar `learnings` del escenario activo en la UI (componente `PresetLearnings.tsx`), con strings en `es.ts`
- [x] 1.5 Test: `presets.json` valida; los seis presets tienen `learnings`; P5 trae el bloque de modificadores

## 2. Estado y acciones de configuración avanzada (store)

- [x] 2.1 Añadir al store `useScenarioStore.ts` los campos `batchEnabled`, `batchFraction`, `regional`, `employerMultiplier`, `effectiveHours`, `priceOverrides` (`Record<ModelId, Partial<ModelPricing>>`) y `presentation`, inicializados desde la URL con fallback a defaults neutros
- [x] 2.2 Acciones `setBatchEnabled`, `setBatchFraction`, `setRegional`, `setEmployerMultiplier`, `setEffectiveHours`, `setPriceOverride(model, field, value)`, `resetPriceOverrides`, `togglePresentation` (ninguna marca "Personalizado", igual que `fx`)
- [x] 2.3 `loadPreset` aplica el bloque `modifiers` del preset (P5 → batch 80%) y deja neutros los modificadores en presets sin bloque
- [x] 2.4 Rangos de los nuevos controles en `src/lib/ranges.ts` (batch 0–100%, multiplicador, horas efectivas) con clamping

## 3. Persistencia en URL

- [x] 3.1 Añadir a `PARAMS`/serialización de `urlSync.ts` las claves cortas `b` (batch %, solo si activo), `bd` (Bedrock 0/1), `em` (multiplicador), `eh` (horas efectivas), escritas solo si difieren del defecto
- [x] 3.2 Serializar overrides de precios en `px` como deltas `modelo.campo:valor` separados por comas; deserializar validando modelo/campo/valor numérico y descartando entradas inválidas
- [x] 3.3 Leer/escribir `present=1` (modo presentación) fuera del diff de escenario, con `replaceState`
- [x] 3.4 Round-trips en `urlSync.test.ts`: defecto no aparece; cada parámetro se serializa y restaura; valores/overrides inválidos caen al defecto

## 4. Motor: modificadores y precios editados

- [x] 4.1 Cablear `EngineOptions` en `src/lib/useResults.ts`: componer `{ batchFraction: batchEnabled ? batchFraction : 0, regionalSurcharge: regional ? 1.10 : 1 }` y derivar la tabla efectiva fusionando `pricingTable` + `priceOverrides` (memoizado)
- [x] 4.2 Pasar `SalaryConfig` editada (`employerMultiplier`, `effectiveHours`) a la comparativa salarial
- [x] 4.3 Tests en `engine.test.ts`: batch al 40% → ×0,80; Bedrock → ×1,10; composición → ×0,88; caso dorado de P2 intacto con defaults neutros
- [x] 4.4 Test en `salary.test.ts`: multiplicador y horas efectivas configurables

## 5. UI de configuración avanzada

- [x] 5.1 `AdvancedConfigSection.tsx` colapsable (plegado por defecto) con tabla de precios editable por modelo/categoría y botón "restaurar oficiales"
- [x] 5.2 Toggle Batch API + slider de % elegible; toggle recargo regional/Bedrock; campos `fx`, multiplicador de coste empresa y horas efectivas (reutilizando el control de `fx` ya existente)
- [x] 5.3 `ModifierBadges.tsx`: badges "batch X% aplicado", "Bedrock +10%", "precios editados" junto a los resultados, solo cuando el modificador está activo
- [x] 5.4 Todos los strings nuevos en `src/i18n/es.ts`; labels/`aria` en cada control y celda de precio

## 6. Modo presentación

- [x] 6.1 `PresentationToggle.tsx` en la cabecera (`aria-pressed`) enlazado a `presentation`/`togglePresentation`
- [x] 6.2 Layout condicional: ocultar columna de controles y configuración avanzada; ampliar tipografía de métricas y gráficos; mostrar nombre + descripción + `learnings` del escenario
- [x] 6.3 Inicializar el modo desde `present=1` en la URL; reflejar el toggle en la URL con `replaceState`
- [x] 6.4 Humo E2E: `present=1` arranca en modo presentación; el conmutador oculta/restaura los controles

## 7. Exportación

- [x] 7.1 Generadores en cliente de CSV y JSON del escenario (parámetros + `Results` + modificadores activos) con descarga vía `Blob`
- [x] 7.2 Export PNG por gráfico usando `canvas.toDataURL('image/png')` del canvas de Chart.js (sin librerías nuevas), respetando el tema activo
- [x] 7.3 Export PNG de montaje ("exportar todo"): componer los tres canvas en uno offscreen con `drawImage(...)` + `toDataURL`, respetando el tema activo (sin librerías nuevas)
- [x] 7.4 Botones de exportación en la UI (por gráfico + "exportar todo") con strings en `es.ts`; verificar coherencia del export con las cifras mostradas

## 8. Accesibilidad AA y pulido responsive

- [x] 8.1 Señal secundaria por serie (patrón/borde) en donut, techo vs ponderado y comparativa salarial, definida junto a `chartTheme()` en `chartSetup.ts` (colores desde tokens)
- [x] 8.2 Revisar navegación por teclado y labels en los nuevos controles (tabla de precios, toggles, presentación, export)
- [x] 8.3 Revisión responsive desde 360 px de la tabla de precios, badges y modo presentación (sin overflow horizontal)

## 9. Verificación

- [x] 9.1 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde; caso dorado de `engine.test.ts` sin tocar y pasando
- [x] 9.2 `npm run test:e2e` en verde (advanced config + badge, modo presentación, export)
- [x] 9.3 `npm run size` dentro del presupuesto (< 250 kB gzip; comprobar `dist/stats.html` tras el export PNG)
- [x] 9.4 Lighthouse móvil: Performance y Accessibility ≥ 90 (medido: Performance 97, Accessibility 92)
