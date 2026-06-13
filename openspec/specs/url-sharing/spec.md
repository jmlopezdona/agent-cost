# url-sharing

## Purpose

Compartición de escenarios por URL: serialización compacta de todos los parámetros en la query string (incluida la versión de precios), restauración exacta del escenario al abrir el enlace, aviso ante versiones de precios distintas y botón "Copiar enlace del escenario".

## Requirements

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

### Requirement: Restauración exacta del escenario desde URL

Abrir un enlace con estado serializado DEBE reproducir el escenario exacto: mismos valores en todos los controles y resultados idénticos a los del momento de compartir con la misma versión de precios (CA-09.1).

#### Scenario: Apertura en otro navegador

- **WHEN** se abre en un navegador limpio una URL generada con un escenario personalizado
- **THEN** todos los controles muestran los valores compartidos y las métricas son idénticas a las del navegador de origen

#### Scenario: Parámetros inválidos en la URL

- **WHEN** la URL contiene un parámetro fuera de rango o no numérico
- **THEN** ese parámetro se descarta con fallback al valor del preset base, sin romper la carga

### Requirement: Aviso por versión de precios distinta

Si la versión de precios (`pv`) de la URL difiere de la versión actual de `pricing.json`, la aplicación DEBE mostrar un aviso indicando que los precios han cambiado desde que se compartió el escenario.

#### Scenario: Escenario compartido con precios antiguos

- **WHEN** se abre una URL con `pv` distinto de la versión embebida actual
- **THEN** se muestra un aviso visible indicando la discrepancia de versión de precios, y el cálculo usa los precios actuales

### Requirement: Botón copiar enlace del escenario

La cabecera DEBE incluir un botón "Copiar enlace del escenario" que copie la URL completa actual al portapapeles y confirme la acción al usuario.

#### Scenario: Copia del enlace

- **WHEN** el usuario pulsa "Copiar enlace del escenario"
- **THEN** la URL con el estado serializado queda en el portapapeles y se muestra una confirmación breve (p. ej. "Enlace copiado")
