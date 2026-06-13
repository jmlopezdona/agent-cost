## Why

Con multi-proveedor (`add-multi-provider-models`) la app ya compara coste entre Anthropic, OpenAI y Google, pero el coste **solo cuenta media historia**: un escenario barato puede serlo porque usa modelos peores para programar. Hoy nada en la UI indica el **desempeño** del mix elegido, y eso lleva a dos errores en los business cases:

1. **Falsa equivalencia de mezclas entre familias.** Los presets análogos mapean los modelos **por posición** (slot 1 ↔ slot 1…), no por capacidad. Con datos de SWE-bench Pro se ve que las gamas son **asimétricas**: Anthropic tiene un modelo halo (Fable 5) sin par en OpenAI/Google; el "Pro" de Google rinde como un Sonnet; el flagship de OpenAI (GPT-5.5) es tier Opus, no tier Fable. Comparar coste sin comparar desempeño hace que Google/OpenAI parezcan "más baratos para el mismo trabajo" cuando en realidad fielan un modelo de menor capacidad.
2. **Sin lectura de coste-eficacia.** Falta un número que relacione lo que cuesta el agente con lo bien que programa.

Este cambio añade el **desempeño en SWE-bench Pro** como dato de primera clase por modelo y deriva dos KPIs (desempeño ponderado del mix y coste por punto), sin tocar el cálculo de coste ni el caso dorado.

## What Changes

- **Dato nuevo por modelo en `pricing.json`**: cada modelo gana un bloque `swePro` con `score` (% pass-rate en SWE-bench Pro), `basis` (`standard` = Scale SEAL estandarizado · `vendor` = scaffold del proveedor · `estimate` = estimación), `confidence` (`high`|`medium`|`low`), `source` y `effective_date`.
- **Metodología vendor-first con flag de confianza** (decisión de producto: confiar en los datos del proveedor): se carga el score **publicado por el propio proveedor** (`basis: 'vendor'`) siempre que exista; cuando el proveedor no publica número para un modelo (la mayoría de los no-flagship) se usa una **estimación** anclada al flagship de esa familia (`basis: 'estimate'`, `confidence: 'low'`), o el número estandarizado SEAL como último recurso (`basis: 'standard'`), **siempre marcando `basis` y `confidence`**. Los proveedores solo publican Pro de sus buque-insignia (Fable, Opus, GPT-5.5, Gemini Pro), así que la mayor parte de la gama queda estimada. Los números concretos van en `research/swebench-pro-2026-06.md` y requieren revisión humana antes de cerrar.
- **KPI de desempeño ponderado** en el motor: `weightedSwePro = Σ (mix_modelo × score_modelo)` sobre los modelos del proveedor activo. Derivado, no almacenado.
- **KPI de coste por punto** en el motor: `costPerPointUSD = ponderado_mensual / weightedSwePro` — coste mensual por punto de desempeño SWE-Pro (lectura de coste-eficacia).
- **Dos tarjetas de métrica nuevas** (no héroe): "Desempeño SWE-Pro" (% ponderado con indicador de confianza) y "Coste/punto". El ponderado mensual sigue siendo el número héroe.
- **% por modelo en la mezcla**: cada modelo del control de mezcla muestra su score SWE-Pro entre paréntesis junto al nombre (p. ej. "Claude Opus 4.8 (≈55%)"), incluido el modelo resto; al pie, el desempeño ponderado del mix junto al blend.
- **Disclaimer de comparabilidad**: aviso visible de que se confía en el dato de cada proveedor y de que, al usar cada familia su propio scaffold (que infla 15–30 puntos sobre el estandarizado), la comparación de desempeño **entre familias es indicativa, no una equivalencia**; los scores estimados o de baja confianza se marcan (p. ej. con `≈`).
- **Invariante intocable**: el `swePro` **no afecta a ningún cálculo de coste**; el caso dorado P2 de Anthropic (blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes, ponderado ≈ 6.040 $/mes) se reproduce sin cambios. Solo se añade el valor esperado de `weightedSwePro` de P2 como nueva cobertura.

## Capabilities

### New Capabilities

- `model-performance`: desempeño de cada modelo en SWE-bench Pro como dato versionado (`score`/`basis`/`confidence`/`source`), KPI de desempeño ponderado del mix, KPI de coste por punto y semántica de comparabilidad (base de proveedor preferente, flag de confianza, disclaimer entre familias).

### Modified Capabilities

- `cost-engine`: `Results` gana `weightedSwePro` y `costPerPointUSD`; el motor lee `swePro` de los modelos del proveedor activo. El cálculo de coste no cambia.
- `results-display`: dos tarjetas nuevas (desempeño ponderado y coste/punto) con indicador de confianza, y disclaimer de comparabilidad; alternativa textual accesible.
- `calculator-controls`: el control de mezcla muestra el score SWE-Pro de cada modelo entre paréntesis y el desempeño ponderado del mix al pie.

## Impact

- **Datos**: `src/data/pricing.json` (bloque `swePro` por modelo + `version`/`effective_date`), type guards en `src/data/index.ts` (validar `swePro`). `presets.json` sin cambios.
- **Motor**: `src/engine/types.ts` (`SwePro`, campo en `ModelPricing`, `weightedSwePro`/`costPerPointUSD` en `Results`), `src/engine/engine.ts` (sumatorio ponderado + coste/punto). Cobertura: `engine.test.ts` (P2 dorado intacto + nuevo valor de desempeño).
- **UI**: `src/components/results/MetricCards.tsx` (dos tarjetas + confianza), `src/components/controls/ModelMixSection.tsx` (% por modelo + ponderado), disclaimer.
- **i18n**: `src/i18n/{es,en,fr}.ts` — labels de las métricas, formato del paréntesis por modelo, textos de confianza y disclaimer.
- **Contenido / research**: tabla de scores SWE-bench Pro (jun 2026) con fuente, base y confianza por modelo; revisión humana antes de cerrar.
- **Sin cambios**: `urlSync.ts` (el score es dato de `pricing.json`, no estado del escenario; el KPI es derivado) y el cálculo de coste.
- **Fuera de alcance**: edición del score por el usuario (es dato de referencia, no knob); otros benchmarks (Terminal-Bench, SWE-Verified); ponderar por tokens/coste en vez de por fracción de mezcla.
