# cost-engine

## Purpose

Motor de cálculo puro sin dependencias de UI: tarifa por hora activa por modelo, blend ponderado por mezcla de modelos, horas programadas mensuales, techo y ponderado mensual/anual, desglose de coste por categoría de token y conversión de divisa USD→EUR. Incluye los datos de precios versionados (`pricing.json`).

## Requirements

### Requirement: Cálculo de tarifa por hora activa por modelo

El motor DEBE calcular la tarifa por hora activa de cada modelo aplicando exactamente la fórmula de RF-01: `tarifa_hora = (input_k/1000) × P.input + (output_k/1000) × P.output + cache_read_M × P.cache_read + (cache_write_k/1000) × P.cache_write`, con todas las tarifas en USD/MTok tomadas de `pricing.json`.

#### Scenario: Tarifa por hora de un modelo con el perfil de tokens P2

- **WHEN** se calcula la tarifa de Sonnet 4.6 con input 42 k/h, output 210 k/h, cache read 30 M/h y cache write 530 k/h, con los precios por defecto
- **THEN** el resultado es 42/1000×3,00 + 210/1000×15,00 + 30×0,30 + 530/1000×3,75 = 14,2635 USD/h, sin redondeo interno

#### Scenario: Categoría de tokens a cero

- **WHEN** una categoría de tokens (p. ej. cache read) es 0
- **THEN** esa categoría aporta 0 al coste y el resto de la fórmula se calcula con normalidad

### Requirement: Blend ponderado por mezcla de modelos

El motor DEBE calcular la tarifa blend como `Σ (mix_modelo × tarifa_hora(modelo))` sobre los cuatro modelos (Fable 5, Opus 4.8, Sonnet 4.6, Haiku 4.5), donde la mezcla se expresa en fracciones que suman 1.

#### Scenario: Mezcla 100% en un único modelo

- **WHEN** la mezcla es 100% Opus y 0% el resto
- **THEN** el blend coincide exactamente con la tarifa por hora de Opus

#### Scenario: Mezcla repartida

- **WHEN** la mezcla es 15% Opus, 65% Sonnet y 20% Haiku (P2)
- **THEN** el blend es la suma ponderada de las tres tarifas por esas fracciones

### Requirement: Proyección mensual y anual

El motor DEBE calcular `horas_mes_programadas = horas_dia × dias_semana × (52/12)`, `techo_mensual = blend_hora × horas_mes_programadas × n_agentes`, `ponderado_mensual = techo_mensual × duty_cycle` y `ponderado_anual = ponderado_mensual × 12`, manteniendo precisión completa en los cálculos internos.

#### Scenario: Caso de referencia dorado (CA-01.3)

- **WHEN** se calcula el preset P2 completo (tokens 42/210/30/530, mezcla 0/15/65/20, régimen 24×7, duty 60%, 1 agente) con los precios por defecto
- **THEN** el blend ≈ $13,8/h activa, el techo ≈ $10.060/mes y el ponderado ≈ $6.040/mes, cada uno con error relativo < 1% respecto a estos valores de referencia

#### Scenario: Escalado por número de agentes

- **WHEN** el número de agentes pasa de 1 a 5 sin cambiar nada más
- **THEN** el techo y el ponderado mensual y anual se multiplican exactamente por 5

### Requirement: Desglose de coste por categoría de token

El motor DEBE devolver, para el blend actual, el coste por hora aportado por cada categoría (input fresco, output, cache read, cache write) en USD/h y como porcentaje del total.

#### Scenario: Suma del desglose

- **WHEN** se calcula el desglose para cualquier escenario
- **THEN** la suma de las cuatro categorías en USD/h es igual al blend por hora y los porcentajes suman 100%

#### Scenario: Cache read dominante en el caso de referencia

- **WHEN** se calcula el desglose del preset P2 con los precios por defecto
- **THEN** la categoría cache read es la de mayor coste por hora del desglose

### Requirement: Conversión de divisa USD→EUR

El motor DEBE convertir cualquier resultado en USD a EUR multiplicando por un tipo de cambio configurable que se recibe como parámetro.

#### Scenario: Conversión aplicada al ponderado mensual

- **WHEN** el ponderado mensual es 6.000 USD y el tipo de cambio es 0,92 EUR/USD
- **THEN** el resultado en EUR es 5.520

### Requirement: Pureza e independencia de la UI

El motor DEBE implementarse como módulo puro en `src/engine/` sin dependencias de DOM, React ni del store, de modo que sea ejecutable en Node (tests, futuro CLI).

#### Scenario: Ejecución en entorno de test sin DOM

- **WHEN** la suite de Vitest ejecuta el motor en entorno Node puro (sin jsdom)
- **THEN** todos los cálculos funcionan sin errores de dependencias de navegador

### Requirement: Datos de precios versionados

Los precios por modelo DEBEN vivir en `src/data/pricing.json` con campos `version`, `effective_date` y las cuatro categorías por modelo, con los valores por defecto del PRD (RF-03): Fable 10/50/1/12,50 — Opus 5/25/0,50/6,25 — Sonnet 3/15/0,30/3,75 — Haiku 1/5/0,10/1,25 USD/MTok.

#### Scenario: Carga de precios por defecto

- **WHEN** la aplicación arranca sin parámetros en la URL
- **THEN** el motor usa los precios de `pricing.json` y su `version` queda disponible para la serialización en URL
