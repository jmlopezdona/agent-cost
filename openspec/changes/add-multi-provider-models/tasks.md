## 1. Datos y tipos (átomo coordinado)

- [x] 1.1 Definir en `src/engine/types.ts`: `ProviderId`, `ModelId` con namespace (`${ProviderId}:${string}`), `CostKind` (`rate`|`storage`), `CostCategory` (`key`, `kind`, `rateKey`, `unit`) y `ProviderCostModel`
- [x] 1.2 Reestructurar `src/data/pricing.json` a `providers: Record<ProviderId, { name, costModel, modifiers, remainderModel, models }>`, migrando Anthropic con valores idénticos a los actuales (Fable/Opus/Sonnet/Haiku) y su `costModel` de 4 categorías `rate`
- [x] 1.3 Añadir `modifiers` por proveedor en `pricing.json` (Anthropic: `batch` + `regional`; OpenAI/Google: solo `batch`) y `remainderModel` por proveedor
- [x] 1.4 Actualizar type guards en `src/data/index.ts`: validar `costModel`, precios por cada categoría del `costModel`, `remainderModel` existente entre los modelos, y `modifiers`
- [x] 1.5 Etiquetar cada preset de `src/data/presets.json` con `provider: 'anthropic'` y validar en `isPreset` que la mezcla solo referencia modelos del proveedor y suma 1
- [x] 1.6 `npm run typecheck` + tests de datos verdes; el golden case de P2 (`engine.test.ts`) debe seguir pasando sin cambios de valores esperados

## 2. Motor de cálculo

- [x] 2.1 Generalizar `categoryCosts`/`hourlyRate` para recorrer el `costModel` del proveedor, aplicando la fórmula `rate` por categoría con su `rateKey`/`unit`
- [x] 2.2 Verificar la equivalencia exacta del esquema de Anthropic con la fórmula RF-01 actual (caso dorado intacto)
- [x] 2.3 Generalizar `blendedRate`/`computeResults` para iterar los modelos del proveedor activo (en vez de `MODEL_IDS` fijo)
- [x] 2.4 Implementar el término `storage` (Gemini): coste mensual `tokens_retenidos × precio_storage × horas_mes_programadas`, sumado al techo/ponderado fuera del blend por hora, opt-in y neutro por defecto
- [x] 2.5 Convertir `priceModifier` en función del proveedor: aplicar solo los modificadores declarados por el proveedor del modelo (batch en todos; regional en Anthropic y OpenAI, no en Google)
- [x] 2.6 Ampliar `engine.test.ts`: tarifa por hora con esquema OpenAI (3 categorías), término storage de Google (on/off), modificador regional ignorado en proveedores que no lo ofrecen, composición batch+regional; golden case de Anthropic verde

## 3. Store y URL

- [x] 3.1 Añadir `providerId` activo al escenario en `src/store/useScenarioStore.ts`; la mezcla pasa a referirse a los modelos del proveedor activo
- [x] 3.2 Generalizar `mixRemainder`/`setMix` para usar el `remainderModel` del proveedor activo y N−1 sliders dinámicos
- [x] 3.3 Acción de cambio de proveedor activo: carga el preset por defecto de la familia y resetea modificadores no aplicables
- [x] 3.4 `urlSync.ts`: serializar `pr` (omitido si default), claves de mezcla `m.<modelKey>` y de perfil de tokens por `rateKey`, solo diffs frente al preset base; añadir `pr` a `RECOGNIZED_KEYS`
- [x] 3.5 Retrocompatibilidad de lectura: enlace sin `pr` ⇒ `anthropic`; `mf/mo/ms` ⇒ Fable/Opus/Sonnet con Haiku resto; `px` con prefijos legacy (`fable.*`) ⇒ overrides de `anthropic:*`
- [x] 3.6 Ampliar `urlSync.test.ts`: round-trip multi-proveedor (Google) y round-trip de retrocompat de enlaces legacy

## 4. UI

- [x] 4.1 Selector de familia/proveedor en cabecera (`components/layout/`) que fija el proveedor activo y filtra presets; `app.subtitle` genérico
- [x] 4.2 `ModelMixSection.tsx`: tabs por familia (activa por defecto), sliders dinámicos del proveedor activo y modelo resto desde datos
- [x] 4.3 Perfil de tokens adaptativo: renderizar controles según las categorías `rate` del `costModel`, con rango y ayuda contextual por `key`; control de tokens retenidos solo con storage activo (Google)
- [x] 4.4 `AdvancedConfigSection.tsx`: tabs de precios por familia con las categorías del proveedor; toggles de modificadores condicionales (batch en todos; regional en Anthropic —default ON— y OpenAI —default OFF—, ausente en Google) y badges acordes
- [x] 4.5 Donut/desglose por las categorías del proveedor activo (ya data-driven); mostrar el coste de almacenamiento como métrica/segmento mensual propio cuando esté activo
- [x] 4.6 `npm run test:e2e` verde: cargar preset de cada familia, cambiar de familia, mover slider, copiar enlace y restaurar

## 5. Contenido: precios y presets de OpenAI y Google

- [x] 5.1 Research de precios oficiales OpenAI (jun 2026): tier reducido (3–4 modelos), categorías `input/cached_input/output`, con `source` y `effective_date` — ver `research/pricing-2026-06.md`
- [x] 5.2 Research de precios oficiales Google/Gemini (jun 2026): tier reducido, categorías `input/output/cache_read` + precio de `cache_storage` (USD/MTok·h), con fuente y fecha — ver `research/pricing-2026-06.md`
- [x] 5.3 Cargar modelos de OpenAI y Google en `pricing.json` con su `costModel`, `modifiers`, `remainderModel` y precios
- [x] 5.4 Redactar presets análogos a P1–P6 para OpenAI en `presets.json` (replicando la intención con mezcla de su catálogo) con `learnings`
- [x] 5.5 Redactar presets análogos a P1–P6 para Google en `presets.json` con `learnings`
- [x] 5.6 Revisión humana de la tabla de precios y presets nuevos antes de cerrar (punto de mayor riesgo de error de datos) — verificado contra fuentes oficiales OpenAI y Google: los precios cargados en `pricing.json` son correctos; presets nuevos referencian modelos válidos y suman 1. Correcciones aplicadas solo al doc de research (afirmación de fecha del regional retirada; caveat de redondeo del `cached_input` batch de gpt-5.4 documentado, decisión D-B)

## 6. i18n y cierre

- [x] 6.1 Añadir a `src/i18n/{es,en,fr}.ts`: nombres de proveedor/familia, labels de categorías nuevas (`cached_input`, `cache_storage`), textos del selector y ayuda contextual del término de almacenamiento
- [x] 6.2 Disclaimer del caché explícito de Gemini (estimación) visible al activar el storage
- [x] 6.3 Incrementar `version`/`effective_date` en `pricing.json` por el cambio de esquema
- [x] 6.4 Puerta final: `lint`, `typecheck`, `test`, `test:e2e`, `build` y `size` (< 250 kB gzip) en verde; golden case de P2 intacto
