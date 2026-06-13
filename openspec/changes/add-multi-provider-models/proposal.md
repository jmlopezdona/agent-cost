## Why

Hoy AgentCost solo estima costes sobre la API de Anthropic, pero las decisiones de dimensionamiento y los business cases con clientes cada vez comparan también OpenAI/ChatGPT y Google/Gemini. El roadmap (PRD §13, Fase 3) ya lo prevé como "multi-proveedor". El motor es puro y casi agnóstico al modelo, así que el coste real está en generalizar datos, mezcla, modificadores y URL —no en el cálculo— y en modelar con honestidad que **cada proveedor cobra el caché de forma distinta**.

## What Changes

- **Selector de familia/proveedor** en cabecera (Anthropic/Claude · OpenAI/ChatGPT · Google/Gemini) que fija el **proveedor activo** del escenario y filtra los presets a esa familia.
- **Escenario single-provider**: un escenario usa una sola familia. El cruce entre proveedores queda **fuera de alcance** y se reserva al futuro "modo flota" (PRD §13). Esto mantiene limpios el modelo resto, los modificadores y los presets.
- **BREAKING — esquema de datos por proveedor**: `pricing.json` pasa de `models: Record<ModelId, …>` a `providers: Record<ProviderId, { name, costModel, modifiers, models }>`. Cada proveedor declara su **esquema de coste** (`CostCategory[]`) y qué modificadores ofrece.
- **Categorías de coste por proveedor** (esquema `CostCategory` con tipo `rate` o `storage`):
  - Anthropic: `input`, `output`, `cache_read`, `cache_write` (todas `rate`).
  - OpenAI: `input`, `cached_input`, `output` (todas `rate`; sin coste de escritura de caché).
  - Google/Gemini: `input`, `output`, `cache_read`, `cache_storage`. `cache_storage` es de tipo `storage` (precio × tokens retenidos × horas programadas), **opt-in con default apagado** (se modela la caché implícita en el caso base).
- **Tier reducido de 3–4 modelos por proveedor** (frontera/medio/barato), con precios oficiales de junio 2026 en `pricing.json`.
- **BREAKING — `ModelId` con namespace de proveedor** (`anthropic:opus`, `openai:gpt-5`, `google:gemini-flash`). La mezcla pasa a ser un `Record` sobre los modelos del proveedor activo.
- **Modelo resto configurable por proveedor** (ya no fijo a Haiku): cada proveedor designa qué modelo absorbe el resto del 100%.
- **Perfil de tokens adaptativo**: los controles de tasa de tokens se renderizan según el `costModel` del proveedor activo (4 para Anthropic, 3 para OpenAI, 4 para Gemini incl. tokens retenidos).
- **Modificadores condicionales por proveedor**: Batch (−50%) en los tres; recargo regional (+10%) en **Anthropic y OpenAI** (no en Google/Vertex por ahora), con default ON en Anthropic (Bedrock como base) y OFF en OpenAI (residencia regional opt-in). El motor aplica a cada modelo los modificadores de su proveedor; la UI muestra solo los toggles ofrecidos por el proveedor activo.
- **Tabs por familia** en el editor de precios avanzado (la del proveedor activo por defecto), reutilizando el mecanismo de overrides.
- **Presets etiquetados por proveedor**: los seis presets actuales pasan a Anthropic; se añaden presets análogos (P1–P6) para OpenAI y Gemini.
- **URL multi-proveedor**: clave de proveedor activo, claves de mezcla y de perfil de tokens generadas dinámicamente por proveedor, con **retrocompatibilidad** de enlaces antiguos (`mf/mo/ms`, `px` con `fable.*` → `anthropic:*`).
- **Invariante intocable**: el escenario por defecto y el caso dorado P2 de Anthropic (blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes, ponderado ≈ 6.040 $/mes) deben seguir reproduciéndose con error < 1%.

## Capabilities

### New Capabilities

- `multi-provider`: abstracción de proveedor/familia (Anthropic, OpenAI, Google), selector de proveedor activo en cabecera, semántica single-provider del escenario, esquema de coste por proveedor (`CostCategory` con tipos `rate`/`storage`) y catálogo de modelos con modelo resto configurable.

### Modified Capabilities

- `cost-engine`: el cálculo deja de asumir 4 categorías fijas de Anthropic; itera el `costModel` del proveedor activo, soporta el término `storage` (Gemini) y aplica modificadores por proveedor. Modelos con namespace de proveedor.
- `calculator-controls`: el control de mezcla gana tabs por familia (activa por defecto) y modelo resto por proveedor; el perfil de tokens se adapta a las categorías del proveedor activo.
- `advanced-config`: la tabla de precios editable y los modificadores se organizan por proveedor (tabs); los toggles de Batch/regional aparecen según los modificadores que ofrezca el proveedor activo.
- `scenario-presets`: los presets se etiquetan por proveedor y el selector los filtra por la familia activa; se añaden presets de OpenAI y Gemini.
- `url-sharing`: serialización del proveedor activo y claves de mezcla/perfil dinámicas por proveedor, con retrocompatibilidad de enlaces previos a Anthropic.

## Impact

- **Datos**: `src/data/pricing.json` (nuevo esquema `providers`), `src/data/presets.json` (tag de proveedor + presets nuevos), type guards en `src/data/index.ts`. `salaries.json` sin cambios (la comparativa es agnóstica al proveedor).
- **Motor**: `src/engine/types.ts` (`ProviderId`, `ModelId` namespaced, `CostCategory`, `CostModel`), `src/engine/engine.ts` (iteración por `costModel`, término `storage`, modificadores por proveedor). Cobertura de regresión: el golden case de Anthropic.
- **Store/URL**: `src/store/useScenarioStore.ts` (proveedor activo, mezcla del proveedor activo, modelo resto), `src/store/urlSync.ts` (claves dinámicas + retrocompat) y `urlSync.test.ts`.
- **UI**: nuevo selector de familia (`layout/`), `controls/ModelMixSection.tsx` (tabs), perfil de tokens adaptativo, `controls/AdvancedConfigSection.tsx` (tabs de precios + modificadores condicionales), donut por categorías del proveedor activo.
- **i18n**: `src/i18n/{es,en,fr}.ts` — `app.subtitle` genérico, nombres de proveedor, labels de categorías nuevas (`cached_input`, `cache_storage`).
- **Contenido / research**: precios oficiales OpenAI y Gemini (jun 2026) y redacción de presets análogos a P1–P6 por familia.
- **Fuera de alcance**: mezcla cruzada entre proveedores y modo flota (sumar escenarios) — futuros cambios.
