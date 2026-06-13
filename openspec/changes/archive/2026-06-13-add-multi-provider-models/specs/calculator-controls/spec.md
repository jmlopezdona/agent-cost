## MODIFIED Requirements

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

## ADDED Requirements

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
