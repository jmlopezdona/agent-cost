## MODIFIED Requirements

### Requirement: Conversión del coste del agente a la moneda de presentación

El coste del agente DEBE calcularse en USD y mostrarse en la moneda de presentación seleccionada. Cuando la moneda es EUR, se convierte USD→EUR con el tipo de cambio `fx` configurable; cuando es USD, se muestra en USD nativo. El tipo de cambio aplicado DEBE mostrarse siempre junto al resultado y permanecer editable (RF-06).

#### Scenario: Tipo de cambio visible en EUR

- **WHEN** la comparativa muestra el coste mensual del agente con moneda EUR
- **THEN** el tipo de cambio aplicado (p. ej. "1 USD = 0,92 €") aparece junto al resultado y es editable

#### Scenario: Coste del agente en USD nativo

- **WHEN** la moneda seleccionada es USD
- **THEN** el coste del agente se muestra en USD sin conversión, manteniendo visible el tipo de cambio para la conversión de las nóminas

### Requirement: Visualización de barras horizontales

La comparativa DEBE incluir un gráfico de barras horizontales con el coste mensual del escenario de agentes junto a las barras de coste empresa mensual de los cuatro perfiles, todas en la moneda de presentación seleccionada (CA-06.1). Las nóminas son nativas en EUR; cuando la moneda activa es USD se convierten EUR→USD con `fx`.

#### Scenario: Barras comparativas en moneda activa

- **WHEN** la comparativa se renderiza con el escenario P2 y moneda EUR
- **THEN** se muestran cinco barras (agente + 4 perfiles) a escala común en EUR, distinguibles por color más una señal secundaria

#### Scenario: Barras convertidas a USD

- **WHEN** el usuario cambia la moneda a USD
- **THEN** las cinco barras pasan a expresarse en USD (perfiles convertidos EUR→USD con `fx`) y el eje y las etiquetas muestran el símbolo $
