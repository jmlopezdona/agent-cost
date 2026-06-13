## MODIFIED Requirements

### Requirement: Serialización del estado en la URL

Todos los parámetros del escenario (tokens, mezcla, régimen, duty, número de agentes, tipo de cambio, moneda de presentación, preset base) y los modificadores de configuración avanzada (Batch API on/%, recargo regional/Bedrock, multiplicador de coste empresa, horas efectivas y overrides de precios) DEBEN poder serializarse de forma compacta en una query string con claves cortas, incluyendo la versión de precios (`pv`) usada (RF-09, CA-09.1). Solo se serializan los valores que difieren de su defecto. La moneda usa la clave `cur`; los modificadores usan claves cortas (`b`, `bd`, `em`, `eh`, `px`) y el modo presentación `present=1`. Esta serialización DEBE generarse **bajo demanda** al copiar el enlace y NO durante la edición: mover un control NO DEBE escribir la query string de la URL. La persistencia continua del escenario durante la edición se realiza en `sessionStorage` (ver capability `session-persistence`), no en la URL.

#### Scenario: La edición no escribe la URL

- **WHEN** el usuario modifica el duty cycle a 70%
- **THEN** la barra de direcciones permanece limpia (sin query string de escenario); el estado se persiste en `sessionStorage`

#### Scenario: El enlace generado solo lleva las diferencias con el preset

- **WHEN** el escenario es exactamente el preset P2 sin modificar, la moneda es la de defecto (EUR) y no hay modificadores activos, y el usuario copia el enlace
- **THEN** la URL copiada contiene únicamente la referencia al preset y la versión de precios, sin el resto de parámetros, `cur`, modificadores ni overrides

#### Scenario: La moneda no-defecto se serializa en el enlace

- **WHEN** el usuario cambia la moneda de presentación a USD y copia el enlace
- **THEN** la URL copiada incluye `cur` con el valor correspondiente a USD; con la moneda por defecto (EUR), `cur` no aparece

#### Scenario: Los modificadores que difieren del defecto se serializan en el enlace

- **WHEN** el usuario activa Batch API al 40%, desactiva el recargo regional/Bedrock y copia el enlace
- **THEN** la URL copiada incluye `b` con el porcentaje y `bd=0`; con los valores por defecto esas claves no aparecen

#### Scenario: Los overrides de precios se serializan como deltas en el enlace

- **WHEN** el usuario edita el output de Opus a 30,00 USD/MTok y copia el enlace
- **THEN** la URL copiada incluye `px` con solo esa celda editada (p. ej. `opus.output:30`), sin las celdas no modificadas

### Requirement: Restauración exacta del escenario desde URL

Abrir un enlace con estado serializado DEBE reproducir el escenario exacto: mismos valores en todos los controles, mismos modificadores y overrides de precios, y resultados idénticos a los del momento de compartir con la misma versión de precios (CA-09.1). El escenario restablecido desde el enlace DEBE adoptarse en `sessionStorage` y la URL DEBE limpiarse a la ruta pelada con `history.replaceState` tras la carga.

#### Scenario: Apertura en otro navegador

- **WHEN** se abre en un navegador limpio una URL generada con un escenario personalizado con Batch API activo y un precio editado
- **THEN** todos los controles, el toggle de batch, su % y el precio editado muestran los valores compartidos, las métricas son idénticas a las del navegador de origen, y la barra de direcciones queda limpia tras la carga

#### Scenario: Parámetros inválidos en la URL

- **WHEN** la URL contiene un parámetro fuera de rango, no numérico o un override de precio con modelo/campo desconocido
- **THEN** ese parámetro u override se descarta con fallback al valor por defecto correspondiente, sin romper la carga

### Requirement: Botón copiar enlace del escenario

La cabecera DEBE incluir un botón "Copiar enlace del escenario" que serialice el estado actual del escenario **bajo demanda** en una URL completa, la copie al portapapeles y confirme la acción al usuario. La URL se construye en el momento de pulsar a partir del estado en memoria, no de la barra de direcciones (que permanece limpia durante el uso).

#### Scenario: Copia del enlace

- **WHEN** el usuario, con un escenario personalizado, pulsa "Copiar enlace del escenario"
- **THEN** se genera una URL con el estado serializado (solo los diffs frente al preset), queda en el portapapeles y se muestra una confirmación breve (p. ej. "Enlace copiado")
