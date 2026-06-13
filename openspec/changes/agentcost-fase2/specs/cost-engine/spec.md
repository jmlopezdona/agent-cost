## ADDED Requirements

### Requirement: Modificador de descuento Batch API

El motor DEBE aceptar una fracción de trabajo elegible para Batch API y un descuento (default 0,5 = −50%) vía `EngineOptions`, aplicando el descuento solo a esa fracción del coste de cada categoría: factor de batch = `1 − batchFraction × batchDiscount`. Con `batchFraction = 0` (default) el modificador es neutro.

#### Scenario: Descuento aplicado a la fracción elegible

- **WHEN** se calcula un escenario con `batchFraction = 0,40` y `batchDiscount = 0,5`
- **THEN** el coste resultante es el del escenario sin batch multiplicado por `1 − 0,40 × 0,5 = 0,80`

#### Scenario: Batch neutro por defecto

- **WHEN** no se pasa `batchFraction` (o vale 0)
- **THEN** el resultado coincide exactamente con el cálculo sin batch y el caso dorado de P2 permanece intacto

### Requirement: Modificador de recargo regional/Bedrock

El motor DEBE aceptar un factor de recargo regional vía `EngineOptions` (`regionalSurcharge`, default 1 = sin recargo) que multiplica el coste de todas las categorías de todos los modelos. Un recargo del 10% se expresa como `1,10`.

#### Scenario: Recargo del 10% sobre todo el coste

- **WHEN** se calcula un escenario con `regionalSurcharge = 1,10`
- **THEN** el blend y todas las métricas de coste son las del escenario base multiplicadas por 1,10

#### Scenario: Recargo neutro por defecto

- **WHEN** no se pasa `regionalSurcharge` (o vale 1)
- **THEN** el resultado coincide exactamente con el cálculo sin recargo y el caso dorado de P2 permanece intacto

#### Scenario: Composición de batch y recargo

- **WHEN** se calcula con `batchFraction = 0,40`, `batchDiscount = 0,5` y `regionalSurcharge = 1,10`
- **THEN** el coste base se multiplica por `(1 − 0,40 × 0,5) × 1,10 = 0,88`

### Requirement: Cálculo con tabla de precios editada

El motor DEBE calcular usando la tabla de precios efectiva que reciba como parámetro, de modo que los overrides de precios editados en la UI se reflejen en el resultado sin modificar `pricing.json`. El motor permanece puro: no conoce el origen (oficial u override) de los precios.

#### Scenario: Precio editado altera el blend

- **WHEN** se pasa al motor una tabla en la que el output de Opus es 30,00 USD/MTok en lugar de 25,00
- **THEN** la tarifa por hora de Opus y el blend se calculan con 30,00, sin que el motor dependa de cómo se obtuvo ese valor
