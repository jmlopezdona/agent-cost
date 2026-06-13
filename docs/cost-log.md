# Registro de costes reales de sesiones de agentes

Datos reales de uso de agentes de IA sobre este repo, como referencia para calibrar los presets de AgentCost (PRD §12: "los presets son puntos de partida; la UI empuja a ajustar con datos propios"). Fuente de cada entrada: `/usage` (o `/cost`) de Claude Code al cerrar la sesión.

## Sesiones

### 2026-06-12 — Ciclo OpenSpec completo del MVP (`/opsx:propose` + `/opsx:apply` + sync/`/opsx:archive`)

Una sola sesión de Claude Code, con **Fable 5 como modelo en todas las fases**, cubrió el ciclo OpenSpec completo de la change `agentcost-mvp`: la propuesta (`/opsx:propose` → proposal, design, 6 specs y 42 tareas a partir del PRD), la implementación de las 42 tareas (`/opsx:apply`: scaffold → motor → store/URL → UI completa → E2E → CI/CD, con verificación: 37 tests unitarios, 5 E2E, Lighthouse 95/96) y el cierre (sincronización de specs principales + `/opsx:archive` + commits + docs). El consumo de Opus y Haiku corresponde a uso auxiliar del harness (subagentes y tareas internas), no a una fase concreta.

| Métrica | Valor |
|---|---|
| Coste total | **31,91 $** |
| Duración API (≈ horas activas) | 37 min |
| Duración de pared | 52 min |
| Código | +3.527 / −66 líneas |
| Coste por línea añadida | ~0,009 $ |
| Coste por hora activa | ~52 $/h |
| Versión de precios | 2026-06 (`pricing.json`) |

**Desglose por modelo (acumulado de sesión):**

| Modelo | Rol | Input | Output | Cache read | Cache write | Coste |
|---|---|---|---|---|---|---|
| Fable 5 | Loop principal (todas las fases) | 36,8 k | 130,4 k | 14,7 M | 266,0 k | 26,65 $ |
| Opus 4.8 | Auxiliar del harness (subagentes) | 15,0 k | 17,1 k | 4,2 M | 267,6 k | 5,26 $ |
| Haiku 4.5 | Auxiliar del harness | 0,9 k | 26 | 0 | 0 | 0,001 $ |

**Reparto por fase** (medido con snapshots de `/usage` entre fases):

| Fase | Coste | % |
|---|---|---|
| Propose + apply (specs + implementación + verificación) | 25,57 $ | ~80% |
| Sync de specs + archive + commits + docs de cierre | 6,34 $ | ~20% |

**Perfil de tokens por hora activa** (total modelos, sobre ~0,62 h de API):

| Categoría | Esta sesión | Preset P2 (referencia) |
|---|---|---|
| Input fresco | ~86 k/h | 42 k/h |
| Output | ~240 k/h | 210 k/h |
| Cache read | ~30,7 M/h | 30 M/h |
| Cache write | ~867 k/h | 530 k/h |

**Observaciones:**

- El **cache read domina el coste** también en la práctica: solo en Fable, 14,7 M × 1 $/MTok ≈ 14,7 $ (~55% de su coste). Es el insight central de AgentCost, confirmado construyéndolo.
- El volumen de **cache read por hora activa (~30,7 M/h) coincide casi exactamente con el preset P2** (30 M/h), que se definió antes de tener este dato. Input fresco y cache write salieron más altos (sesión con muchas escrituras de ficheros y contexto creciente).
- El coste por hora activa (~52 $/h) supera el blend de P2 (13,8 $/h) porque la mezcla fue Fable-heavy (modelo más caro que la mezcla Opus/Sonnet/Haiku de P2).
- **El cierre no es gratis**: sincronizar specs, archivar y documentar costó 6,34 $ (~20% de la sesión, ~7 min de API), en parte por un subagente de sincronización y por el contexto largo acumulado al final de la sesión (cada turno relee más historial → más cache read).
- **Cómo se midió el reparto por fase**: con un snapshot de `/usage` tras el apply y otro al final; la diferencia es atribuible a la fase intermedia. Propose y apply siguen agregados (sin snapshot entre ellos). El ~16% de coste en Opus/Haiku es overhead del harness, no atribuible a una fase.
- El ciclo completo spec-driven (especificar + implementar + verificar + archivar) salió por 31,91 $ con las 42 tareas completadas en una sola pasada, sin retrabajo.

