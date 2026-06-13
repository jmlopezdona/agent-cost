## Context

AgentCost calcula hoy el coste de agentes solo sobre Anthropic. El motor (`src/engine/`) es **puro y casi agnóstico al modelo**: `computeResults`, `blendedRate` y `categoryCosts` ya iteran genéricamente sobre `MODEL_IDS`. Lo que está soldado a "4 modelos Claude" vive fuera del motor, en cuatro sitios:

- `src/engine/types.ts`: `MODEL_IDS = ['fable','opus','sonnet','haiku']` (unión plana) y `TOKEN_CATEGORIES` fijas (input/output/cache_read/cache_write).
- `src/store/useScenarioStore.ts`: `MixSliderId = 'fable'|'opus'|'sonnet'` y `mixRemainder(fable, opus, sonnet)` (Haiku = resto fijo).
- `src/components/controls/ModelMixSection.tsx`: `SLIDER_MODELS = ['fable','opus','sonnet']` (3 sliders) + display de Haiku.
- `src/store/urlSync.ts`: claves `mf/mo/ms` fijas para la mezcla.

El problema conceptual de fondo: las 4 categorías de token (`input/output/cache_read/cache_write`) son la forma del pricing de **Anthropic**. OpenAI no cobra escritura de caché; Gemini cobra el caché explícito por **almacenamiento por hora** (dimensión temporal, no por llamada). Por eso esto no es "añadir filas a `pricing.json`" sino generalizar el modelo de coste.

Dos decisiones de producto ya tomadas acotan el alcance y, de hecho, **se abaratan entre sí**:

1. **Single-provider por escenario** (sin mezcla cruzada de familias; el cruce se reserva al futuro modo flota).
2. **Categorías de coste por proveedor** (el camino preciso, no aproximar OpenAI/Gemini con las categorías de Anthropic).

La sinergia: como un escenario solo tiene un proveedor activo, **nunca coexisten dos esquemas de categorías** en el donut, el perfil de tokens ni el editor de precios. Eso elimina el 90% del coste de "categorías por proveedor" (no hay que reconciliar 4 vs 3 vs 5 categorías) y preserva intactos el modelo resto, los modificadores y los presets.

Restricción dura del repo: el caso dorado P2 de Anthropic (blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes, ponderado ≈ 6.040 $/mes, error < 1%) es intocable y actúa como red de regresión de todo el refactor.

## Goals / Non-Goals

**Goals:**

- Soportar tres familias (Anthropic, OpenAI, Google) con su catálogo de modelos (tier reducido 3–4) y sus precios oficiales editables.
- Modelar con fidelidad las diferencias de caché de cada proveedor mediante un esquema de coste declarativo por proveedor (`CostCategory`), manteniendo el motor puro.
- Selector de familia que filtra presets y fija el proveedor activo; tabs por familia en mezcla y precios.
- Modificadores condicionales por proveedor (Batch en los tres; recargo regional en Anthropic y OpenAI, no en Google), aplicados por el motor según el proveedor de cada modelo.
- URL multi-proveedor con retrocompatibilidad de enlaces antiguos.
- Reproducir bit a bit el caso dorado de Anthropic tras el refactor.

**Non-Goals:**

- **Mezcla cruzada entre proveedores dentro de un mismo escenario** (un agente repartido entre Claude y GPT). Fuera de alcance por decisión de producto.
- **Modo flota** (sumar varios escenarios single-provider). Cambio separado posterior; es el hogar natural del cruce entre proveedores.
- Modelar el catálogo completo de cada proveedor (solo tier reducido).
- Cálculo fiscal o de infraestructura propia (sigue fuera, como en v1).
- Conexión en vivo a APIs de precios (los precios siguen en `pricing.json` versionado).

## Decisions

### D1 — `CostCategory` declarativo por proveedor (tipos `rate` y `storage`)

Cada proveedor declara su `costModel: CostCategory[]`. Cada categoría describe **cómo se mide y cómo se cobra**:

