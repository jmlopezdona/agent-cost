## Contexto

Los `tokens` de un escenario son **tasas por hora activa** (`engine.ts:34-48`): `inputK`/`cacheWriteK` en miles por hora, `cacheReadM` en millones por hora. El `dutyCycle` ya descuenta el tiempo ocioso, de modo que una "hora activa" equivale a una hora de **generación pura** (token-throughput). Eso se confirma porque `outputK ≈ 210` coincide con el throughput real de generación de Claude (~50–80 tok/s ≈ 180–290 k/h).

## Decisión D1 — Base de normalización de la telemetría

Para comparar la telemetría de sesiones reales con la base del motor, cada sesión se normaliza dividiendo los tokens por su **duración de API** (no la wall), porque la duración de API es el tiempo de generación pura = la hora activa del modelo. Sesiones con muestra significativa (duración de API > 0,3 h):

| Sesión | API h | input/h | output/h | cache_read/h | cache_write/h |
|---|---|---|---|---|---|
| 1 | 0,89 | 18,3k | 244k | 27,7M | 482k |
| 11 | 1,13 | 18,0k | 260k | 77,2M | 431k |
| 2 | 0,39 | 28,7k | 247k | 55,4M | 677k |
| 4 | 0,39 | 18,3k | 241k | 41,1M | 469k |
| 5 | 0,35 | 15,3k | 208k | 23,0M | 417k |
| 12 | 0,42 | 58,9k | 171k | 14,6M | 570k |
| **Mediana** | | **~18–20k** | **~230k** | **~35M** | **~480k** |

La sesión 12 (input alto, output bajo) es un outlier de trabajo poco cacheado; la mediana es el ancla robusta.

## Decisión D2 — Solo se recalibra `inputK`

`outputK`, `cacheReadM` y `cacheWriteK` ya caen dentro de ±10–15% de la mediana real → **no se tocan** (cambiarlos solo añadiría ruido al caso dorado sin ganar realismo). El input es la única categoría con desviación sistemática (~2×) → se recalibra a 20 k/h como valor típico.

## Decisión D3 — Escalado proporcional, no valor único

Se preserva la **intención relativa** de cada preset en lugar de aplanar todos a 20. Factor ≈ 0,48 (20/42), redondeado a cifras limpias:

| Caso de uso | antes | después |
|---|---|---|
| Típico (P1/P2/P4) | 42 | 20 |
| Greenfield, output alto (P3) | 50 | 24 |
| Enjambre QA, contexto corto (P5) | 25 | 12 |
| Autónomo, contexto grande (P6) | 45 | 22 |

Las familias OpenAI (O*) y Google (G*) replican el `inputK` de su preset análogo: el input fresco es una tasa de carga **global y compartida** entre familias (`add-provider-switch-state-memory`), así que los análogos por número deben coincidir.

## Decisión D4 — El caso dorado se preserva, no se redefine

Regla dura: P2 es intocable sin actualizar el PRD primero. Se verifica que con `inputK = 20` el caso de referencia **sigue cumpliéndose con error < 1%**, por lo que las referencias del PRD §8 y las aserciones por tolerancia **no cambian**:

| Métrica | Referencia | Con inputK=20 | Error |
|---|---|---|---|
| blend P2 | 13,8 $/h | 13,72425 | 0,55% |
| techo P2 | 3.585 $/mes | 3.568,3 | 0,47% |
| ponderado P2 | 2.151 $/mes | 2.141,0 | 0,46% |
| coste/punto SWE-Pro | ~35 | 34,82 | 0,5% |

Solo cambian las **aserciones exactas** (`toBeCloseTo` de alta precisión) que fijan tarifas intermedias:

- Sonnet P2 (`hourlyRate`): `20/1000×3 + 210/1000×15 + 30×0,30 + 530/1000×3,75 = 14,1975` (antes 14,2635)
- Opus P2: 23,6625 · Haiku P2: 4,7325 → blend P2 = 13,72425
- blend P1 (0,8·Sonnet + 0,2·Haiku) = **12,3045** (antes 12,3617)
- blend P4 (input 20, output 190, CR 28, CW 500): Opus 21,975 · Sonnet 13,185 · Haiku 4,395 → blend = **10,1085** (antes 10,1591)

## Decisión D5 — Las specs en español mantienen la convención

Las specs se redactan con `DEBE`/`DEBEN` (no SHALL/MUST); el `[ERROR] must contain SHALL` de `openspec validate` es ruido esperado y no bloqueante (AGENTS.md). No se añade SHALL para silenciarlo.

## Alternativas descartadas

- **Aplanar todos los presets a un único `inputK`**: pierde la diferenciación de carga entre escenarios (greenfield vs enjambre QA), que es información de producto útil.
- **Recalibrar también cache_read a la mediana 35M**: subiría el blend ~17% en todos los presets y rompería el caso dorado por > 1% sin justificación de realismo (30M ya está dentro del rango real 15–77M).
- **Modelar el cache write de 1 h TTL (2× input)**: explica el ~5–8% de sobrecoste real en sesiones Opus-heavy, pero es un cambio de motor (nueva categoría en `costModel`), no de calibración de datos. Fuera de alcance.
