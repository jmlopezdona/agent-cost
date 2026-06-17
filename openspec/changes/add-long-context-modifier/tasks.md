## 1. Tipos y datos

- [x] 1.1 Extender `src/engine/types.ts`: añadir `LongContextPricing` (`threshold: string`, `native: Record<string,number>`, `copilot: Record<string,number>`) y `longContext?: LongContextPricing` en `ModelPricing`; añadir `longContextFraction?: number` y `copilotPricing?: boolean` a `EngineOptions`.
- [x] 1.2 Añadir bloques `longContext` a los modelos elegibles de OpenAI (GPT‑5.5: native 8/0.8/36, copilot 10/1.0/45; GPT‑5.4: native y copilot según tabla de design) en `src/data/pricing.json`.
- [x] 1.3 Añadir bloques `longContext` a los modelos Pro de Google (Gemini 3.1 Pro Preview: native input ×2 / output ×1,5 = 4/0.4/18, copilot = mismo que native) en `src/data/pricing.json`. NO añadir a Flash/Flash‑Lite ni a ningún modelo de Anthropic.
- [x] 1.4 Incrementar `version` y `effective_date` en `pricing.json`; añadir `source` de los precios long.
- [x] 1.5 Actualizar los type guards de `src/data/index.ts` para validar el shape opcional `longContext` y mantener la cobertura existente.

## 2. Motor

- [x] 2.1 En `src/engine/engine.ts`, generalizar `categoryCosts`/`hourlyRate` para aceptar el mapa de precios a usar, y calcular la tarifa por modelo como mezcla `(1−f) × estándar + f × largo`, seleccionando `longContext.native` o `longContext.copilot` según `copilotPricing`; modelos sin `longContext` usan solo el término estándar.
- [x] 2.2 Verificar que Batch y recargo regional siguen aplicándose como factor `m` sobre ambos términos sin cambios.
- [x] 2.3 Tests en `src/engine/engine.test.ts`: caso dorado P2 intacto; OpenAI con fracción 50% mezcla correctamente; Anthropic inerte al 100%; fracción 0 neutra; conmutación Copilot aplica la tarifa más alta.

## 3. Estado y serialización

- [x] 3.1 En `src/store/useScenarioStore.ts`: añadir estado global `longContextFraction` y `copilotPricing`, sus setters (con clamp de la fracción), inclusión en `buildQuery`, `reset()` (0 / false) y paso a `EngineOptions` en `useResults`.
- [x] 3.2 Confirmar que el contexto largo NO se memoriza por familia ni se resetea en `setProvider` (simétrico a Batch/regional).
- [x] 3.3 En `src/store/urlSync.ts`: añadir `lc` (fracción %) y `cp` (flag) a `PARAMS` y `RECOGNIZED_KEYS`, con defaults y serialización por diff; extender `ModifierState`/`ModifierDefaults`.
- [x] 3.4 Round‑trip en `src/store/urlSync.test.ts`: contexto largo + Copilot; defaults cuando faltan; no se serializa el default.

## 4. UI e i18n

- [x] 4.1 Añadir strings a `src/i18n/es.ts`: etiqueta del slider de contexto largo, aviso "no aplica a esta familia", toggle "vía GitHub Copilot", textos de badge.
- [x] 4.2 Añadir el control en el panel de configuración avanzada (`src/components/controls/`): slider de % + toggle Copilot anidado (visible/efectivo solo con fracción > 0); aviso de inaplicabilidad cuando el proveedor activo no tiene modelos con `longContext`.
- [x] 4.3 Añadir el badge de modificador activo en `src/components/results/` distinguiendo "Contexto largo" y "Contexto largo · Copilot".

## 5. Cierre

- [x] 5.1 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde.
- [x] 5.2 `npm run test:e2e` (se ha tocado UI) y `npm run size` dentro de presupuesto.
- [x] 5.3 Actualizar `docs/PRD.md` si el modificador de contexto largo debe figurar en el alcance documentado.
