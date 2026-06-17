## Context

El motor (`src/engine/engine.ts`) calcula la tarifa $/h de cada modelo sumando, por categoría `rate` del `costModel` del proveedor, `(tasa/escala) × precio × m`, donde `m = priceModifier(opts, modifiers)` aplica Batch y recargo regional como factores globales (D5). Cada modelo tiene **un único** mapa `prices` en `pricing.json`, que corresponde al tramo de contexto estándar. Los modificadores se declaran por proveedor (`ProviderModifiers`) y se conducen desde el store vía `EngineOptions`. El estado global (Batch, regional) vive en `useScenarioStore` y se serializa en `urlSync` con claves cortas y diff frente al preset.

La realidad de precios a junio de 2026 (verificada contra las webs oficiales y la doc de GitHub Copilot):

| Proveedor | Tramo contexto largo nativo | Umbral | GitHub Copilot (long) |
|---|---|---|---|
| Anthropic (Opus/Sonnet/Haiku/Fable) | **no aplica**, 1M plano | — | — (Copilot no lista variante long de Claude) |
| Google Gemini **Pro** | input ×2 / output ×1,5 | >200K | mismas que nativo (Copilot replica el tramo de Google) |
| Google Gemini Flash/Flash‑Lite | plano | — | — |
| OpenAI GPT‑5.5 | 5/30 → 8/36 | >272K | 10/45 (Copilot añade margen) |
| OpenAI GPT‑5.4 | 2,5/15 → tramo long | >272K | 5/22,5 |

## Goals / Non-Goals

**Goals:**

- Modelar el sobreprecio de contexto largo de la API nativa para los modelos elegibles (OpenAI y Gemini Pro), ponderado por una fracción 0–1 del trabajo por encima del umbral.
- Permitir conmutar a las tarifas de contexto largo de GitHub Copilot (más altas) como sub‑modo anidado.
- Mantener el motor puro, sin redondeo interno, y el caso dorado P2 intacto.
- Reusar los patrones existentes: modificador global declarado por proveedor, fracción tipo Batch, serialización por diff.

**Non-Goals:**

- Modelar el esquema completo de AI Credits de Copilot (créditos incluidos por plan, multiplicadores de premium request, MAI/Raptor). Solo el delta de contexto largo.
- Tarifas de contexto largo para Anthropic (no existen) ni para Gemini Flash/OpenAI mini-nano (planos).
- Contar tokens reales por petición para decidir automáticamente qué fracción supera el umbral: la fracción la fija el usuario (igual que Batch).
- Tramos de "long context" de output que dependan del input de la sesión: se aproxima como dos perfiles de tarifa (estándar/largo) mezclados por fracción.

## Decisions

### D1 — Precio de contexto largo como segundo mapa de precios por modelo, no como factor global

Cada modelo elegible declara en `pricing.json` un bloque `longContext` con su propio mapa `prices` (mismas claves de categoría que el estándar) y, anidado, las tarifas de Copilot. Ejemplo:

```jsonc
"gpt-5.5": {
  "prices": { "input": 5.0, "cached_input": 0.5, "output": 30.0 },
  "longContext": {
    "threshold": "272k",
    "native":  { "input": 8.0,  "cached_input": 0.8, "output": 36.0 },
    "copilot": { "input": 10.0, "cached_input": 1.0, "output": 45.0 }
  }
}
```

**Por qué un mapa y no un multiplicador global**: los tramos no son un factor uniforme (Gemini Pro: input ×2 pero output ×1,5; OpenAI: ratios distintos). Un segundo mapa de precios reutiliza exactamente la maquinaria de `categoryCosts` y deja la verdad de cada tarifa en datos auditables, coherente con la regla "datos en JSON, no en código". Elegibilidad = presencia del bloque `longContext` (un modelo sin él nunca se encarece).

_Alternativa descartada_: multiplicadores por categoría en `modifiers`. Más compacto pero esconde las tarifas reales en factores y obliga a un caso especial por proveedor.

### D2 — Mezcla por fracción dentro del cálculo por modelo, no un nuevo factor en `priceModifier`

La tarifa de un modelo pasa a ser `(1−f) × rate(prices) + f × rate(longPrices)`, calculada reutilizando `categoryCosts` con el mapa correspondiente. `priceModifier` (Batch/regional) sigue aplicándose como factor `m` sobre ambos términos sin cambios. Así Batch y regional componen multiplicativamente con el contexto largo de forma natural, y los modelos no elegibles (sin `longContext`) usan solo el término estándar.

