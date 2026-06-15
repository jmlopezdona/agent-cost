# Tasks — recalibrate-preset-input-tokens

## 1. PRD primero (regla dura: caso dorado)

- [x] 1.1 `docs/PRD.md` §4 RF-02: cambiar el default de "Input fresco" de 42 a 20 k/h en la tabla de controles (línea ~113)
- [x] 1.2 `docs/PRD.md` §8: actualizar la columna `In (k/h)` de la tabla de presets — P1=20, P2=20, P3=24, P4=20, P5=12, P6=22
- [x] 1.3 `docs/PRD.md` §8: añadir nota de que los `inputK` se calibraron contra telemetría real de sesiones (mediana ~18–20 k/h de input no cacheado por hora activa con prompt caching); confirmar que el bloque del caso de referencia (13,8 / 3.585 / 2.151) se mantiene porque sigue cumpliéndose con error < 1%

## 2. Datos

- [x] 2.1 `src/data/presets.json`: `inputK` Anthropic — P1 42→20, P2 42→20, P3 50→24, P4 42→20, P5 25→12, P6 45→22
- [x] 2.2 `src/data/presets.json`: `inputK` OpenAI — O1 42→20, O2 42→20, O3 50→24, O4 42→20, O5 25→12, O6 45→22
- [x] 2.3 `src/data/presets.json`: `inputK` Google — G1 42→20, G2 42→20, G3 50→24, G4 42→20, G5 25→12, G6 45→22

## 3. Tests del motor (aserciones exactas dependientes de inputK)

- [x] 3.1 `src/engine/engine.test.ts`: `hourlyRate` Sonnet P2 — `14.2635 → 14.1975` y actualizar el comentario aritmético (`20/1000×3 + …`)
- [x] 3.2 `src/engine/engine.test.ts`: categoría a cero — `14.2635 - 30 * 0.3 → 14.1975 - 30 * 0.3`
- [x] 3.3 `src/engine/engine.test.ts`: caso P1 — `12.3617 → 12.3045` y comentario (Sonnet 14,1975 / Haiku 4,7325)
- [x] 3.4 `src/engine/engine.test.ts`: caso P4 — `10.1591 → 10.1085` y comentario (Opus 21,975 / Sonnet 13,185 / Haiku 4,395)
- [x] 3.5 `src/engine/engine.test.ts`: confirmar que NO cambian las aserciones por tolerancia (`expectWithin1Percent(…, 13.8 / 3585 / 2151 / 35)`) ni la SWE-Pro (`weightedSwePro 61.48`, derivada de la mezcla)

## 4. Verificación de no-regresión

- [x] 4.1 `npm test` verde, incluidos `presets.test.ts`, `swePro.test.ts` y `urlSync.test.ts` (round-trip de diffs frente al preset base) — 110/110
- [x] 4.2 Revisar `src/data/presets.test.ts` por aserciones que fijen `inputK` exacto; actualizar si las hubiera — P5 25→12, P6 45→22
- [x] 4.3 Revisar `src/store/urlSync.test.ts` por escenarios que serialicen un `inputK` concreto como diff frente al preset base — no fija `inputK` de preset base (usa valores arbitrarios de override); sin cambios
- [x] 4.4 `npm run lint`, `npm run typecheck`, `npm run build` verdes
- [x] 4.5 `npm run test:e2e` (toca presets visibles en UI) verde — 16/16
- [x] 4.6 (descubierta) `e2e/smoke.spec.ts`: actualizar valores dorados visibles que cambian por display rounding — P2 ponderado 2.151→2.141 $, blend 13,8→13,7 $/h; P4 10,2→10,1 $/h y 1.849→1.840 $; cache-read-60 3.508→3.498 $

## 5. Cierre

- [x] 5.1 `openspec validate --change recalibrate-preset-input-tokens` (exit 0; el `[ERROR] must contain SHALL` es ruido esperado en specs en español)
- [x] 5.2 Confirmar que no quedan referencias a "42 k/h" / "inputK: 42" / "14.2635" / "12.3617" / "10.1591" fuera de archivos archivados
