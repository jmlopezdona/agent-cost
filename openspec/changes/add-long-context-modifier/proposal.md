## Why

Hoy `pricing.json` guarda un único precio por modelo, que corresponde al tramo de **contexto estándar (corto)**. Para OpenAI y Gemini Pro eso infravalora el coste real cuando el agente envía prompts grandes: la API nativa cobra un sobreprecio por encima de un umbral de input (Gemini Pro >200K: input ×2 / output ×1,5; GPT‑5.5 5/30→8/36 por encima de 272K). Anthropic no aplica (sirve el 1M a tarifa plana). Además, quien consume estos modelos a través de **GitHub Copilot** (canje de AI Credits) paga un recargo de contexto largo aún mayor que el de la API nativa (p. ej. GPT‑5.5 long 10/45 frente a 8/36). AgentCost no permite reflejar ninguno de los dos, así que las estimaciones de casos de uso con ventana grande quedan cortas justo en los modelos donde más importa.

## What Changes

- Nuevo modificador **Contexto largo** en configuración avanzada: un **slider de fracción** (0–100%) del trabajo que cae por encima del umbral, análogo al de Batch API. La fracción elegible se factura a la tarifa de contexto largo del modelo; el resto, a la estándar.
- El sobreprecio se aplica **solo a los modelos elegibles** de la mezcla. Gemini: únicamente los modelos Pro (Flash/Flash‑Lite son planos). OpenAI: GPT‑5.5 y GPT‑5.4 (mini/nano no tienen tramo). Anthropic: ningún modelo es elegible → el modificador queda inerte sobre el coste.
- El control es **global** (se arrastra entre familias, como Batch/Regional) y se muestra en las tres, pero se indica que solo impacta en el coste de las familias/modelos con tramo aplicable.
- Toggle **vía GitHub Copilot** anidado bajo Contexto largo: solo visible/efectivo cuando Contexto largo está activo. Sustituye las tarifas de contexto largo nativas por las de Copilot (más altas) en los modelos de OpenAI y Gemini donde proceda. Fuera de contexto largo no cambia nada (las tarifas estándar de Copilot coinciden con las nativas).
- Datos: cada modelo elegible declara en `pricing.json` su bloque de precios de contexto largo (nativo) y el delta de Copilot; el `costModel`/modifiers del proveedor declara la elegibilidad y el umbral.
- Badges de modificadores activos y parámetros nuevos en la URL/`sessionStorage` compartibles.

## Capabilities

### New Capabilities

_(ninguna; el cambio extiende capabilities existentes)_

### Modified Capabilities

- `cost-engine`: nueva regla de coste por modelo que mezcla tarifa estándar y de contexto largo según la fracción elegible, aplicada solo a modelos con tramo declarado; la tarifa de contexto largo conmuta a la variante Copilot cuando ese sub‑modo está activo. El caso dorado P2 (Anthropic) permanece inalterado.
- `advanced-config`: nuevo slider de Contexto largo (% elegible) con toggle anidado "vía GitHub Copilot", su estado por defecto (desactivado), su comportamiento global y su badge.
- `multi-provider`: declaración de elegibilidad de contexto largo por proveedor/modelo (qué modelos tienen tramo y su umbral); Anthropic sin modelos elegibles.
- `url-sharing`: nuevos parámetros serializados (fracción de contexto largo y flag de Copilot) en `PARAMS`, con round‑trip y diff frente al preset base.

## Impact

- **Datos**: `src/data/pricing.json` (bloques de precio de contexto largo + delta Copilot por modelo elegible; nuevo modificador `longContext` en `modifiers`; incrementar `version`/`effective_date`), type guards en `src/data/index.ts`.
- **Motor**: `src/engine/types.ts` (`ProviderModifiers`, `ModelPricing`, `EngineOptions`), `src/engine/engine.ts` (`priceModifier`/`categoryCosts` o nueva mezcla por modelo). Sin redondeo interno; pureza intacta.
- **Estado**: `src/store/useScenarioStore.ts` (estado global `longContextFraction` + `copilotPricing`, setters, reset, memoria de proveedor), `src/store/urlSync.ts` (`PARAMS`, `RECOGNIZED_KEYS`, defaults).
- **UI**: componentes de `controls/` (panel avanzado) y badges en `results/`; sin literales fuera de `src/i18n/es.ts`.
- **Tests**: `engine.test.ts` (nuevas tarifas + caso dorado intacto), `urlSync.test.ts` (round‑trip), `pricing`/`swePro` guards si cambia el shape; `test:e2e` por tocar UI.
