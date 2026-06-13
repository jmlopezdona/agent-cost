## Context

Tras `add-multi-provider-models`, AgentCost compara coste entre tres familias, pero el motor (`src/engine/engine.ts`) solo modela **coste**. La mezcla de modelos (`ModelMix`) reparte fracciones entre los modelos del proveedor activo y el blend pondera **tarifa $/h** por esas fracciones. No hay ninguna noción de **capacidad** del modelo: dos mezclas con idéntico coste pueden tener desempeños muy distintos para programar.

El análisis con SWE-bench Pro (jun 2026) mostró que las gamas de los tres proveedores **no se alinean por posición**:

| Tier | Anthropic | OpenAI | Google |
|---|---|---|---|
| Halo / frontera+ | Fable 5 | — | — |
| Frontera | Opus 4.8 | GPT-5.5 | — |
| Workhorse / medio | Sonnet 4.6 | GPT-5.4 | Gemini 3.1 Pro |
| Barato / rápido | Haiku 4.5 | GPT-5.4-mini | Gemini 3.5 Flash |
| Ultra-barato | — | GPT-5.4-nano | Gemini 3.1 Flash-Lite |

Los presets análogos mapean **por slot**, lo que empareja modelos de tiers distintos (p. ej. la "cuota Fable" cae sobre Gemini 3.1 Pro, que rinde como un Sonnet). El coste solo, sin desempeño, esconde esa asimetría. Este cambio **no reescribe los presets**; añade la señal de desempeño para que la asimetría sea **visible y cuantificada** en la UI y en futuras decisiones de mezcla.

**Caveat metodológico que vertebra el diseño**: SWE-bench Pro tiene **dos familias de cifras no comparables entre sí** — la estandarizada de Scale (SEAL, mismo scaffold para todos) y la *vendor-reported* (scaffold propio, sistemáticamente más alta). Además, varios modelos del catálogo (Sonnet 4.6, los mini/nano de OpenAI, los Flash de Gemini) **no tienen medición publicada**. Cualquier KPI de desempeño honesto debe (a) preferir una base comparable, (b) marcar la procedencia de cada número y (c) avisar de los límites de la comparación entre familias.

Restricción dura del repo: el `swePro` es **dato de referencia que NO toca el coste**. El caso dorado P2 de Anthropic es la red de regresión: si cambia un solo importe de coste, el cambio es incorrecto.

## Goals / Non-Goals

**Goals:**

- Modelar el desempeño en SWE-bench Pro como dato versionado por modelo, con base (`standard`/`vendor`/`estimate`) y confianza explícitas.
- Derivar dos KPIs en el motor puro: desempeño ponderado del mix y coste por punto de desempeño.
- Mostrar ambos KPIs como tarjetas (no héroe) y el score de cada modelo en el control de mezcla.
- Hacer **visible la incertidumbre**: indicador de confianza por score y disclaimer de comparabilidad entre familias.
- No tocar el cálculo de coste; reproducir el caso dorado de Anthropic intacto.

**Non-Goals:**

- **Editar el score** desde la UI (no es un knob del escenario; es dato de referencia como las fuentes de precio).
- **Reescribir los presets** para realinear tiers (decisión de mezcla posterior; este cambio aporta la señal que la informaría).
- **Otros benchmarks** (Terminal-Bench, SWE-Verified, evals propios). SWE-bench Pro es el único alcance.
- **Ponderar por tokens o por coste** en vez de por fracción de mezcla (ver D2).
- **Cruzar el KPI con el modo flota** o normalizar entre proveedores con un factor: se evita "inventar" comparabilidad; se documenta el límite.

## Decisions

### D1 — `swePro` declarativo por modelo en `pricing.json`

Cada modelo gana un bloque opcional en datos, validado por type guard:

```ts
type SweProBasis = 'standard' | 'vendor' | 'estimate'
type Confidence = 'high' | 'medium' | 'low'

interface SwePro {
  score: number          // 0–100, % pass-rate en SWE-bench Pro
  basis: SweProBasis     // 'standard' (Scale SEAL) | 'vendor' | 'estimate'
  confidence: Confidence
  source?: string
  effective_date?: string
}
```

`ModelPricing` gana `swePro?: SwePro`. Vive en `pricing.json` (regla dura "datos en JSON, no en código") junto al precio, y viaja con `version`/`effective_date` de la tabla.

**Metodología (decisión de producto: vendor-first — confiar en el dato del proveedor)** — orden de preferencia al cargar el número:

1. **`vendor`** (score publicado por el propio proveedor para ese modelo) siempre que exista → `confidence: high`.
2. **`estimate`** anclado al flagship publicado de **esa misma familia** cuando el proveedor no publica número para el modelo → `confidence: low`.
3. **`standard`** (Scale SEAL) solo como último recurso para un modelo sin dato de proveedor → `confidence: medium`, marcado por no ser comparable con los anclas vendor de su familia.

