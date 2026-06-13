# calculator-controls

## Purpose

Controles de entrada reactivos de la calculadora: sliders sincronizados con input numérico para la tasa de tokens por hora activa con coste/hora y porcentaje por categoría, mezcla de modelos con clamping a suma 100%, y régimen/utilización con presets 24x7/12x5/8x5, guía de duty cycle y línea de contexto de horas. Recálculo reactivo sin botón "calcular".

## Requirements

### Requirement: Controles de tasa de tokens con slider e input sincronizados

La UI DEBE ofrecer cuatro controles de tasa de tokens por hora activa, cada uno con slider e input numérico sincronizados bidireccionalmente, con estos rangos: input fresco 0–500 k/h, output 0–1.000 k/h, cache read 0–100 M/h, cache write 0–2.000 k/h.

#### Scenario: Sincronización slider e input

- **WHEN** el usuario mueve el slider de output a 300
- **THEN** el input numérico muestra 300 y los resultados se recalculan; si después teclea 250 en el input, el slider se posiciona en 250

#### Scenario: Valor tecleado fuera de rango

- **WHEN** el usuario teclea un valor fuera del rango del control (p. ej. 700 en input fresco)
- **THEN** el valor se clampa al límite del rango (500) y el cálculo usa el valor clampado

### Requirement: Coste y porcentaje por categoría junto a cada control

Junto a cada control de tokens la UI DEBE mostrar el coste por hora que esa categoría aporta al blend actual y su porcentaje del total (CA-02.1), actualizados reactivamente.

#### Scenario: Visibilidad de la palanca dominante

- **WHEN** el escenario activo es P2 con precios por defecto
- **THEN** junto al control de cache read se muestra su coste/h y un porcentaje mayor que el de las demás categorías

### Requirement: Ayuda contextual por categoría de token

Cada control de tokens DEBE incluir un texto de ayuda (tooltip o popover) que explique la categoría con un ejemplo concreto (CA-02.2).

#### Scenario: Consulta de la ayuda de cache read

- **WHEN** el usuario abre la ayuda del control de cache read
- **THEN** se muestra una explicación con ejemplo del estilo "30M de cache read/h ≈ contexto medio de ~150k tokens releído en ~200 llamadas/hora"

### Requirement: Mezcla de modelos con suma 100%

La UI DEBE ofrecer un slider por cada modelo no-resto del proveedor activo y calcular el `remainderModel` declarado por ese proveedor como resto hasta 100%, con clamping bidireccional que impida que la suma supere 100% (RF-03). El número de sliders y cuál es el modelo resto vienen de los datos del proveedor; para Anthropic son tres sliders (Fable, Opus, Sonnet) con Haiku como resto.

#### Scenario: Modelo resto del proveedor activo

- **WHEN** el proveedor activo es Anthropic y el usuario fija Fable 0%, Opus 15% y Sonnet 65%
- **THEN** Haiku se muestra automáticamente como 20% y la suma es 100%

#### Scenario: Clamping al superar el 100%

- **WHEN** Opus está al 40%, Sonnet al 50% y el usuario intenta subir Fable por encima del 10%
- **THEN** el slider de Fable se detiene en 10% y Haiku queda en 0%

#### Scenario: Mezcla de otra familia

- **WHEN** el proveedor activo es OpenAI con tres modelos y `remainderModel` el más barato
- **THEN** la UI muestra dos sliders para los modelos no-resto y el tercero se calcula como resto hasta 100%

### Requirement: Tarifa por hora visible por modelo y del blend

La UI DEBE mostrar la tarifa $/hora activa resultante de cada modelo del proveedor activo y la tarifa del blend actual (CA-03.1).

#### Scenario: Tarifas visibles al ajustar la mezcla

- **WHEN** el usuario modifica cualquier slider de mezcla
- **THEN** las tarifas por modelo del proveedor activo permanecen visibles y la tarifa blend se actualiza al instante

### Requirement: Controles de régimen y utilización

La UI DEBE ofrecer sliders de horas/día (1–24), días/semana (1–7), duty cycle (10–100%) y número de agentes (1–100), más botones de preset de régimen `24x7`, `12x5` y `8x5` (RF-04).

#### Scenario: Botón de preset de régimen

- **WHEN** el usuario pulsa el botón `8x5`
- **THEN** horas/día pasa a 8 y días/semana a 5, sin alterar duty cycle ni número de agentes

### Requirement: Línea de contexto de horas

La UI DEBE mostrar siempre la línea "X h/mes programadas por agente · Y h activas con duty Z%" calculada a partir del régimen actual (CA-04.1).

#### Scenario: Actualización de la línea de contexto

- **WHEN** el régimen es 24×7 con duty 60%
- **THEN** la línea muestra ≈ 728 h/mes programadas y ≈ 437 h activas con duty 60%

### Requirement: Guía de duty cycle

La UI DEBE incluir una guía breve de duty cycle integrada junto al control: supervisado ≈ 30–40%, agente en CI ≈ 50–65%, autónomo ≈ 75–85% (CA-04.2).

#### Scenario: Guía visible junto al control

- **WHEN** el usuario interactúa con el control de duty cycle
- **THEN** la guía con los tres rangos orientativos es visible o accesible sin abandonar la sección

### Requirement: Recálculo reactivo

Cualquier cambio en cualquier control DEBE recalcular y repintar todos los resultados en menos de 16 ms, sin botón "calcular" (CA-01.2).

#### Scenario: Arrastre continuo de un slider

- **WHEN** el usuario arrastra un slider de forma continua
- **THEN** las métricas y gráficos se actualizan de forma fluida durante el arrastre, sin acción adicional de confirmación

### Requirement: Perfil de tokens adaptativo al proveedor activo

La UI DEBE renderizar los controles de tasa de tokens a partir de las categorías de tipo `rate` del `costModel` del proveedor activo: un control por categoría, con su rango, unidad y ayuda contextual. Para Anthropic se muestran los cuatro controles actuales (input/output/cache read/cache write); para OpenAI tres (input/cached input/output); para Google los de `rate` más, cuando se activa el almacenamiento de caché, un control de tokens retenidos.

#### Scenario: Controles según el proveedor activo

- **WHEN** el proveedor activo es OpenAI
- **THEN** la sección de tasa de tokens muestra los controles de `input`, `cached_input` y `output`, sin control de escritura de caché

#### Scenario: Control de tokens retenidos solo con storage activo

- **WHEN** el proveedor activo es Google y se activa la categoría de almacenamiento de caché
- **THEN** aparece un control adicional de tokens retenidos en caché que alimenta el coste de almacenamiento; con el almacenamiento desactivado ese control no se muestra

### Requirement: Tabs por familia en la mezcla de modelos

La sección de mezcla DEBE presentar una pestaña por familia/proveedor, con la del proveedor activo seleccionada por defecto. Cambiar de pestaña cambia el proveedor activo del escenario (manteniéndose single-provider), no añade modelos de otra familia a la mezcla actual.

#### Scenario: Pestaña activa por defecto

- **WHEN** el proveedor activo es Anthropic
- **THEN** la pestaña de Anthropic aparece seleccionada y muestra sus sliders de mezcla

#### Scenario: Cambio de pestaña cambia el proveedor activo

- **WHEN** el usuario abre la pestaña de Google en la sección de mezcla
- **THEN** el proveedor activo pasa a Google y la mezcla mostrada es la de los modelos de Google