```ts
type CostKind = 'rate' | 'storage'

interface CostCategory {
  key: string            // 'input' | 'output' | 'cache_read' | 'cache_write' | 'cached_input' | 'cache_storage'
  kind: CostKind
  // input de tasa de tokens que la dirige (clave en el perfil de tokens del escenario)
  rateKey: string        // p.ej. 'inputK', 'cacheReadM', 'cacheStorageM'
  unit: 'k' | 'M'        // factor de escala de la tasa frente a $/MTok
}

interface ProviderCostModel {
  categories: CostCategory[]
}
```

- `rate`: `coste/h = (tasa / escala) × precio` — exactamente la fórmula actual de RF-01 por categoría.
- `storage`: `coste = (tokens_retenidos) × precio × horas_programadas` — término temporal de Gemini. No entra en el "coste por hora activa" sino en el coste mensual, ver D3.

Esquemas por proveedor:

| Proveedor | Categorías (`key:kind`) |
|---|---|
| Anthropic | `input:rate`, `output:rate`, `cache_read:rate`, `cache_write:rate` |
| OpenAI | `input:rate`, `cached_input:rate`, `output:rate` |
| Google | `input:rate`, `output:rate`, `cache_read:rate`, `cache_storage:storage` |

**Por qué declarativo y no clases por proveedor**: el motor sigue siendo un reductor genérico sobre `categories`; añadir un proveedor o cambiar su forma de caché es editar datos + (a lo sumo) un nuevo `kind`, no ramificar lógica. Mantiene la regla dura "datos en JSON, motor puro".

**Alternativa descartada**: mantener 4 categorías universales y poner `cache_write=0` en OpenAI/Gemini (Camino A). Más barato, pero falsea el donut y no modela el almacenamiento de Gemini; producto eligió precisión.

### D2 — Invariante del caso dorado mediante equivalencia de esquema

El esquema de Anthropic (`input/output/cache_read/cache_write`, todas `rate`, escalas `k/k/M/k`) debe reducir **exactamente** a la fórmula RF-01 actual. El test dorado de `engine.test.ts` se mantiene sin cambios de valores esperados; si falla, el refactor es incorrecto. Esto da una red de regresión continua: cualquier generalización se valida contra P2.

### D3 — El término `storage` entra en el coste mensual, no en el blend $/h

`cache_storage` se cobra por tiempo, no por hora activa. Modelo:

```
coste_storage_mensual = tokens_retenidos_M × precio_storage_USD_MTok_h × horas_mes_programadas
```

Se suma al `techo_mensual`/`ponderado_mensual` **fuera** del `blend_hora`, porque mezclarlo en $/h activa distorsionaría la métrica héroe y el donut de "coste por hora". El donut mostrará el storage como su propia métrica/segmento mensual, no como tajada de $/h.

- **Opt-in, default apagado**: el caso base de Gemini modela la caché **implícita** (sin storage). El usuario activa el término e introduce `tokens_retenidos` (nuevo input del perfil, solo visible en Gemini). Evita obligar a estimar un dato que el usuario raramente conoce.
- **Por qué separado**: preserva el invariante "blend $/h" como comparable entre proveedores y deja el coste temporal como un extra explícito y auditable.

**Alternativa descartada**: prorratear el storage en $/h activa dividiendo por horas activas. Rompe la comparación entre proveedores y mezcla dos naturalezas de coste.

### D4 — `ProviderId` + `ModelId` con namespace

```ts
type ProviderId = 'anthropic' | 'openai' | 'google'
type ModelId = `${ProviderId}:${string}`   // 'anthropic:opus', 'openai:gpt-5'
```

`pricing.json` pasa a `providers: Record<ProviderId, { name, costModel, modifiers, remainderModel, models }>`. La mezcla del escenario es un `Record<string, number>` sobre los modelos **del proveedor activo** (claves locales sin prefijo dentro del proveedor; el prefijo se usa en tipos públicos y URL).