> ⚠️ Consecuencia asumida: los proveedores **solo publican Pro de sus buque-insignia** (Anthropic Fable 80,3 / Opus 69,2 · OpenAI GPT-5.5 58,6 · Google Gemini 3.1 Pro 46,1). El resto de la gama (Sonnet 4.6, Haiku, GPT-5.4/mini/nano, los Flash) queda como `estimate`. Además los scaffolds vendor **inflan 15–30 puntos** sobre el estandarizado y difieren entre proveedores, por lo que el KPI sube respecto a una base SEAL y la comparación **entre familias** es indicativa. Los valores concretos y su justificación están en `research/swebench-pro-2026-06.md` y **exigen revisión humana** (tarea de cierre).

**Alternativa descartada**: normalizar todo a la base estandarizada SEAL (única comparable entre familias). Más comparable, pero el producto eligió **confiar en el dato del proveedor**; se compensa con el flag de confianza y el disclaimer. Descartado también un `score: number` plano sin base/confianza: ocultaría que se mezclan scaffolds y modelos sin medir.

### D2 — Desempeño ponderado por **fracción de mezcla**

```
weightedSwePro = Σ (mix_modelo × score_modelo)   // sobre los modelos del proveedor activo
```

Misma ponderación que el blend de coste (fracción de mezcla), de modo que ambos KPIs son **coherentes**: el blend es "$/h si repartes el trabajo así" y el desempeño es "puntos SWE-Pro si repartes el trabajo así".

- **Por qué por fracción y no por tokens/coste**: la fracción de mezcla es la intención del usuario ("60% de las tareas las lleva el modelo X"). Ponderar por coste castigaría dos veces a los modelos caros y por tokens introduciría un dato que el perfil no separa por modelo. Coherencia con el blend manda.
- **Cobertura parcial**: si algún modelo del mix no tiene `score`, se pondera sobre los que sí lo tienen y se renormaliza, exponiendo `sweProCoverage` (fracción de la mezcla con score) para que la UI marque "parcial". Con la metodología D1 (todo modelo recibe al menos un `estimate`) la cobertura normal es 1.

### D3 — Coste por punto = ponderado mensual / desempeño ponderado

```
costPerPointUSD = weightedMonthlyUSD / weightedSwePro   // USD/mes por punto SWE-Pro; 0 si weightedSwePro = 0
```

Relaciona el número héroe (ponderado mensual) con el desempeño. Lectura: "cada punto de capacidad SWE-Pro de este agente cuesta X €/mes". Comparando dos familias con **idénticos knobs de carga** (horas, duty, agentes, perfil de tokens), el workload se cancela en el cociente y el ratio refleja coste-eficacia pura; como cifra absoluta sirve también para el business case mensual.

- **Por qué el ponderado mensual y no el blend $/h**: la métrica héroe es el ponderado mensual; el coste/punto hereda esa unidad y se lee directo en el caso de negocio. Se documenta que escala con la carga (no es un ratio de calidad puro del modelo).
- **Guarda**: `weightedSwePro = 0` (sin scores) ⇒ `costPerPointUSD = 0` y la tarjeta muestra "n/d".

**Alternativa considerada**: `blendedRate / weightedSwePro` (USD/h·punto, invariante a la carga). Más "puro" pero menos legible en el business case; se menciona como posible métrica secundaria futura, no se implementa.

### D4 — KPIs derivados, no almacenados; sin impacto en URL

`weightedSwePro`, `costPerPointUSD` y `sweProCoverage` se calculan en `computeResults` y viven en `Results` (regla dura "resultados derivados, no almacenados"). El `score` es dato de `pricing.json`, **no** estado del escenario: **no** se añade a `PARAMS` ni a `RECOGNIZED_KEYS` de `urlSync.ts`, y los enlaces compartidos no cambian. La versión de precios (`pv`) ya cubre cualquier actualización de scores al incrementar `version`.

### D5 — Presentación: tarjetas no héroe + confianza + disclaimer

- **Dos tarjetas nuevas** en `MetricCards`, no héroe (el ponderado mensual sigue siendo el héroe): "Desempeño SWE-Pro" (`weightedSwePro` como %) y "Coste/punto" (`costPerPointUSD` en la moneda activa). Se insertan tras el ponderado anual y antes de la tarjeta de storage.
- **Indicador de confianza**: si la mezcla incluye algún score `estimate` o `confidence: low`/`medium`, la tarjeta de desempeño marca el valor como aproximado (prefijo `≈` y `hint` con el motivo). Si todo es `standard`/`high`, sin marca.
- **% por modelo en la mezcla** (`ModelMixSection`): el nombre de cada modelo (sliders y modelo resto) muestra su score entre paréntesis, con `≈` cuando no es `standard`. Al pie, junto al blend, el desempeño ponderado del mix.
- **Disclaimer de comparabilidad**: nota visible (cerca de las tarjetas o del control de mezcla) de que el score mezcla bases metodológicas y que la comparación **entre familias** es indicativa; un solo texto i18n, no por modelo.

