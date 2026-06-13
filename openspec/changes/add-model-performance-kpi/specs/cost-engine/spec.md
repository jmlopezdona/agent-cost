## ADDED Requirements

### Requirement: Desempeño ponderado y coste por punto en los resultados

El motor DEBE incluir en `Results` los campos derivados `weightedSwePro` (desempeño SWE-bench Pro ponderado por la mezcla, 0–100), `costPerPointUSD` (ponderado mensual USD / `weightedSwePro`, con guarda a 0) y `sweProCoverage` (fracción de la mezcla con score). Estos campos se calculan en `computeResults` a partir del `swePro` de los modelos del proveedor activo y NO alteran ninguna métrica de coste existente (`blendedRate`, `ceilingMonthlyUSD`, `weightedMonthlyUSD`, `weightedAnnualUSD`, `byCategory`, `byModel`, `storageMonthlyUSD`).

#### Scenario: Resultados de desempeño del caso de referencia

- **WHEN** se computa P2 con precios y scores por defecto (mezcla 0/15/65/20, scores Opus 69,2 / Sonnet 62 / Haiku 54)
- **THEN** `weightedSwePro` ≈ 61,5, `sweProCoverage` = 1 y `costPerPointUSD` ≈ 98, mientras blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes y ponderado ≈ 6.040 $/mes permanecen sin cambios

#### Scenario: Mezcla 100% en un modelo medido

- **WHEN** la mezcla es 100% en un modelo con `swePro.score = S`
- **THEN** `weightedSwePro` = S y `costPerPointUSD` = ponderado_mensual / S

#### Scenario: Ausencia total de scores no rompe el cálculo

- **WHEN** ningún modelo del proveedor activo declara `swePro`
- **THEN** `weightedSwePro` = 0, `costPerPointUSD` = 0, `sweProCoverage` = 0 y todas las métricas de coste se calculan con normalidad
