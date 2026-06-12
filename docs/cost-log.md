# Registro de costes reales de sesiones de agentes

Datos reales de uso de agentes de IA sobre este repo, como referencia para calibrar los presets de AgentCost (PRD §12: "los presets son puntos de partida; la UI empuja a ajustar con datos propios"). Fuente de cada entrada: `/usage` (o `/cost`) de Claude Code al cerrar la sesión.

## Sesiones

### 2026-06-12 — MVP completo: propuesta + implementación (`/opsx:propose` + `/opsx:apply agentcost-mvp`)

Una sola sesión de Claude Code, con **Fable 5 como modelo en ambas fases**, cubrió el ciclo OpenSpec completo de la change `agentcost-mvp`: la propuesta (`/opsx:propose` → proposal, design, 6 specs y 42 tareas a partir del PRD) y la implementación de las 42 tareas (`/opsx:apply`: scaffold → motor → store/URL → UI completa → E2E → CI/CD), con verificación incluida (37 tests unitarios, 5 E2E, Lighthouse 95/96). El consumo de Opus y Haiku corresponde a uso auxiliar del harness (subagentes y tareas internas), no a una fase concreta.

| Métrica | Valor |
|---|---|
| Coste total | **25,57 $** |
| Duración API (≈ horas activas) | 30 min |
| Duración de pared | 42 min |
| Código | +3.461 / −52 líneas |
| Coste por línea añadida | ~0,007 $ |
| Coste por hora activa | ~51 $/h |
| Versión de precios | 2026-06 (`pricing.json`) |

**Desglose por modelo:**

| Modelo | Rol | Input | Output | Cache read | Cache write | Coste |
|---|---|---|---|---|---|---|
| Fable 5 | Loop principal (propose + apply) | 32,1 k | 108,9 k | 10,5 M | 202,6 k | 20,31 $ |
| Opus 4.8 | Auxiliar del harness (subagentes) | 15,0 k | 17,1 k | 4,2 M | 267,6 k | 5,26 $ |
| Haiku 4.5 | Auxiliar del harness | 0,9 k | 26 | 0 | 0 | 0,001 $ |

**Perfil de tokens por hora activa** (total modelos, sobre 0,5 h de API):

| Categoría | Esta sesión | Preset P2 (referencia) |
|---|---|---|
| Input fresco | ~96 k/h | 42 k/h |
| Output | ~252 k/h | 210 k/h |
| Cache read | ~29,4 M/h | 30 M/h |
| Cache write | ~940 k/h | 530 k/h |

**Observaciones:**

- El **cache read domina el coste** también en la práctica: solo en Fable, 10,5 M × 1 $/MTok ≈ 10,5 $ (~52% de su coste). Es el insight central de AgentCost, confirmado construyéndolo.
- El volumen de **cache read por hora activa (~29 M/h) coincide casi exactamente con el preset P2** (30 M/h), que se definió antes de tener este dato. Input fresco y cache write salieron más altos (sesión con muchas escrituras de ficheros y contexto creciente).
- El coste por hora activa (~51 $/h) supera el blend de P2 (13,8 $/h) porque la mezcla fue Fable-heavy (modelo más caro que la mezcla Opus/Sonnet/Haiku de P2).
- **Límite de la medición**: `/usage` desglosa por modelo, no por comando, y ambas fases (propose y apply) corrieron sobre Fable, así que el reparto propuesta vs. implementación no es separable en esta entrada. Para medirlo en el futuro: anotar `/usage` entre el propose y el apply (o usar sesiones separadas). El ~21% de coste en Opus/Haiku es overhead del harness (subagentes y tareas internas), no atribuible a una fase.
- El ciclo completo spec-driven (especificar + implementar + verificar) salió por 25,57 $ con las 42 tareas completadas en una sola pasada, sin retrabajo.

## Cómo añadir una entrada

1. Al terminar una sesión relevante, ejecuta `/usage` en Claude Code y copia el desglose por modelo.
2. Calcula el perfil por hora activa dividiendo los tokens entre la duración API (en horas).
3. Anota la versión de precios vigente (`src/data/pricing.json` → `version`) para que el coste sea reproducible.
4. Si un patrón se repite (p. ej. sesiones de implementación guiada por spec), considera proponer un preset nuevo vía OpenSpec en lugar de ajustar los existentes.
