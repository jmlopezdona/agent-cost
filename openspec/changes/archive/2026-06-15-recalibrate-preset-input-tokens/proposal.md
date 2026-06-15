## Why

Los perfiles de token de los presets (`presets.json`) deben ser **representativos del uso real** de estos modelos operados como servicio (PRD §8: "puntos de partida descritos"). Contrastando las tasas de los presets con telemetría real de sesiones de Claude Code (uso de Opus/Haiku con prompt caching agresivo), normalizada a tokens por **hora activa** (duración de API, que es la base que usa el motor), tres de las cuatro categorías están bien calibradas pero **el input fresco está ~2× sobreestimado**:

| Tasa (por hora activa) | Preset típico | Real (mediana) | Veredicto |
|---|---|---|---|
| `outputK` | 190–220 | ~230 | ✅ realista |
| `cacheReadM` | 28–50 | ~35 (15–77) | ✅ central correcto |
| `cacheWriteK` | 500–530 | ~480 | ✅ realista |
| `inputK` | **42** | **~18–20** | ❌ **~2× alto** |

El motivo es estructural: con prompt caching, casi todo el contexto reentra por `cache_read` (decenas de M/h) y el input fresco no cacheado por hora es pequeño. El ratio real input:output es ~0,09; los presets asumen ~0,20. Bajar `inputK` es una mejora de **realismo de las volumetrías**, no de coste: `cache_read` domina el blend, así que el impacto en las métricas es de décimas de porcentaje.

## What Changes

- **Recalibrar `inputK` en los 18 presets** (P1–P6, O1–O6, G1–G6) a valores anclados a la telemetría real, preservando las diferencias relativas entre escenarios:

  | Preset (por caso de uso) | `inputK` antes | `inputK` después |
  |---|---|---|
  | P1/P2/P4 · O1/O2/O4 · G1/G2/G4 | 42 | **20** |
  | P3 · O3 · G3 (greenfield, output alto) | 50 | **24** |
  | P5 · O5 · G5 (enjambre QA, contexto corto) | 25 | **12** |
  | P6 · O6 · G6 (autónomo, contexto grande) | 45 | **22** |

  El input se mantiene **consistente entre familias análogas** (es una tasa de carga compartida y global entre proveedores, por `add-provider-switch-state-memory`).
- **Actualizar el PRD §8 primero** (regla dura de AGENTS.md): tabla de presets y el default de `inputK` del control RF-02 (42 → 20). El caso de referencia §8 mantiene sus valores (blend ≈ 13,8 $/h, techo ≈ 3.585 $/mes, ponderado ≈ 2.151 $/mes) porque **siguen cumpliéndose con error < 1%**.
- **Actualizar aserciones exactas de los tests dorados** que dependen de `inputK` (no las basadas en tolerancia, que se conservan).

## Capabilities

### Modified Capabilities

- `scenario-presets`: el valor de `inputK` del preset P2 (y por extensión de todos los presets) pasa de 42 a 20 k/h en la especificación de datos.
- `cost-engine`: las aserciones exactas que fijan la tarifa de Sonnet con el perfil P2 (14,2635 → 14,1975 $/h) y el perfil de tokens del caso de referencia dorado (42 → 20 k/h) se recalibran; las referencias con tolerancia < 1% (13,8 / 3.585 / 2.151) permanecen.

## Impact

- **Datos**: `src/data/presets.json` — `inputK` de los 18 presets según la tabla anterior. Sin cambios en `pricing.json` (los precios no se tocan).
- **PRD**: `docs/PRD.md` §4 (RF-02 default) y §8 (tabla de presets). El bloque del caso de referencia se mantiene; se añade nota de la fuente de calibración.
- **Tests**: `src/engine/engine.test.ts` — valores exactos `14.2635 → 14.1975` (Sonnet P2), `12.3617 → 12.3045` (blend P1), `10.1591 → 10.1085` (blend P4) y sus comentarios aritméticos. Las aserciones `expectWithin1Percent(…, 13.8 / 3585 / 2151 / 35)` no cambian (siguen pasando). Verificar también `presets.test.ts` y `urlSync.test.ts` (diffs frente al preset base).
- **Sin cambios**: motor de cálculo (fórmulas), pricing, rangos de los sliders (0–500 sigue cubriendo 20), serialización de URL, i18n.
- **Fuera de alcance**: recalibrar `outputK`, `cacheReadM` o `cacheWriteK` (ya realistas); modelar el cache write de 1 h TTL (2× input); recalibrar presets de OpenAI/Google con telemetría propia (no disponible — se replica el patrón de Anthropic por coherencia).