### 2026-06-13 — Diseño de la spec "Fase 2 — v1.0" (`/openspec-propose`, solo propuesta)

Sesión de Claude Code con **Opus 4.8 (1M context) como único modelo** (loop principal, sin subagentes), dedicada únicamente a la **fase de propuesta** de la change `agentcost-fase2`: leer el PRD §13 y el estado real del repo (specs activas, motor, store, datos), y generar los 4 artefactos OpenSpec —proposal, design (8 decisiones), 7 deltas de specs (3 capacidades nuevas + 4 modificadas) y tasks (9 secciones)—. **No incluye implementación** (`/opsx:apply` queda pendiente), a diferencia de la sesión del MVP, que cubría el ciclo completo.

| Métrica | Valor |
|---|---|
| Coste total | **2,75 $** |
| Duración API (≈ horas activas) | 7 min 16 s |
| Duración de pared | 16 min 42 s |
| Código | +512 / −0 líneas (artefactos Markdown) |
| Coste por línea añadida | ~0,005 $ |
| Coste por hora activa | ~22,7 $/h |
| Versión de precios | 2026-06 (`pricing.json`) |

**Desglose por modelo (acumulado de sesión):**

| Modelo | Rol | Input | Output | Cache read | Cache write | Coste |
|---|---|---|---|---|---|---|
| Opus 4.8 (1M context) | Loop principal (toda la sesión) | 14,7 k | 30,1 k | 2,1 M | 84,5 k | 2,75 $ |

**Perfil de tokens por hora activa** (sobre ~0,12 h de API):

| Categoría | Esta sesión | Preset P2 (referencia) |
|---|---|---|
| Input fresco | ~121 k/h | 42 k/h |
| Output | ~249 k/h | 210 k/h |
| Cache read | ~17,3 M/h | 30 M/h |
| Cache write | ~698 k/h | 530 k/h |

**Observaciones:**

- **Proponer es barato frente al ciclo completo**: 2,75 $ por los 4 artefactos, ~12× menos que los 31,91 $ del ciclo completo del MVP (propose + apply + archive). La fase de diseño/spec es una fracción pequeña del coste total de entregar una feature; el grueso está en la implementación y verificación.
- **El cache read sigue siendo la mayor partida de coste** incluso en una sesión de solo diseño: ~2,1 MTok × 0,50 $/MTok ≈ 1,05 $, por encima del output (~0,75 $) y la escritura de caché (~0,53 $). Confirma el insight de AgentCost también sin escribir código.
- **Pero el cache read por hora (~17,3 M/h) es notablemente menor que en P2 (30 M/h)** y que en la sesión de implementación del MVP (~30,7 M/h): una sesión de propuesta relee menos contexto grande de forma repetida (más lectura puntual del PRD y escritura de artefactos, menos ciclos de ida y vuelta sobre ficheros de código). El **output por hora, en cambio, es alto** (~249 k/h) por la redacción densa de specs y tasks.
- **Modelo único, sin overhead de harness**: a diferencia del MVP (que repartió ~16% en subagentes Opus/Haiku auxiliares), aquí no se lanzaron subagentes; el 100% del coste es atribuible al loop principal. El coste real (2,75 $) supera la estimación a precios estándar de Opus (~2,40 $) por el premium del contexto de 1M tokens.

### 2026-06-13 — Implementación de la spec "Fase 2 — v1.0" (`/openspec-apply-change`, las 36 tareas)

