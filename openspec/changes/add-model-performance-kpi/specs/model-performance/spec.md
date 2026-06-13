# model-performance

## Purpose

Desempeño de cada modelo en SWE-bench Pro como dato versionado y comparable de forma honesta: score por modelo con su base metodológica y confianza, KPI de desempeño ponderado de la mezcla, KPI de coste por punto de desempeño, y semántica de comparabilidad (base de proveedor preferente, marca de incertidumbre y disclaimer entre familias). El objetivo es que la app exprese no solo cuánto cuesta un agente, sino cómo de capaz es el mix de modelos elegido para programar.

## ADDED Requirements

### Requirement: Desempeño SWE-bench Pro por modelo en datos versionados

Cada modelo de `pricing.json` DEBE poder declarar un bloque `swePro` con `score` (0–100, % pass-rate en SWE-bench Pro), `basis` (`standard` | `vendor` | `estimate`), `confidence` (`high` | `medium` | `low`) y opcionalmente `source` y `effective_date`. El dato vive en `pricing.json` junto al precio y viaja con `version`/`effective_date` de la tabla. El motor permanece puro y el `swePro` NO interviene en ningún cálculo de coste.

#### Scenario: Modelo con score del proveedor

- **WHEN** se carga `pricing.json` y un modelo declara `swePro: { score: 69.2, basis: 'vendor', confidence: 'high' }`
- **THEN** el type guard lo acepta y el motor expone ese score para el KPI sin alterar ninguna métrica de coste del modelo

#### Scenario: Score fuera de dominio rechazado

- **WHEN** un modelo declara `swePro.score = 140` o `swePro.basis = 'leaderboard'`
- **THEN** el type guard de `pricing.json` lo rechaza como inválido

#### Scenario: El score no afecta al coste

- **WHEN** se cambia el `swePro.score` de cualquier modelo y se recalcula el escenario P2 con precios por defecto
- **THEN** blend, techo, ponderado mensual y anual permanecen idénticos (caso dorado intacto)

### Requirement: Confianza en el dato del proveedor (vendor-first)

Los scores cargados DEBEN preferir el número publicado por el propio proveedor (`basis: 'vendor'`, `confidence: 'high'`); cuando el proveedor no publica número para un modelo se DEBE usar una estimación anclada al flagship de su misma familia (`basis: 'estimate'`, `confidence: 'low'`) o, como último recurso, el valor estandarizado de Scale SEAL (`basis: 'standard'`, `confidence: 'medium'`). Cada score DEBE conservar su `basis` y `confidence` para que la UI marque la incertidumbre y advierta de que los scaffolds de proveedor no son comparables entre familias.

#### Scenario: Modelo sin número publicado por el proveedor

- **WHEN** un modelo del catálogo carece de score publicado por su proveedor (p. ej. Sonnet 4.6, Haiku 4.5 o los Flash de Gemini)
- **THEN** su `swePro` se carga como `basis: 'estimate'` con `confidence: 'low'` y queda marcado como aproximado en la UI

### Requirement: KPI de desempeño ponderado de la mezcla

El motor DEBE derivar `weightedSwePro = Σ (mix_modelo × score_modelo)` sobre los modelos del proveedor activo, con la misma ponderación por fracción de mezcla que el blend de coste. Es un resultado derivado (no almacenado en el estado del escenario). Si algún modelo del mix carece de score, el motor DEBE ponderar sobre la cobertura disponible y exponer `sweProCoverage` (fracción de la mezcla con score).

#### Scenario: Desempeño ponderado de una mezcla

- **WHEN** la mezcla es 15% Opus (score 69,2), 65% Sonnet (62) y 20% Haiku (54), con 0% Fable
- **THEN** `weightedSwePro` = 0,15×69,2 + 0,65×62 + 0,20×54 = 61,48 y `sweProCoverage` = 1

#### Scenario: Cobertura parcial

- **WHEN** un modelo presente en la mezcla con fracción > 0 no tiene `swePro`
- **THEN** `weightedSwePro` se calcula sobre los modelos con score renormalizando sus fracciones y `sweProCoverage` < 1

### Requirement: KPI de coste por punto de desempeño

El motor DEBE derivar `costPerPointUSD = weightedMonthlyUSD / weightedSwePro` (coste mensual en USD por punto de desempeño SWE-Pro), con guarda a 0 cuando `weightedSwePro` es 0. Es un resultado derivado en USD; la conversión a la moneda de presentación ocurre solo en la capa de formato.

#### Scenario: Coste por punto del caso de referencia

- **WHEN** el escenario activo es P2 con precios por defecto (ponderado ≈ 6.040 $/mes) y `weightedSwePro` ≈ 61,5
- **THEN** `costPerPointUSD` ≈ 98 $/mes por punto, con el cálculo interno sin redondeo

#### Scenario: Sin scores en la mezcla

- **WHEN** ningún modelo de la mezcla tiene `swePro` (`weightedSwePro` = 0)
- **THEN** `costPerPointUSD` = 0 y la UI lo presenta como "n/d"

### Requirement: Comparabilidad y disclaimer entre familias

La UI DEBE advertir de que el score SWE-Pro confía en el dato de cada proveedor, que cada familia usa su propio scaffold (inflando 15–30 puntos sobre el estandarizado) y que por ello la comparación de desempeño entre familias es indicativa. Los scores cuya `basis` no sea `vendor` o cuya `confidence` no sea `high` DEBEN marcarse como aproximados (p. ej. con `≈`).

#### Scenario: Mezcla con scores aproximados

- **WHEN** la mezcla activa incluye algún modelo con `basis: 'estimate'` o `confidence` distinta de `high`
- **THEN** el desempeño ponderado se muestra marcado como aproximado y se ofrece el disclaimer de comparabilidad

#### Scenario: Mezcla totalmente con dato de proveedor

- **WHEN** todos los modelos con fracción > 0 tienen `basis: 'vendor'` y `confidence: 'high'`
- **THEN** el desempeño ponderado se muestra sin la marca de aproximación
