# Research de precios — OpenAI y Google Gemini (junio 2026)

Datos extraídos de fuentes primarias en vivo el **2026-06-13**. Todos los precios en **USD/MTok** salvo `cache_storage` (USD/MTok·hora). Este documento alimenta las tareas 5.1–5.3 y la carga de `pricing.json`.

## OpenAI

- **Fuente**: https://developers.openai.com/api/docs/pricing (la antigua `platform.openai.com/docs/pricing` redirige aquí). `openai.com/api/pricing/` devolvió 403.
- **Effective date**: la página no imprime fecha de "last updated"; capturado 2026-06-13.
- **Batch**: −50% aplica a la familia GPT-5.x (input/cached/output a la mitad).
- **Recargo regional**: ⚠️ la página indica **+10% de uplift para modelos publicados a partir del 2026-03-05** en endpoints de residencia regional. Es decir, **OpenAI también tiene un recargo regional**, no solo Anthropic (ver Decisión D-R abajo).
- **Categorías** (esquema OpenAI): `input`, `cached_input`, `output`. Sin coste de escritura de caché.

| id | tier | input | cached_input | output |
|---|---|---|---|---|
| gpt-5.5 | frontera | 5,00 | 0,50 | 30,00 |
| gpt-5.4 | alto/medio | 2,50 | 0,25 | 15,00 |
| gpt-5.4-mini | medio | 0,75 | 0,075 | 4,50 |
| gpt-5.4-nano | barato (**resto**) | 0,20 | 0,02 | 1,25 |

- **remainderModel**: `gpt-5.4-nano`.
- **Notas**: el flagship actual es GPT-5.5 / GPT-5.4 (con -mini/-nano/-pro); ya no existe un "gpt-5" pelado. Las variantes `-pro` (30/—/180) no tienen precio de cached input ni, probablemente, batch → excluidas del tier reducido. Confianza alta en los 4 números (leídos en dos fetches coincidentes); el render de la columna Batch fue inconsistente entre fetches pero fuentes secundarias confirman −50%.

## Google Gemini

- **Fuente**: https://ai.google.dev/gemini-api/docs/pricing (= `ai.google.dev/pricing`).
- **Effective date**: **Last Updated 2026-06-09 UTC** (impreso en la página).
- **Batch**: −50% sobre input/output estándar. Confirmado.
- **cache_storage**: unidad confirmada **USD por 1.000.000 tokens por HORA** (coste temporal del caché explícito, separado del precio de lectura de caché).
- **Categorías** (esquema Google): `input`, `output`, `cache_read`, `cache_storage` (storage).

| id | tier | input | output | cache_read | cache_storage (/h) |
|---|---|---|---|---|---|
| Gemini 3.1 Pro Preview | frontera | 2,00 | 12,00 | 0,20 | 4,50 |
| Gemini 3.5 Flash | medio | 1,50 | 9,00 | 0,15 | 1,00 |
| Gemini 3.1 Flash-Lite | barato (**resto**) | 0,25 | 1,50 | 0,025 | 1,00 |

- **remainderModel**: `Gemini 3.1 Flash-Lite`.
- **Caveats**:
  - **Tiering por tamaño de prompt** (solo modelos Pro): se reportan precios del tramo **≤200k tokens** (estándar). El tramo >200k existe: Gemini 3.1 Pro Preview >200k = input 4,00 / output 18,00 / cache_read 0,40 (storage no cambia). Flash y Flash-Lite son tarifa plana. Nuestro motor usa un único precio por categoría → usar el tramo ≤200k y documentar el caveat.
  - **Frontera "Preview"**: Gemini 3.1 Pro está marcado *Preview* (precio sujeto a cambio). Alternativa GA estable: **Gemini 2.5 Pro** (≤200k: input 1,25 / output 10,00 / cache_read 0,125 / storage 4,50/h).
  - **Implícito vs explícito**: el coste de storage/hora aplica al caché **explícito**; el implícito (automático) no tiene coste de almacenamiento y solo cobra la lectura descontada. Esto NO está citado literal en la página actual (inferido del modelo de facturación de Gemini). Coherente con nuestra decisión D3: `cache_storage` opt-in, default apagado (caché implícita).
  - Output incluye tokens de thinking/razonamiento.

## Decisiones (resueltas)

- **Recargo regional en OpenAI** → **declarado en Anthropic + OpenAI** (+10%). Google/Vertex queda sin regional por ahora (no extraído). Matiz de defaults: Anthropic default **ON** (acceso vía Bedrock como caso base); OpenAI default **OFF** (los endpoints de residencia regional son opt-in, no el caso base).
- **Frontera de Gemini** → **Gemini 3.1 Pro Preview** (2,00 / 12,00 / 0,20 / 4,50). Aceptado que es Preview: revisar el precio en la próxima actualización de `pricing.json`.
- **Nº de modelos** → **OpenAI 4** (5.5 / 5.4 / mini / nano) · **Gemini 3** (Pro Preview / Flash / Flash-Lite). Asimétrico, fiel al catálogo.

## Carga propuesta a `pricing.json` (tarea 5.3)

```
providers.openai
  modifiers: { batch: {discount: 0.5}, regional: {surcharge: 1.10} }   // regional default OFF en store
  remainderModel: gpt-5.4-nano
  costModel: input/cached_input/output (rate)
  models: gpt-5.5, gpt-5.4, gpt-5.4-mini, gpt-5.4-nano   (precios tabla arriba)

providers.google
  modifiers: { batch: {discount: 0.5} }                                 // sin regional
  remainderModel: gemini-3.1-flash-lite
  costModel: input/output/cache_read (rate) + cache_storage (storage)
  models: gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite
```

Cada modelo lleva `source` (URL) y `effective_date` propios; OpenAI sin fecha en página (usar `2026-06-13`, fetched), Google `2026-06-09`.