Sesión de Claude Code con **Opus 4.8 (1M context) como modelo del loop principal** (un toque residual de Haiku como auxiliar del harness), dedicada a la **fase de implementación** de la change `agentcost-fase2`: leer los 11 ficheros de contexto (proposal, design, 7 specs, tasks) y completar las **36 tareas en una sola pasada** —presets P3/P5/P6 + learnings, panel de configuración avanzada (precios editables, Batch API, recargo Bedrock, fx, coste empresa, horas), modo presentación, exportación CSV/JSON/PNG, persistencia en URL y señal secundaria accesible—, con verificación completa (lint, typecheck, 63 tests unitarios, 8 E2E, build, bundle 135 kB gzip y Lighthouse móvil 97/92). Es la continuación del `/openspec-propose` del mismo día.

| Métrica | Valor |
|---|---|
| Coste total | **13,04 $** |
| Duración API (≈ horas activas) | 20 min 34 s |
| Duración de pared | 32 min 9 s |
| Código | +1.442 / −158 líneas |
| Coste por línea añadida | ~0,009 $ |
| Coste por hora activa | ~38 $/h |
| Versión de precios | 2026-06 (`pricing.json`) |

**Desglose por modelo (acumulado de sesión):**

| Modelo | Rol | Input | Output | Cache read | Cache write | Coste |
|---|---|---|---|---|---|---|
| Opus 4.8 (1M context) | Loop principal (toda la sesión) | 6,3 k | 96,4 k | 17,3 M | 192,6 k | 13,04 $ |
| Haiku 4.5 | Auxiliar del harness | 0,5 k | 13 | 0 | 0 | 0,0006 $ |

**Perfil de tokens por hora activa** (sobre ~0,34 h de API):

| Categoría | Esta sesión | Preset P2 (referencia) |
|---|---|---|
| Input fresco | ~20 k/h | 42 k/h |
| Output | ~281 k/h | 210 k/h |
| Cache read | ~50,5 M/h | 30 M/h |
| Cache write | ~562 k/h | 530 k/h |

**Observaciones:**

- **Implementar es el grueso del coste**: 13,04 $ frente a los 2,75 $ del propose (~4,7×). El ciclo de Fase 2 hasta aquí (propose + apply) suma **15,79 $** con archive aún pendiente; sigue por debajo de los 31,91 $ del ciclo completo del MVP, que usó Fable (más barato que Opus en mezcla, pero la Fase 2 es bastante más ligera en tokens totales).
- **El cache read vuelve a dominar el coste**: ~17,3 MTok × 0,50 $/MTok ≈ 8,65 $ (~66% del total), muy por encima del output (~2,41 $) y la escritura de caché (~1,20 $). El insight central de AgentCost, confirmado una tercera vez.
- **El cache read por hora (~50,5 M/h) es el más alto de las tres sesiones** y se acerca al preset P6 (50 M/h), no a P2. Una sesión larga de implementación en ventana de 1M relee de forma repetida un contexto grande y creciente (motor, store, ~15 componentes, tests) en cada turno: el perfil real es el de un agente autónomo/greenfield, no el de pair programming. El output por hora también es alto (~281 k/h) por escribir mucho código y tests.
- **Modelo único, premium de 1M**: a precios estándar de Opus el coste estimado sería ~12,3 $; el real (13,04 $) lo supera en ~6% por el premium del contexto de 1M tokens. El Haiku residual (0,0006 $) es overhead del harness, no atribuible a ninguna fase.
- **El coste por hora activa (~38 $/h) es menor que el del MVP (~52 $/h)** pese a usar Opus (más caro que Fable): la mezcla efectiva fue casi 100% cache read barato + output, y el volumen de input fresco por hora fue bajo (~20 k/h, mucho contexto cacheado y poco texto nuevo).

## Cómo añadir una entrada

1. Ejecuta `/usage` en Claude Code **al final de cada fase relevante** (no solo al cerrar la sesión): la diferencia entre snapshots es la única forma de atribuir coste por fase, porque `/usage` desglosa por modelo, no por comando.
2. Calcula el perfil por hora activa dividiendo los tokens entre la duración API (en horas).
3. Anota la versión de precios vigente (`src/data/pricing.json` → `version`) para que el coste sea reproducible.
4. Si un patrón se repite (p. ej. sesiones de implementación guiada por spec), considera proponer un preset nuevo vía OpenSpec en lugar de ajustar los existentes.
