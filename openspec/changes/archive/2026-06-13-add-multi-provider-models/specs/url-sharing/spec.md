## MODIFIED Requirements

### Requirement: Serialización del estado en la URL

Todos los parámetros del escenario (proveedor activo, tokens, mezcla, régimen, duty, número de agentes, tipo de cambio, moneda de presentación, preset base) y los modificadores de configuración avanzada (Batch API on/%, recargo regional/Bedrock cuando aplique, multiplicador de coste empresa, horas efectivas y overrides de precios) DEBEN serializarse de forma compacta en la query string con claves cortas, incluyendo la versión de precios (`pv`) usada (RF-09, CA-09.1). Solo se serializan los valores que difieren de su defecto. El proveedor activo usa la clave `pr` (omitida cuando es el default `anthropic`). Las claves de mezcla se generan por modelo del proveedor activo (p. ej. `m.opus`) y las del perfil de tokens por categoría `rate`; solo se serializan los diffs frente al preset base. La moneda usa la clave `cur`; los modificadores usan claves cortas (`b` batch, `bd` Bedrock, `em`, `eh`, `px` overrides). El modo presentación se serializa como `present=1`. La URL DEBE actualizarse con `history.replaceState` sin crear entradas de historial.

#### Scenario: URL refleja el estado actual

- **WHEN** el usuario modifica el duty cycle a 70%
- **THEN** la query string de la URL se actualiza para incluir ese valor sin recargar la página ni añadir entrada al historial

#### Scenario: Solo se serializan las diferencias con el preset

- **WHEN** el escenario es exactamente el preset P2 sin modificar, la moneda es la de defecto (EUR) y no hay modificadores activos
- **THEN** la URL contiene únicamente la referencia al preset y la versión de precios, sin `pr`, ni el resto de parámetros, `cur`, modificadores ni overrides

#### Scenario: El proveedor no-defecto se serializa

- **WHEN** el escenario activo usa el proveedor Google
- **THEN** la query string incluye `pr` con el valor de Google y las claves de mezcla/perfil corresponden a los modelos y categorías de Google

#### Scenario: Los modificadores que difieren del defecto se serializan

- **WHEN** el usuario activa Batch API al 40% y desactiva el recargo regional/Bedrock (que está activo por defecto en Anthropic)
- **THEN** la query string incluye `b` con el porcentaje y `bd=0`; al volver a los valores por defecto, esas claves desaparecen de la URL

#### Scenario: Los overrides de precios se serializan como deltas

- **WHEN** el usuario edita el output de Opus a 30,00 USD/MTok
- **THEN** la query string incluye `px` con solo esa celda editada (p. ej. `opus.output:30`), sin las celdas no modificadas

### Requirement: Restauración exacta del escenario desde URL

Abrir un enlace con estado serializado DEBE reproducir el escenario exacto: mismo proveedor activo, mismos valores en todos los controles, mismos modificadores y overrides de precios, y resultados idénticos a los del momento de compartir con la misma versión de precios (CA-09.1).

#### Scenario: Restauración de un escenario multi-proveedor

- **WHEN** se abre un enlace con `pr` de Google y sus parámetros de mezcla y perfil
- **THEN** el proveedor activo, la mezcla, el perfil de tokens, los modificadores y los resultados coinciden exactamente con los del momento de compartir

## ADDED Requirements

### Requirement: Retrocompatibilidad de enlaces previos a multi-proveedor

Abrir un enlace anterior a multi-proveedor (sin clave `pr`) DEBE interpretarse como proveedor `anthropic`: las claves de mezcla legacy `mf/mo/ms` mapean a Fable/Opus/Sonnet de Anthropic con Haiku como resto, y los overrides `px` con prefijos legacy (p. ej. `fable.input`) se interpretan como overrides de los modelos de Anthropic. El escenario restaurado DEBE ser idéntico al que producía la versión previa.

#### Scenario: Enlace antiguo sin proveedor

- **WHEN** se abre un enlace que contiene `mf/mo/ms` y no contiene `pr`
- **THEN** el proveedor activo es Anthropic, la mezcla se restaura desde esas claves con Haiku como resto y el resultado coincide con el de la versión previa

#### Scenario: Overrides legacy de precios

- **WHEN** un enlace antiguo incluye `px=fable.input:10`
- **THEN** se interpreta como override de `anthropic:fable` y se aplica al modelo correspondiente