### D6 — Type guard exige `swePro` con dominios válidos

`isPricingTable`/`isModelPricing` validan que, si existe `swePro`: `score ∈ [0,100]`, `basis ∈ {standard,vendor,estimate}`, `confidence ∈ {high,medium,low}`. Para no romper la carga incremental, `swePro` es **opcional** a nivel de tipo pero la **puerta de cierre** exige que **todos** los modelos del catálogo lo lleven (cobertura 1). El motor es defensivo ante su ausencia (D2).

## Risks / Trade-offs

- **[El KPI ponderado se compara ingenuamente entre familias y engaña]** → Es el riesgo central y se **agrava** al confiar en datos de proveedor (scaffolds que inflan distinto por familia). Mitigación triple: flag de confianza por score con marca `≈` en la UI, disclaimer explícito de comparabilidad (D5) que advierte de la inflación vendor, y `basis` por score para auditar la procedencia. El diseño **no** promete equivalencia entre familias; la cuantifica con su incertidumbre.
- **[Cobertura real de proveedor muy parcial]** → Solo los flagship tienen número publicado; el resto es `estimate` (`low`). Mitigación: anclar la estimación al flagship de la propia familia, marcar `≈` en la UI y dejar la revisión humana de los estimados como puerta de cierre. Si en el futuro un proveedor publica más números, es editar `pricing.json`.
- **[Números de SWE-bench Pro mal cargados o desactualizados]** → Bloque de research con fuente, base y fecha por modelo; revisión humana antes de cerrar (punto de mayor riesgo de dato, como la tabla de precios). `version`/`effective_date` de `pricing.json` se incrementan.
- **[El usuario lee `costPerPointUSD` como ratio de calidad puro]** → `hint` que aclara que escala con la carga; se documenta la alternativa $/h·punto.
- **[Tocar el motor rompe el caso dorado]** → El `swePro` no entra en ninguna fórmula de coste; el test de P2 (importes) es bloqueante y se mantiene sin cambios de valores. Solo se añade la aserción de `weightedSwePro`.
- **[Modelo del mix sin score → KPI roto]** → Renormalización sobre la cobertura y `sweProCoverage` para marcar "parcial"; metodología que garantiza al menos un `estimate` por modelo.
- **[Crecimiento del bundle]** → El `swePro` son pocos bytes por modelo y dos tarjetas reutilizan el componente existente; `npm run size` como puerta.

## Migration Plan

1. **Datos + tipos**: `SwePro`/`SweProBasis`/`Confidence` en `types.ts`, campo en `ModelPricing`, `weightedSwePro`/`costPerPointUSD`/`sweProCoverage` en `Results`. Type guard de `swePro`. Cargar scores (placeholder o research) en `pricing.json`. `tsc -b` + tests de datos verdes.
2. **Motor**: `computeResults` calcula los tres derivados; `swePro` fuera de toda fórmula de coste. Caso dorado de coste intacto; nueva aserción de `weightedSwePro` de P2.
3. **UI**: dos tarjetas en `MetricCards` con confianza; `ModelMixSection` con % por modelo y ponderado; disclaimer. `test:e2e` verde.
4. **i18n**: labels de métricas, formato del paréntesis, textos de confianza y disclaimer en es/en/fr.
5. **Contenido**: `research/swebench-pro-2026-06.md` con la tabla por modelo (score/base/confianza/fuente) y revisión humana; fijar valores definitivos en `pricing.json`; incrementar `version`/`effective_date`.

Rollback: aditivo y reversible por commit; con `swePro` ausente, el motor omite los KPIs y la UI no muestra las tarjetas (cobertura 0), comportándose como hoy.

## Open Questions

- **Valores definitivos de `score` por modelo**: dependen del research y de la revisión humana (`research/swebench-pro-2026-06.md`). Solo los flagship (Fable, Opus, GPT-5.5, Gemini Pro) tienen número de proveedor; el resto (Sonnet 4.6, Haiku, GPT-5.4/mini/nano, Flash/Flash-Lite) es `estimate` `low` y es el punto más débil.
- **¿Haiku 4.5 en escala vendor o SEAL?** Anthropic no publica su Pro; queda como `estimate` anclado a Opus vendor (sube ~a 50s) o como `standard` 39,5 (no comparable con Fable/Opus vendor). Se decide en la revisión humana; por defecto `estimate` para mantener la familia en una sola escala.
- **¿Mostrar `costPerPointUSD` en presentación/exportación?** Probable sí por coherencia, pero se confirma al implementar la UI (no bloquea el motor ni los datos).
