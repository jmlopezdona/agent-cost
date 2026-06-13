## Why

La Fase 1 (MVP) entregó el motor de cálculo, los controles, los presets P1/P2/P4, el desglose por categoría, la comparativa salarial básica, el estado en URL y el selector de moneda. El PRD §13 define la **Fase 2 — v1.0** como el cierre del producto: los presets restantes con sus `learnings`, la configuración avanzada completa (precios editables, Batch API, recargo Bedrock, divisa y multiplicadores), el modo presentación, la exportación CSV/JSON/PNG y el pulido de accesibilidad AA y responsive.

El motor ya expone hooks neutros (`EngineOptions`: `batchFraction`, `batchDiscount`, `regionalSurcharge`) y la comparativa salarial ya acepta `employerCostMultiplier`/`effectiveHoursPerYear` configurables; falta exponer todo eso en la UI, cablearlo al recálculo y a la persistencia, y completar los escenarios y las funciones de comunicación (presentación y exportación) que cierran los objetivos de negocio del producto.

## What Changes

- **Presets restantes**: se añaden P3 (Diseño intensivo / greenfield), P5 (Enjambre QA nocturno) y P6 (Agente autónomo de mantenimiento) a `presets.json` con todos sus valores del PRD §8. Se añade el campo `learnings` (1-2 frases de "qué observar") a **todos** los presets (incluidos P1/P2/P4) y se muestra en la UI. P5 activa por defecto el toggle de Batch con 80% de trabajo elegible.
- **Configuración avanzada (RF-08)**: nuevo panel colapsable con (a) tabla de precios editable por modelo y categoría con botón "restaurar oficiales"; (b) toggle **Batch API (−50%)** con slider de "% elegible" (0–100%); (c) toggle **Recargo regional/Bedrock (+10%)** sobre todas las categorías; (d) tipo de cambio **USD→EUR** editable; (e) multiplicador de **coste empresa** (default 1,30) y **horas efectivas anuales** del FTE (default 1.720). Un **badge** junto a los resultados indica cada modificador activo (CA-08.1).
- **Modo presentación (RF-10)**: vista limpia conmutable con un clic y vía URL (`present=1`) que oculta los controles y muestra solo nombre/descripción del escenario, tarjetas de métricas y visualizaciones con tipografía ampliada.
- **Exportación (RF-09)**: descarga del escenario como CSV y JSON (parámetros + resultados) y de cada gráfico como PNG.
- **Persistencia ampliada**: los nuevos parámetros del escenario (batch on/%, Bedrock on, multiplicador de coste empresa, horas efectivas, overrides de precios y modo presentación) se serializan en la URL con claves cortas, solo cuando difieren del defecto, manteniendo la reproducibilidad exacta (CA-09.1).
- **Accesibilidad AA y pulido responsive**: cada serie de gráfico se distingue por color **más** una señal secundaria (patrón/forma), navegación por teclado y labels completos, y revisión responsive desde 360 px (CA-07.2, NFR WCAG 2.1 AA).
- El **motor permanece puro y el caso dorado intacto**: los modificadores tienen defaults neutros (sin batch, sin recargo) y no alteran el resultado de referencia de P2.
- Todos los strings nuevos en `src/i18n/es.ts`; cero literales de UI en componentes.

## Capabilities

### New Capabilities

- `advanced-config`: Panel de configuración avanzada con tabla de precios editable (y restaurar oficiales), toggle de Batch API con % elegible, toggle de recargo regional/Bedrock, tipo de cambio editable, multiplicador de coste empresa y horas efectivas del FTE, y badges de modificadores activos junto a los resultados.
- `presentation-mode`: Modo presentación que oculta los controles y muestra escenario, métricas y gráficos con tipografía ampliada, conmutable por UI y por parámetro de URL `present=1`.
- `export-scenario`: Exportación del escenario como CSV y JSON (parámetros + resultados) y de cada gráfico como imagen PNG.

### Modified Capabilities

- `scenario-presets`: se incorporan P3, P5 y P6; todos los presets ganan el campo `learnings` mostrado en la UI; P5 trae el toggle de Batch al 80% por defecto.
- `cost-engine`: se especifican los modificadores de precio sobre el cálculo —descuento Batch aplicado solo a la fracción elegible y recargo regional aplicado a todas las categorías— con defaults neutros que dejan el caso dorado intacto, y el motor recibe la tabla de precios editada y la configuración salarial.
- `url-sharing`: los nuevos parámetros (batch, Bedrock, multiplicador de coste empresa, horas efectivas, overrides de precios y modo presentación) se incorporan a la serialización compacta, solo cuando difieren del defecto.
- `results-display`: cada serie de los gráficos suma una señal secundaria al color (CA-07.2) y se garantiza la accesibilidad AA y la reactividad de las visualizaciones ante los nuevos modificadores.

## Impact

- **Código**:
  - Datos: `src/data/presets.json` (P3/P5/P6 + `learnings` + bloque de modificadores por defecto de P5), `src/engine/types.ts` (campo `learnings`, tipos de overrides de precios y de modificadores en el escenario), `src/data/index.ts` (type guards de `learnings` y validación).
  - Estado/persistencia: `src/store/useScenarioStore.ts` (campos y acciones de batch, Bedrock, multiplicador, horas efectivas, overrides de precios, modo presentación) y `src/store/urlSync.ts` (nuevas `PARAMS` + serialización de overrides y `present`) con round-trips en `urlSync.test.ts`.
  - Motor: `src/engine/engine.ts`/`types.ts` (semántica de `EngineOptions` ya presente; tests de batch/recargo en `engine.test.ts` sin tocar el caso dorado) y `src/lib/useResults.ts` (pasar opts y pricing editado).
  - UI: nuevo `src/components/controls/AdvancedConfigSection.tsx` (tabla de precios + toggles + campos), `src/components/results/ModifierBadges.tsx`, `src/components/layout/PresentationToggle.tsx` y modo presentación en el layout, `src/components/export/*` (CSV/JSON/PNG), `src/components/results/PresetLearnings.tsx`, ajustes en `charts/*` (señal secundaria) y `Header.tsx`.
  - i18n: `src/i18n/es.ts` (todos los strings nuevos).
- **Tests**: `engine.test.ts` (batch y recargo, caso dorado intacto), `salary.test.ts` (multiplicador/horas configurables), `urlSync.test.ts` (round-trip de los nuevos parámetros), Playwright humo (abrir advanced config y ver badge, conmutar modo presentación, exportar).
- **Sin impacto en**: la firma del motor (los hooks ya existen), el backend (no hay) ni el formateo de moneda ya entregado.
- **NFR a vigilar**: bundle < 250 kB gzip tras añadir export PNG (reutilizar el canvas de Chart.js, sin librerías pesadas); Lighthouse A11y ≥ 90.
