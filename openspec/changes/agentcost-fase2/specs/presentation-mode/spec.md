## ADDED Requirements

### Requirement: Vista limpia de presentación

La aplicación DEBE ofrecer un modo presentación que oculte los controles (tokens, mezcla, régimen, configuración avanzada) y muestre únicamente el nombre y la descripción del escenario, las tarjetas de métricas y las visualizaciones, con tipografía ampliada apta para proyectar (RF-10).

#### Scenario: Activación del modo presentación

- **WHEN** el usuario activa el modo presentación
- **THEN** la columna de controles desaparece y solo quedan visibles nombre/descripción del escenario, las tarjetas de métricas y los gráficos, con tipografía ampliada

#### Scenario: Salida del modo presentación

- **WHEN** el usuario desactiva el modo presentación
- **THEN** se restauran los controles y la disposición normal de la página sin perder el escenario actual

### Requirement: Conmutación por clic y por URL

El modo presentación DEBE ser conmutable con un clic y activable vía parámetro de URL `present=1`, de modo que un enlace pueda abrirse directamente en modo presentación (CA-10.1).

#### Scenario: Apertura directa en modo presentación

- **WHEN** se abre una URL que incluye `present=1`
- **THEN** la aplicación arranca en modo presentación con el escenario serializado en esa misma URL

#### Scenario: El conmutador refleja el estado en la URL

- **WHEN** el usuario activa el modo presentación con el conmutador
- **THEN** la URL pasa a incluir `present=1` mediante `history.replaceState`, sin añadir entrada al historial; al desactivarlo, el parámetro desaparece

### Requirement: Learnings del escenario en modo presentación

En modo presentación la UI DEBE mostrar el campo `learnings` del escenario activo junto a su nombre y descripción, para orientar la lectura del gráfico durante la proyección.

#### Scenario: Learnings visibles al proyectar

- **WHEN** el escenario activo es P6 y se activa el modo presentación
- **THEN** se muestra su `learnings` (p. ej. la observación sobre el peso del cache read) junto al nombre y la descripción