**Por qué no meterlo en `priceModifier`**: ese factor es escalar y por-proveedor; el contexto largo es por-modelo (depende de si el modelo tiene tramo) y mezcla dos perfiles de precio, no escala uno. Mantenerlo en el bucle por modelo de `computeResults`/`hourlyRate` es más limpio.

### D3 — `EngineOptions`: `longContextFraction` (0–1) y `copilotPricing` (bool)

Dos hooks neutros nuevos. `longContextFraction ?? 0` ⇒ comportamiento actual exacto cuando no se pasa. `copilotPricing` solo selecciona el mapa `longContext.copilot` frente a `longContext.native` para el término `f`; sin fracción no tiene efecto. El motor ignora ambos para modelos sin bloque `longContext`.

### D4 — Estado global en el store, simétrico a Batch/regional

`longContextFraction: number` y `copilotPricing: boolean` como estado global (no por familia): no se memorizan ni resetean al cambiar de familia, igual que Batch y regional (ver comentario de `setProvider`). Se reflejan en `reset()` (a 0 / false), en `buildQuery`/`ModifierState` y en los defaults. La UI muestra el control en las tres familias pero, cuando el proveedor activo no tiene modelos elegibles (Anthropic) o el modelo no es elegible, avisa de que no impacta en el coste — derivable de la presencia de `longContext` en los modelos del proveedor activo.

### D5 — Sub‑modo Copilot anidado (decisión de producto confirmada)

`copilotPricing` solo es visible/efectivo cuando `longContextFraction > 0`. Fuera de contexto largo, las tarifas estándar de Copilot coinciden con las nativas, así que no se modela nada extra. El badge distingue "Contexto largo" de "Contexto largo · Copilot".

### D6 — Serialización por diff con claves cortas

Nuevas entradas en `PARAMS` de `urlSync.ts`: `lc` (fracción, %, entero) y `cp` (flag Copilot). Ambas en `RECOGNIZED_KEYS`. Solo se serializan si difieren del default (fracción 0 / false), como el resto de modificadores. Round‑trip cubierto en `urlSync.test.ts`.

## Risks / Trade-offs

- **[El umbral es informativo, no se valida contra tokens reales]** El usuario podría poner 100% de contexto largo con prompts pequeños y sobreestimar. → Igual que Batch (% elegible declarado); el texto i18n y el `threshold` mostrado encuadran la expectativa. Es una estimación, no facturación.
- **[Aproximar el tramo de output por la fracción de input]** El cobro real de output a tarifa long depende de que la sesión supere el umbral de input, no de una fracción independiente. → Aproximación consciente: una sola fracción gobierna ambos perfiles; documentado en design y en el texto del control.
- **[Drift de precios]** Las tarifas long y el delta Copilot envejecen como el resto de `pricing.json`. → Van con `version`/`effective_date` y `source`; el canje de Copilot replica precios de API, así que se revisan en el mismo ciclo.
- **[Romper el caso dorado o el shape de datos]** → Anthropic no declara `longContext`, por lo que P2 es bit‑a‑bit idéntico; tests de `engine.test.ts` y type guards de `src/data/index.ts` lo blindan. La propiedad `longContext` es opcional en `ModelPricing`, sin romper modelos existentes.

## Migration Plan

1. Extender tipos (`ModelPricing.longContext?`, `EngineOptions`) y type guards.
2. Añadir bloques `longContext` a los modelos elegibles de OpenAI y Google en `pricing.json`; incrementar `version`/`effective_date`.
3. Motor: mezcla por fracción en el cálculo por modelo; tests (caso dorado intacto + nuevas tarifas).
4. Store + urlSync: estado global, setters, reset, `PARAMS`/`RECOGNIZED_KEYS`, round‑trip.
5. UI: slider + toggle anidado en el panel avanzado, badge, strings en `i18n/es.ts`; `test:e2e`.

Rollback: el cambio es aditivo y opcional; revertir datos+motor restaura el comportamiento previo (la fracción por defecto 0 ya es no‑op).

## Open Questions

- ¿GPT‑5.4 entra en el alcance inicial o solo GPT‑5.5 y Gemini Pro? (La propuesta incluye ambos GPT; confirmable al implementar según se quieran cargar los datos.)
- ¿El badge debe mostrar el umbral concreto (>200K / >272K) o basta "Contexto largo"? Decisión de UI menor, resoluble en implementación.
