## MODIFIED Requirements

### Requirement: Serialización del estado en la URL

Todos los parámetros del escenario (tokens, mezcla, régimen, duty, número de agentes, tipo de cambio, moneda de presentación, preset base) DEBEN serializarse de forma compacta en la query string con claves cortas, incluyendo la versión de precios (`pv`) usada (RF-09, CA-09.1). La moneda de presentación usa la clave `cur` y solo se serializa cuando difiere del defecto (EUR). La URL DEBE actualizarse con `history.replaceState` sin crear entradas de historial.

#### Scenario: URL refleja el estado actual

- **WHEN** el usuario modifica el duty cycle a 70%
- **THEN** la query string de la URL se actualiza para incluir ese valor sin recargar la página ni añadir entrada al historial

#### Scenario: Solo se serializan las diferencias con el preset

- **WHEN** el escenario es exactamente el preset P2 sin modificar y la moneda es la de defecto (EUR)
- **THEN** la URL contiene únicamente la referencia al preset y la versión de precios, sin el resto de parámetros ni `cur`

#### Scenario: La moneda no-defecto se serializa

- **WHEN** el usuario cambia la moneda de presentación a USD
- **THEN** la query string incluye `cur` con el valor correspondiente a USD; al volver a EUR, `cur` desaparece de la URL
