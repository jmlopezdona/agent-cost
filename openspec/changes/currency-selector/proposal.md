## Why

Hoy las cifras de coste del agente se muestran siempre en USD ($) y solo la comparativa salarial trabaja en EUR, lo que obliga al usuario español —audiencia principal— a hacer la conversión mentalmente. Ya existe un tipo de cambio `fx` editable y persistido en la URL; falta una palanca de presentación que unifique la moneda de toda la página. Por defecto debe ser EUR.

## What Changes

- Nuevo **selector global de moneda (EUR/USD)** en la cabecera, por defecto **EUR**, junto al toggle de tema.
- Todas las cifras monetarias de la UI (tarjetas de métricas, gráfico techo vs ponderado, donut por categoría, mezcla de modelos, tasas de tokens y comparativa salarial) se presentan en la moneda seleccionada.
- **BREAKING (de presentación)**: el defecto pasa de USD a EUR; las métricas principales que antes salían en `$` ahora salen en `€` por defecto. El cálculo del motor no cambia.
- La conversión usa el `fx` existente (EUR por USD): costes del agente (nativos USD) se convierten USD→EUR cuando la moneda es EUR; las nóminas (nativas EUR) se convierten EUR→USD cuando la moneda es USD.
- El motor (`src/engine/`) sigue calculando en USD con precisión completa; el **caso dorado permanece intacto** (sigue expresado en USD en `engine.test.ts`).
- Formateo consciente de moneda centralizado en `src/lib/format.ts`, respetando la convención es-ES (separadores/decimales); cero literales de moneda hardcodeados en componentes.
- La moneda se serializa en la URL como parámetro corto (`cur`), solo cuando difiere del defecto EUR, igual que `fx`.
- Todos los strings nuevos en `src/i18n/es.ts`.

## Capabilities

### New Capabilities

- `currency-display`: Selección global de la moneda de presentación (EUR/USD, defecto EUR), conversión de todas las cifras mediante el tipo de cambio configurable manteniendo el motor en USD, y formateo consciente de moneda en convención es-ES.

### Modified Capabilities

- `results-display`: las tarjetas de métricas y demás cifras se formatean en la moneda seleccionada (defecto EUR), no fijas en USD.
- `salary-comparison`: la comparativa sigue el selector global; cuando la moneda es USD, los costes empresa y €/h de los perfiles se convierten EUR→USD con `fx`.
- `url-sharing`: la moneda seleccionada se incorpora a la serialización compacta de la URL (clave `cur`), solo cuando difiere del defecto.

## Impact

- **Código**: `src/lib/format.ts` (formateadores conscientes de moneda), `src/store/useScenarioStore.ts` y `src/store/urlSync.ts` (estado + serialización de `cur`), `src/components/layout/Header.tsx` (selector), `src/components/results/MetricCards.tsx`, `src/components/charts/*`, `src/components/controls/{ModelMixSection,TokenRatesSection}.tsx`, `src/components/salary/SalaryComparison.tsx`, `src/i18n/es.ts`.
- **Tests**: round-trip de `cur` en `urlSync.test.ts`; tests de formato consciente de moneda; el caso dorado de `engine.test.ts` no se toca.
- **Sin impacto en**: el motor de cálculo, los datos JSON de precios/salarios, el backend (no hay).
