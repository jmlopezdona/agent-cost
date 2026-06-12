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

## Cómo añadir una entrada

1. Ejecuta `/usage` en Claude Code **al final de cada fase relevante** (no solo al cerrar la sesión): la diferencia entre snapshots es la única forma de atribuir coste por fase, porque `/usage` desglosa por modelo, no por comando.
2. Calcula el perfil por hora activa dividiendo los tokens entre la duración API (en horas).
3. Anota la versión de precios vigente (`src/data/pricing.json` → `version`) para que el coste sea reproducible.
4. Si un patrón se repite (p. ej. sesiones de implementación guiada por spec), considera proponer un preset nuevo vía OpenSpec en lugar de ajustar los existentes.
