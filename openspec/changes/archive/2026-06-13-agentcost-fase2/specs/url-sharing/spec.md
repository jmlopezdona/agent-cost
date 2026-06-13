## MODIFIED Requirements

### Requirement: Serialización del estado en la URL

Todos los parámetros del escenario (tokens, mezcla, régimen, duty, número de agentes, tipo de cambio, moneda de presentación, preset base) y los modificadores de configuración avanzada (Batch API on/%, recargo regional/Bedrock, multiplicador de coste empresa, horas efectivas y overrides de precios) DEBEN serializarse de forma compacta en la query string con claves cortas, incluyendo la versión de precios (`pv`) usada (RF-09, CA-09.1). Solo se serializan los valores que difieren de su defecto. La moneda usa la clave `cur`; los nuevos parámetros usan claves cortas (p. ej. `b` para % de batch, `bd` para Bedrock, `em` para el multiplicador, `eh` para horas efectivas, `px` para los overrides de precios). El modo presentación se serializa aparte como `present=1`. La URL DEBE actualizarse con `history.replaceState` sin crear entradas de historial.

#### Scenario: URL refleja el estado actual

- **WHEN** el usuario modifica el duty cycle a 70%
- **THEN** la query string de la URL se actualiza para incluir ese valor sin recargar la página ni añadir entrada al historial

#### Scenario: Solo se serializan las diferencias con el preset

- **WHEN** el escenario es exactamente el preset P2 sin modificar, la moneda es la de defecto (EUR) y no hay modificadores activos
- **THEN** la URL contiene únicamente la referencia al preset y la versión de precios, sin el resto de parámetros, `cur`, modificadores ni overrides

#### Scenario: La moneda no-defecto se serializa

- **WHEN** el usuario cambia la moneda de presentación a USD
- **THEN** la query string incluye `cur` con el valor correspondiente a USD; al volver a EUR, `cur` desaparece de la URL

#### Scenario: Los modificadores que difieren del defecto se serializan

- **WHEN** el usuario activa Batch API al 40% y desactiva el recargo regional/Bedrock (que está activo por defecto)
- **THEN** la query string incluye `b` con el porcentaje y `bd=0`; al volver a los valores por defecto (batch off, recargo on), esas claves desaparecen de la URL

#### Scenario: Los overrides de precios se serializan como deltas

- **WHEN** el usuario edita el output de Opus a 30,00 USD/MTok
- **THEN** la query string incluye `px` con solo esa celda editada (p. ej. `opus.output:30`), sin las celdas no modificadas

### Requirement: Restauración exacta del escenario desde URL

Abrir un enlace con estado serializado DEBE reproducir el escenario exacto: mismos valores en todos los controles, mismos modificadores y overrides de precios, y resultados idénticos a los del momento de compartir con la misma versión de precios (CA-09.1).

#### Scenario: Apertura en otro navegador

- **WHEN** se abre en un navegador limpio una URL generada con un escenario personalizado con Batch API activo y un precio editado
- **THEN** todos los controles, el toggle de batch, su % y el precio editado muestran los valores compartidos y las métricas son idénticas a las del navegador de origen

#### Scenario: Parámetros inválidos en la URL

- **WHEN** la URL contiene un parámetro fuera de rango, no numérico o un override de precio con modelo/campo desconocido
- **THEN** ese parámetro u override se descarta con fallback al valor por defecto correspondiente, sin romper la carga
