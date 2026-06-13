# AGENTS.md — Cómo trabajar en este repo

Guía para agentes de IA (y humanos) que contribuyan a **AgentCost**, una SPA estática que estima el coste de operar agentes de IA sobre la API de Anthropic. Producto definido en `docs/PRD.md`; las decisiones de arquitectura están en `openspec/changes/*/design.md`.

## Flujo de trabajo: OpenSpec

El repo usa [OpenSpec](https://github.com/Fission-AI/OpenSpec) (schema `spec-driven`). **No implementes features directamente**: todo cambio no trivial pasa por una change con `proposal.md`, `design.md`, `specs/` y `tasks.md`.

- `openspec list` — changes activas y su progreso
- `openspec status --change <name> --json` — estado de artefactos
- `openspec instructions apply --change <name> --json` — ficheros de contexto y tareas pendientes
- Al implementar: lee **todos** los context files antes de tocar código, trabaja tarea a tarea y marca `- [x]` en `tasks.md` inmediatamente después de completar cada una
- Si la implementación revela un problema de diseño, actualiza los artefactos en vez de improvisar
- **Specs en español**: los requirements se redactan con las primitivas en español (`DEBE`/`DEBEN`), no `SHALL`/`MUST`. El validador de OpenSpec espera el keyword inglés y por eso marca `[ERROR] ... must contain SHALL or MUST` en todas las specs del repo: es **ruido esperado y no bloqueante** (`openspec validate` sale con exit code 0 y CI no ejecuta OpenSpec). No añadas `SHALL`/`MUST` solo para silenciarlo ni parchees el binario global de OpenSpec; mantén la convención en español por coherencia con las specs existentes.

## Comandos

```bash
npm run dev        # servidor de desarrollo (base /agent-cost/)
npm test           # Vitest (unitarios, entorno Node)
npm run test:e2e   # Playwright humo (requiere npx playwright install chromium)
npm run lint       # ESLint
npm run typecheck  # tsc -b
npm run build      # tsc + vite build → dist/
npm run size       # presupuesto de bundle < 250 kB gzip (falla si se supera)
npm run format     # Prettier (sin punto y coma, comillas simples, ancho 100)
```

**Antes de dar por terminado cualquier cambio**: `lint`, `typecheck`, `test` y `build` deben pasar. Si tocas UI, pasa también `test:e2e`. CI (`.github/workflows/ci.yml`) ejecuta todo esto en cada push y despliega a GitHub Pages en push a `main`.

## Arquitectura y reglas duras

```
src/
  engine/        # cálculo puro: engine.ts, salary.ts, types.ts (+ tests)
  data/          # pricing.json, presets.json, salaries.json + type guards (index.ts)
  store/         # useScenarioStore.ts (Zustand) + urlSync.ts
  components/    # controls/, results/, charts/, layout/, salary/
  i18n/          # es.ts — TODOS los strings de UI
  lib/           # format.ts, ranges.ts, theme.ts, useResults.ts
```

1. **El motor (`src/engine/`) es puro**: sin dependencias de DOM, React, Zustand ni del navegador. Debe ejecutarse en Node tal cual (tests, futuro CLI). Cualquier cálculo nuevo (también los de comparativa salarial) va aquí, no en componentes.
2. **Sin redondeo interno**: el motor mantiene precisión completa; el formateo (es-ES, separadores, decimales) vive solo en `src/lib/format.ts`. Nota: por decisión de producto se fuerza el separador de millares también en cifras de 4 dígitos (`useGrouping: 'always'`) para mantener consistencia visual entre escenarios baratos y caros ("6.038 $" y "10.060 $"); esto se desvía de la convención por defecto de `Intl` es-ES (que omitiría el separador en 4 dígitos).
3. **Caso dorado intocable**: el preset P2 debe producir blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes y ponderado ≈ 6.040 $/mes con error < 1% (tests en `src/engine/engine.test.ts`). Si cambias precios, presets o fórmulas y estos tests fallan, el cambio es incorrecto o exige actualizar el PRD primero.
4. **Datos en JSON, no en código**: precios, presets y salarios viven en `src/data/*.json` con type guards en `src/data/index.ts`. Si cambias precios, incrementa `version` y `effective_date` en `pricing.json` (la versión viaja en las URLs compartidas como `pv`).
5. **Cero literales de UI en componentes**: todo string sale de `src/i18n/es.ts` (objeto tipado). Añadir inglés en el futuro = crear `en.ts` con la misma forma.
6. **Resultados derivados, no almacenados**: el store de Zustand solo guarda el escenario; los resultados se calculan con `useResults()` (`useMemo` + `computeResults`). No metas resultados en el store.
7. **`sessionStorage` persiste el escenario; la URL es artefacto de compartir bajo demanda**: el escenario se guarda en `sessionStorage` (clave `agentcost-scenario`, por pestaña, sobrevive al refresco y no ensucia la barra de direcciones) vía `syncSession()` tras cada `update()`. La URL solo se construye al "Copiar enlace" (`serializeCurrent()` + `origin + pathname`); un enlace entrante tiene **precedencia** sobre la sesión, se adopta en `sessionStorage` y la URL se limpia con `replaceState`. Cualquier parámetro nuevo del escenario debe añadirse a `PARAMS` en `src/store/urlSync.ts` (clave corta, solo se serializan diffs frente al preset base) y a `RECOGNIZED_KEYS` si debe contar como "enlace entrante con estado"; añade el round-trip a `urlSync.test.ts`. El tema sigue persistiéndose aparte en `localStorage`.
8. **Colores solo vía design tokens**: CSS variables en `src/index.css` (`:root` y `.dark`), consumidas por Tailwind (`@theme inline`) y por Chart.js (`chartTheme()` en `src/components/charts/chartSetup.ts`). No hardcodees colores en componentes ni en gráficos.
9. **Chart.js con registro selectivo**: registra solo los controladores/escalas necesarios en `chartSetup.ts` (presupuesto de bundle). Todo gráfico canvas necesita alternativa textual accesible (tabla `sr-only` o `aria-label`).
10. **Mezcla de modelos**: Fable/Opus/Sonnet tienen slider; Haiku siempre es el resto hasta 100%. Usa `mixRemainder()` para evitar restos de coma flotante; el estado guarda fracciones (0–1), la UI y la URL trabajan en %.

## Restricciones NFR a vigilar

- Bundle < 250 kB gzip (`npm run size`; visualizer en `dist/stats.html`)
- Recálculo reactivo sin botón "calcular" (< 16 ms)
- Responsive desde 360 px; sliders operables en táctil
- Lighthouse móvil Performance y Accessibility ≥ 90
- 100% estático: sin backend, sin fetch en runtime, ningún dato del usuario sale del navegador

## Alcance

Fases 1 (MVP) y 2 (v1.0) implementadas: además del MVP, ya están Batch API, recargo Bedrock/regional, precios editables, los seis presets (P3/P5/P6 incluidos), modo presentación y exportación (CSV/JSON + PNG). Lo pendiente es **Fase 3 / v1.1+** (PRD §13): i18n EN (hoy solo existe `src/i18n/es.ts`), modelo personalizado / tier self-hosted con precio editable, analítica anónima opcional, importación de uso real (CSV de LiteLLM o Cost API) y multi-proveedor / modo flota. No los implementes de pasada; el motor ya expone hooks neutros (`EngineOptions`) para no romper firmas.

## Git

- No hagas commit ni push salvo petición explícita
- Los datos de `salaries.json` y `pricing.json` llevan fuente y fecha: si los actualizas, actualiza también `last_reviewed`/`effective_date`