- **`remainderModel` por proveedor**: cada proveedor designa el modelo que absorbe el resto hasta 100% (Anthropic: `haiku`; OpenAI: el `nano`; Google: `flash-lite`). `mixRemainder` se generaliza a "1 − Σ(sliders del proveedor)". Sigue habiendo N−1 sliders + 1 resto, pero N y cuál es el resto vienen de datos.

**Por qué single-provider salva el remainder**: la suma a 1 es local al proveedor activo; no hay que decidir qué familia absorbe el resto a nivel global.

### D5 — Modificadores por proveedor en el motor

`pricing.json` declara por proveedor qué modificadores ofrece y su magnitud:

```jsonc
"modifiers": { "batch": { "discount": 0.5 }, "regional": { "surcharge": 1.10 } }  // Anthropic (regional default ON)
"modifiers": { "batch": { "discount": 0.5 }, "regional": { "surcharge": 1.10 } }  // OpenAI (regional default OFF)
"modifiers": { "batch": { "discount": 0.5 } }                                      // Google (sin regional)
```

`priceModifier()` pasa de global a **función del proveedor**: aplica solo los modificadores que ese proveedor ofrece y que estén activos. Como el escenario es single-provider, el estado del store guarda los flags del proveedor activo y la UI muestra solo los toggles ofrecidos (el toggle regional desaparece en Google). El **default del regional depende del proveedor**: ON en Anthropic (acceso vía Bedrock como caso base, comportamiento previo), OFF en OpenAI (los endpoints de residencia regional, +10% para modelos publicados desde 2026-03-05, son opt-in y no el caso base). El research (`research/pricing-2026-06.md`) confirmó que OpenAI también aplica recargo regional, revisando la asunción inicial "solo Anthropic".

**Por qué en el motor y no en UI**: mantiene el cálculo correcto si en el futuro (flota) coexisten proveedores; cada modelo conoce su proveedor.

### D6 — Perfil de tokens adaptativo guiado por `costModel`

Los controles de tasa de tokens se renderizan a partir de `rateKey`/`unit`/rango de las categorías `rate` del proveedor activo (más el input de `tokens_retenidos` cuando el storage está activo). El rango y la ayuda contextual de cada control viven en datos/i18n por `key`. Anthropic sigue mostrando 4 controles idénticos a hoy.

**Por qué**: evita hardcodear 4 sliders; el perfil queda derivado del esquema, no del proveedor concreto.

### D7 — Presets etiquetados por proveedor

Cada preset gana `provider: ProviderId`. El selector de cabecera filtra por la familia activa; cambiar de familia carga el preset por defecto de esa familia. Los seis presets actuales se etiquetan `anthropic`; se añaden análogos P1–P6 para OpenAI y Google con sus mezclas, tokens y `learnings`. `isPreset` valida que el `mix` solo referencie modelos del `provider` del preset y sume 1.

### D8 — URL multi-proveedor con retrocompatibilidad

- Nueva clave `pr` = proveedor activo (omitida si es el default, p.ej. `anthropic`).
- Claves de mezcla generadas por modelo del proveedor activo: `m.<modelKey>` (p.ej. `m.opus`), solo diffs frente al preset base. Claves de perfil de tokens por `rateKey`.
- **Retrocompat**: al leer un enlace sin `pr`, se asume `anthropic`; las claves legacy `mf/mo/ms` mapean a los modelos de Anthropic, y `px` con `fable.input` se interpreta como override de `anthropic:fable`. Round-trip nuevo y de retrocompat en `urlSync.test.ts`.
- `pv` (versión de precios) se mantiene; al cambiar el esquema de `pricing.json` se incrementa `version`.

## Risks / Trade-offs

