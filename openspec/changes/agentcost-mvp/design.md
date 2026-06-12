# Design — AgentCost MVP (Fase 1)

## Context

Proyecto greenfield: solo existen `docs/PRD.md` y el scaffolding de OpenSpec. El PRD (§11) propone el stack y la estructura; este diseño concreta las decisiones para la Fase 1. La app es 100% estática y client-side: todo el cálculo ocurre en el navegador, los datos (precios, presets, salarios) viven en ficheros JSON versionados en el repo, y el único "estado persistente" es la URL.

Restricciones relevantes del PRD: recálculo < 16 ms, bundle < 250 kB gzip, first load < 1,5 s en 4G, responsive desde 360 px, modo claro/oscuro, strings preparados para i18n, motor reutilizable fuera de la UI (futuro dashboard FinOps o CLI).

## Goals / Non-Goals

**Goals:**

- Motor de cálculo puro, testeable de forma aislada y validado contra el caso dorado del PRD §8 (P2 → blend ≈ $13,8/h, techo ≈ $10.060/mes, ponderado ≈ $6.040/mes, error < 1%).
- UI reactiva de una sola página con controles (tokens, mezcla, régimen), presets P1/P2/P4, métricas, desglose por categoría y comparativa salarial.
- Escenarios compartibles por URL con versión de precios embebida.
- Pipeline CI/CD a GitHub Pages desde el primer commit.

**Non-Goals:**

- Configuración avanzada (precios editables en UI, Batch API, recargo Bedrock) — Fase 2. El motor sí deja los hooks (parámetros opcionales) para no rediseñar después.
- Modo presentación, exportación CSV/PNG, presets P3/P5/P6 — Fase 2.
- i18n EN funcional (solo arquitectura de strings), accesibilidad AA exhaustiva (se aplican básicos: labels, teclado, contraste) — Fase 2.
- Backend, analítica, multi-proveedor.

## Decisions

### D1 — Stack: Vite + React 19 + TypeScript + Tailwind CSS v4

Lo que propone el PRD §11, alineado con el stack TS del equipo. Alternativas (Svelte, Preact) darían bundles menores pero rompen la alineación de equipo sin necesidad: el presupuesto de 250 kB gzip es alcanzable con React + una librería de gráficos ligera.

### D2 — Estado: Zustand con un único store de escenario

Un store `useScenarioStore` contiene el escenario completo (tokens, mix, régimen, duty, agentes, fx, preset activo). Los resultados NO viven en el store: se derivan con selectores/`useMemo` llamando al motor en cada render. Con aritmética simple el recálculo es < 1 ms, muy por debajo de los 16 ms exigidos — no hace falta memoización agresiva ni debounce.

Alternativa considerada: `useReducer` + context. Zustand evita el prop drilling y los re-renders globales con selectores granulares, y es la opción que ya nombra el PRD.

### D3 — Gráficos: Chart.js (vía react-chartjs-2)

El PRD deja la decisión a un spike Chart.js vs. Recharts. Se decide Chart.js: con registro selectivo de componentes (solo `DoughnutController`, `BarController` y escalas necesarias) pesa ~60 kB gzip frente a ~100+ kB de Recharts (que arrastra d3), y cubre de sobra donut + barras. Recharts ganaría en composición declarativa JSX, pero las 3 visualizaciones del MVP son fijas y simples. Los colores de los gráficos se leen de las CSS variables del tema para respetar claro/oscuro.

### D4 — Motor de cálculo: módulo puro `src/engine/` sin dependencias

- `types.ts`: `ModelPricing`, `Scenario`, `CostBreakdown`, `Results`.
- `engine.ts`: funciones puras — `hourlyRate(tokens, pricing)`, `blendedRate(tokens, mix, pricingTable)`, `scheduledHoursPerMonth(hoursDay, daysWeek)` (factor 52/12), `computeResults(scenario, pricingTable)` que devuelve techo/ponderado mensual y anual, desglose por categoría (USD/h y %) y por modelo.
- Sin redondeo interno: el formateo (miles, decimales, divisa) es responsabilidad de `src/lib/format.ts` con `Intl.NumberFormat('es-ES')`.
- La conversión EUR y los cálculos de comparativa salarial (FTE-equivalencia, €/h) también van en el engine (`salary.ts`) para que sean testeables.
- Los hooks de Fase 2 (descuento batch, recargo regional) se modelan ya como parámetros opcionales con defaults neutros (`batchFraction = 0`, `regionalSurcharge = 1`), de modo que la firma no cambie.

### D5 — Datos en JSON tipados en `src/data/`

`pricing.json` (con `version` y `effective_date`), `presets.json` (P1, P2, P4 con todos los parámetros y descripción) y `salaries.json` (4 perfiles con `source` y `last_reviewed`). Se importan estáticamente (Vite los inlinea con tipado vía `resolveJsonModule`); no hay fetch en runtime. Validación de forma con un type guard ligero en arranque (sin Zod, para no sumar dependencia en v1).

