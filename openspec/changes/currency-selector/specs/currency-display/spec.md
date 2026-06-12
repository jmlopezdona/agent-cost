## ADDED Requirements

### Requirement: Selector global de moneda de presentación

La cabecera DEBE ofrecer un selector global de moneda con dos opciones, EUR y USD, cuyo valor por defecto es **EUR**. La moneda seleccionada determina la unidad en que se presentan TODAS las cifras monetarias de la aplicación (tarjetas de métricas, gráficos, mezcla de modelos, tasas de tokens y comparativa salarial). El cambio de moneda DEBE reflejarse de forma reactiva en toda la página sin recargar.

#### Scenario: Defecto en EUR

- **WHEN** la aplicación arranca sin parámetro de moneda en la URL
- **THEN** el selector muestra EUR como moneda activa y todas las cifras monetarias se presentan en euros

#### Scenario: Cambio a USD propaga a toda la UI

- **WHEN** el usuario selecciona USD en el selector de moneda
- **THEN** las tarjetas de métricas, los gráficos, la mezcla de modelos, las tasas de tokens y la comparativa salarial pasan a mostrarse en dólares de forma inmediata

### Requirement: Conversión de presentación sin alterar el motor

El motor (`src/engine/`) DEBE seguir calculando en USD con precisión completa con independencia de la moneda de presentación. La conversión a la moneda seleccionada DEBE aplicarse solo en la capa de presentación usando el tipo de cambio `fx` configurable (EUR por USD): los costes del agente (nativos en USD) se convierten USD→EUR cuando la moneda es EUR, y las nóminas (nativas en EUR) se convierten EUR→USD cuando la moneda es USD.

#### Scenario: El motor permanece en USD

- **WHEN** la moneda seleccionada es EUR
- **THEN** los cálculos internos y el caso dorado siguen expresados en USD con precisión completa, y solo la cifra mostrada se convierte a EUR con `fx`

#### Scenario: Conversión de coste del agente con el tipo de cambio

- **WHEN** el ponderado mensual del motor es 6.038 USD, la moneda es EUR y `fx` = 0,92
- **THEN** la tarjeta correspondiente muestra ≈ 5.555 € (6.038 × 0,92)

#### Scenario: Conversión inversa de nóminas a USD

- **WHEN** la moneda seleccionada es USD y `fx` = 0,92
- **THEN** los costes empresa de los perfiles (nativos en EUR) se muestran convertidos EUR→USD (dividiendo por `fx`)

### Requirement: Formateo consciente de moneda en convención es-ES

El formateo de toda cifra monetaria DEBE vivir en `src/lib/format.ts` y producir el símbolo de la moneda activa (€ o $) respetando la convención es-ES de separadores de miles y decimales (enteros para importes mensuales/anuales, 1 decimal para tarifas por hora). Ningún componente ni gráfico DEBE contener literales de símbolo de moneda hardcodeados.

#### Scenario: Importe mensual en cada moneda

- **WHEN** se formatea un importe mensual de 10.060
- **THEN** en EUR se muestra "10.060 €" y en USD "10.060 $", con el separador de miles es-ES

#### Scenario: Tarifa por hora con un decimal

- **WHEN** se formatea una tarifa de 13,8 por hora activa
- **THEN** en EUR se muestra "13,8 €/h" y en USD "13,8 $/h"
