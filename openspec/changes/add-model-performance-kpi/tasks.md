## 1. Datos y tipos (átomo coordinado)

- [ ] 1.1 Definir en `src/engine/types.ts`: `SweProBasis` (`standard`|`vendor`|`estimate`), `Confidence` (`high`|`medium`|`low`) e interfaz `SwePro` (`score`, `basis`, `confidence`, `source?`, `effective_date?`); añadir `swePro?: SwePro` a `ModelPricing`
- [ ] 1.2 Añadir a `Results` (en `types.ts`): `weightedSwePro: number`, `costPerPointUSD: number`, `sweProCoverage: number`
- [ ] 1.3 Cargar el bloque `swePro` por modelo en `src/data/pricing.json` según `research/swebench-pro-2026-06.md` (todos los modelos de los tres proveedores); incrementar `version`/`effective_date`
- [ ] 1.4 Type guard en `src/data/index.ts`: validar `swePro` cuando exista (`score ∈ [0,100]`, `basis` y `confidence` en su dominio); test de datos que confirme cobertura 1 (todos los modelos con `swePro`)
- [ ] 1.5 `npm run typecheck` + tests de datos verdes; golden case de coste de P2 (`engine.test.ts`) intacto

## 2. Motor de cálculo

- [ ] 2.1 En `computeResults` (`src/engine/engine.ts`): calcular `weightedSwePro = Σ mix×score` sobre los modelos del proveedor activo, con renormalización sobre la cobertura y `sweProCoverage` cuando falte algún score
- [ ] 2.2 Calcular `costPerPointUSD = weightedMonthlyUSD / weightedSwePro` con guarda a 0; verificar que el `swePro` no entra en ninguna fórmula de coste
- [ ] 2.3 Ampliar `engine.test.ts`: `weightedSwePro` y `costPerPointUSD` de P2 (≈61,5 y ≈98), mezcla 100% en un modelo, cobertura parcial y ausencia total de scores; golden case de coste de P2 sin cambios de valores esperados

## 3. UI

- [ ] 3.1 `MetricCards.tsx`: dos tarjetas no héroe — "Desempeño SWE-Pro" (`weightedSwePro` en %) y "Coste/punto" (`costPerPointUSD` con conversión de moneda), insertadas tras el ponderado anual; "n/d" cuando `weightedSwePro` = 0
- [ ] 3.2 Marca de aproximación (`≈` + `hint`) en la tarjeta de desempeño cuando la mezcla activa incluye scores con `basis ≠ vendor` o `confidence ≠ high`; alternativa textual accesible sin depender del color
- [ ] 3.3 `ModelMixSection.tsx`: mostrar el score entre paréntesis junto a cada modelo (sliders y modelo resto), con `≈` en los no publicados por el proveedor, y el desempeño ponderado del mix al pie junto al blend
- [ ] 3.4 Disclaimer de comparabilidad entre familias (texto/tooltip único) próximo a las métricas de desempeño o al control de mezcla
- [ ] 3.5 `npm run test:e2e` verde: cargar P2, ver las dos tarjetas y los paréntesis por modelo, mover un slider y comprobar el recálculo del desempeño; cambiar de familia y verificar scores propios

## 4. i18n y cierre

- [ ] 4.1 Añadir a `src/i18n/{es,en,fr}.ts`: labels de las métricas (`swePro`, `costPerPoint`) y sus `hint`, helper de formato del paréntesis por modelo, texto de "aproximado" y disclaimer de comparabilidad
- [ ] 4.2 Revisión humana de la tabla de scores (`research/swebench-pro-2026-06.md`) y de los valores cargados en `pricing.json` antes de cerrar — punto de mayor riesgo de dato; ajustar los `estimate` marcados `low`
- [ ] 4.3 Puerta final: `lint`, `typecheck`, `test`, `test:e2e`, `build` y `size` (< 250 kB gzip) en verde; golden case de coste de P2 intacto