### D6 — Estado en URL: query string compacto escrito con `replaceState`

Serialización con claves cortas (`i`, `o`, `cr`, `cw`, `mf`, `mo`, `ms`, `h`, `d`, `dc`, `n`, `fx`, `p` para preset, `pv` para versión de precios). Al cargar, la URL tiene prioridad sobre el preset por defecto; al cambiar cualquier parámetro se reescribe la query con `history.replaceState` (sin entradas de historial). Solo se serializan los parámetros que difieren del preset base para mantener URLs cortas. Si `pv` difiere de la versión actual de `pricing.json`, se muestra un aviso (CA-09.1).

Alternativa considerada: estado en hash con base64 de un JSON comprimido (lz-string). Se descarta en v1: query params legibles facilitan debugging y la URL típica cabe de sobra; lz-string queda como opción si la URL creciera en Fase 2.

### D7 — Mezcla de modelos: 3 sliders + Haiku como resto, con clamping

Fable, Opus y Sonnet tienen slider propio; Haiku = 100 − suma. Al mover un slider, si la suma de los tres supera 100, el valor movido se clampa a `100 − (suma de los otros dos)` (clamping bidireccional simple, sin redistribución proporcional — predecible y suficiente según RF-03). El estado guarda los 4 valores ya normalizados en fracción.

### D8 — Tema y estilos: Tailwind + CSS variables, clase `dark` en `<html>`

Design tokens como CSS variables (`--color-surface`, `--color-accent`…) consumidas por Tailwind y por Chart.js. Detección con `prefers-color-scheme`, override manual persistido en `localStorage` (única excepción a "sin persistencia", es preferencia de UI, no datos).

### D9 — i18n: módulo de strings `src/i18n/es.ts`

Todos los textos de UI salen de un objeto tipado `strings`; los componentes no contienen literales. Sin librería i18n en v1 (un solo idioma): añadir EN en v1.1 será crear `en.ts` y un selector.

### D10 — Testing y CI

- **Vitest** sobre `src/engine/`: tabla de casos dorados (caso §8 con tolerancia 1%, casos límite: mix 100% un modelo, duty 10%, 0 tokens en una categoría, P1 y P4).
- **Playwright** humo E2E: cargar preset → verificar métrica, mover slider → verificar recálculo, copiar URL → abrir en contexto nuevo → mismos resultados.
- **GitHub Actions**: workflow único `ci.yml` — lint (ESLint) + typecheck + vitest + build + playwright; deploy a GitHub Pages (action oficial `deploy-pages`) solo en push a `main`. `base` de Vite configurada para el subpath de Pages.

### D11 — Estructura de carpetas

```
src/
  engine/        # cálculo puro: engine.ts, salary.ts, types.ts (+ tests)
  data/          # pricing.json, presets.json, salaries.json
  store/         # useScenarioStore.ts (Zustand) + urlSync.ts
  components/    # controls/, results/, charts/, layout/
  i18n/          # es.ts
  lib/           # format.ts, theme.ts
```

## Risks / Trade-offs

- [El caso de referencia §8 da valores aproximados ("≈")] → El test dorado usa tolerancia relativa del 1% tal como exige CA-01.3, calculando primero el valor exacto con las fórmulas RF-01 y verificando que cae dentro del rango del PRD. Si no cuadrara, se documenta la discrepancia antes de implementar UI.
- [Chart.js usa canvas: peor accesibilidad que SVG] → Cada gráfico lleva alternativa textual (tabla visually-hidden o `aria-label` con los datos); cumple el básico del MVP y CA-07.2 se completa en Fase 2.
- [URLs con claves crípticas pueden romperse entre versiones] → El parámetro `pv` (versión de precios) + serializador versionado; los cambios de esquema de URL en el futuro mantienen retrocompatibilidad de lectura.
- [Presupuesto de bundle 250 kB gzip con React + Chart.js] → Registro selectivo de Chart.js, sin router, sin librería de componentes; presupuesto vigilado con `rollup-plugin-visualizer` en CI (build falla informativamente si se supera).
- [Clamping simple de la mezcla puede sorprender al usuario al "frenar" un slider] → Feedback visual del resto asignado a Haiku siempre visible; es el comportamiento descrito en RF-03.

## Migration Plan

No aplica migración (proyecto nuevo). Despliegue: primer push a `main` publica en GitHub Pages; rollback = revert del commit y re-deploy automático.

## Open Questions

- Nombre/URL final del repositorio y de la página de GitHub Pages (afecta a `base` de Vite). Se asume `agent-cost` salvo indicación.
- ¿El tipo de cambio USD→EUR por defecto? Se asume 0,92 editable, mostrado siempre junto al resultado (RF-06); confirmar valor inicial con el equipo.