- **[Refactor del motor rompe el caso dorado]** → El test de P2 es bloqueante y se ejecuta en cada cambio; se aborda Anthropic primero y se verifica antes de tocar UI/URL.
- **[`pricing.json` cambia de forma → rompe type guards, store y URL a la vez]** → Cambio coordinado de `types.ts` + `index.ts` + migración de `pricing.json`/`presets.json` en una sola tarea de "datos+tipos"; `tsc -b` y los tests de datos como puerta.
- **[Precios de OpenAI/Gemini incorrectos o desactualizados]** → Bloque de research aparte con fuente y fecha en cada modelo; `version`/`effective_date` por proveedor; banner de antigüedad reutilizado. Es el punto más fácil de introducir error: revisión humana de la tabla antes de cerrar.
- **[El término storage de Gemini confunde al usuario]** → Opt-in apagado por defecto (caché implícita), input visible solo al activarlo, ayuda contextual y disclaimer de que el caché explícito es una estimación.
- **[Enlaces compartidos antiguos dejan de abrir]** → Retrocompat explícita (sin `pr` ⇒ Anthropic, `mf/mo/ms`/`fable.*` mapeados) con tests dedicados; CA-09.1 sigue cubierto.
- **[Bundle > 250 kB al añadir datos/UI]** → `npm run size` como puerta; los datos de precios son pequeños; las tabs reutilizan componentes existentes.
- **[Alcance creep hacia mezcla cruzada/flota]** → Explicitado como Non-Goal; el motor por-proveedor (D5) deja el hook listo sin implementarlo.

## Migration Plan

1. **Datos + tipos** (átomo): `ProviderId`/`ModelId` namespaced, `CostCategory`/`CostModel`, migrar `pricing.json` a `providers{}` (solo Anthropic al principio, equivalente exacto al actual) y `presets.json` con `provider`. Type guards y tests de datos verdes; caso dorado verde.
2. **Motor**: generalizar `categoryCosts`/`hourlyRate`/`blendedRate`/`computeResults` a iterar `costModel`; `priceModifier` por proveedor; término `storage` en proyección mensual. Caso dorado verde.
3. **Store/URL**: proveedor activo, mezcla del proveedor activo, `remainderModel`; serialización dinámica + retrocompat; tests de round-trip.
4. **UI**: selector de familia, tabs de mezcla, perfil adaptativo, tabs de precios, modificadores condicionales, donut por categorías del proveedor activo. `test:e2e` verde.
5. **Contenido**: research de precios OpenAI/Google (jun 2026) → cargar modelos; redactar presets P1–P6 por familia con `learnings`.
6. **i18n**: `app.subtitle` genérico, nombres de proveedor, labels de categorías nuevas en es/en/fr.

Rollback: el cambio es aditivo en datos y reversible por commit; mientras solo exista el proveedor `anthropic` en `pricing.json`, la app se comporta como hoy (el selector muestra una sola familia).

## Resolved Decisions

- **Nº de modelos por proveedor**: **según catálogo real** → tras el research, **OpenAI 4** (gpt-5.5 / gpt-5.4 / gpt-5.4-mini / gpt-5.4-nano) y **Google 3** (Gemini 3.1 Pro Preview / 3.5 Flash / 3.1 Flash-Lite). Las tabs tienen distinto número de sliders entre familias.
- **Frontera de Gemini**: **Gemini 3.1 Pro Preview** (Preview; revisar precio en próximas actualizaciones).
- **Recargo regional**: declarado en **Anthropic + OpenAI** (Google sin regional); ver D5 para los defaults por proveedor. Precios y fuentes en `research/pricing-2026-06.md`.
- **Presets cross-familia**: **replicar la intención de P1–P6** (pair programming, delivery, diseño, evolutivos, QA nocturno, autónomo) con la mezcla adaptada al catálogo de cada proveedor, manteniendo la comparación 1:1 entre familias.
- **`cached_input` de OpenAI**: **control propio** en el perfil de tokens (`cached_input` k/h) con su ayuda contextual, igual que `cache_read` en Anthropic, para fidelidad y visibilidad en el donut.
- **Proveedor activo por defecto**: **Anthropic** (coherencia con el caso dorado P2, las URLs existentes y la identidad actual del producto).

## Open Questions

- Ninguna pendiente. Las decisiones de producto anteriores quedan cerradas; lo que resta es dato a confirmar en el research (precios oficiales y nº final de modelos por proveedor).
