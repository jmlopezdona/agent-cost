# url-sharing

## Purpose

Compartición de escenarios por URL: serialización compacta de todos los parámetros en la query string (incluida la versión de precios), restauración exacta del escenario al abrir el enlace, aviso ante versiones de precios distintas y botón "Copiar enlace del escenario".

## Requirements

### Requirement: Serialización del estado en la URL

Todos los parámetros del escenario (proveedor activo, tokens, mezcla, régimen, duty, número de agentes, tipo de cambio, moneda de presentación, preset base) y los modificadores de configuración avanzada (Batch API on/%, recargo regional/Bedrock cuando aplique, multiplicador de coste empresa, horas efectivas y overrides de precios) DEBEN serializarse de forma compacta en la query string con claves cortas, incluyendo la versión de precios (`pv`) usada (RF-09, CA-09.1). Solo se serializan los valores que difieren de su defecto. El proveedor activo usa la clave `pr` (omitida cuando es el default `anthropic`). Las claves de mezcla se generan por modelo del proveedor activo (p. ej. `m.opus`) y las del perfil de tokens por categoría `rate`; solo se serializan los diffs frente al preset base. La moneda usa la clave `cur`; los modificadores usan claves cortas (`b` batch, `bd` Bedrock, `em`, `eh`, `px` overrides). El modo presentación se serializa como `present=1`. La serialización ocurre **bajo demanda** (al copiar el enlace) a partir del estado en memoria: la edición NO escribe la URL y la barra de direcciones permanece limpia durante el uso (el escenario se persiste en `sessionStorage`, ver capability `session-persistence`). `history.replaceState` solo se usa para limpiar la URL a la ruta pelada al adoptar un enlace entrante, sin crear entradas de historial.

#### Scenario: La serialización refleja el estado en memoria

- **WHEN** el usuario modifica el duty cycle a 70% y pulsa "Copiar enlace del escenario"
- **THEN** la query string del enlace generado incluye ese valor; la barra de direcciones no cambia durante la edición ni se añade entrada al historial

#### Scenario: Solo se serializan las diferencias con el preset

- **WHEN** el escenario es exactamente el preset P2 sin modificar, la moneda es la de defecto (EUR) y no hay modificadores activos
- **THEN** la URL contiene únicamente la referencia al preset y la versión de precios, sin `pr`, ni el resto de parámetros, `cur`, modificadores ni overrides

#### Scenario: El proveedor no-defecto se serializa

- **WHEN** el escenario activo usa el proveedor Google
- **THEN** la query string incluye `pr` con el valor de Google y las claves de mezcla/perfil corresponden a los modelos y categorías de Google

#### Scenario: Los modificadores que difieren del defecto se serializan

- **WHEN** el usuario activa Batch API al 40% y desactiva el recargo regional/Bedrock (que está activo por defecto en Anthropic)
- **THEN** la query string del enlace generado incluye `b` con el porcentaje y `bd=0`; al volver a los valores por defecto, esas claves no aparecen en el enlace

#### Scenario: Los overrides de precios se serializan como deltas

- **WHEN** el usuario edita el output de Opus a 30,00 USD/MTok
- **THEN** la query string incluye `px` con solo esa celda editada (p. ej. `opus.output:30`), sin las celdas no modificadas

### Requirement: Restauración exacta del escenario desde URL

Abrir un enlace con estado serializado DEBE reproducir el escenario exacto: mismo proveedor activo, mismos valores en todos los controles, mismos modificadores y overrides de precios, y resultados idénticos a los del momento de compartir con la misma versión de precios (CA-09.1).

#### Scenario: Restauración de un escenario multi-proveedor

- **WHEN** se abre un enlace con `pr` de Google y sus parámetros de mezcla y perfil
- **THEN** el proveedor activo, la mezcla, el perfil de tokens, los modificadores y los resultados coinciden exactamente con los del momento de compartir

### Requirement: Aviso por versión de precios distinta

Si la versión de precios (`pv`) de la URL difiere de la versión actual de `pricing.json`, la aplicación DEBE mostrar un aviso indicando que los precios han cambiado desde que se compartió el escenario.

#### Scenario: Escenario compartido con precios antiguos

- **WHEN** se abre una URL con `pv` distinto de la versión embebida actual
- **THEN** se muestra un aviso visible indicando la discrepancia de versión de precios, y el cálculo usa los precios actuales

### Requirement: Botón copiar enlace del escenario

La cabecera DEBE incluir un botón "Copiar enlace del escenario" que serialice el estado actual del escenario **bajo demanda** en una URL completa, la copie al portapapeles y confirme la acción al usuario. La URL se construye en el momento de pulsar a partir del estado en memoria, no de la barra de direcciones (que permanece limpia durante el uso).

#### Scenario: Copia del enlace

- **WHEN** el usuario, con un escenario personalizado, pulsa "Copiar enlace del escenario"
- **THEN** se genera una URL con el estado serializado (solo los diffs frente al preset), queda en el portapapeles y se muestra una confirmación breve (p. ej. "Enlace copiado")

### Requirement: Retrocompatibilidad de enlaces previos a multi-proveedor

Abrir un enlace anterior a multi-proveedor (sin clave `pr`) DEBE interpretarse como proveedor `anthropic`: las claves de mezcla legacy `mf/mo/ms` mapean a Fable/Opus/Sonnet de Anthropic con Haiku como resto, y los overrides `px` con prefijos legacy (p. ej. `fable.input`) se interpretan como overrides de los modelos de Anthropic. El escenario restaurado DEBE ser idéntico al que producía la versión previa.

#### Scenario: Enlace antiguo sin proveedor

- **WHEN** se abre un enlace que contiene `mf/mo/ms` y no contiene `pr`
- **THEN** el proveedor activo es Anthropic, la mezcla se restaura desde esas claves con Haiku como resto y el resultado coincide con el de la versión previa

#### Scenario: Overrides legacy de precios

- **WHEN** un enlace antiguo incluye `px=fable.input:10`
- **THEN** se interpreta como override de `anthropic:fable` y se aplica al modelo correspondiente
