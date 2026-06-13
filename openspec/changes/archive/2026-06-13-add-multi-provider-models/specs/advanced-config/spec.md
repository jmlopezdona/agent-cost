## MODIFIED Requirements

### Requirement: Tabla de precios editable por modelo y categoría

El panel de configuración avanzada DEBE mostrar una tabla de precios editable organizada en pestañas por familia/proveedor (la del proveedor activo seleccionada por defecto). Cada pestaña muestra las categorías del `costModel` de ese proveedor por cada uno de sus modelos, partiendo de los valores oficiales de `pricing.json`. Las ediciones se aplican como overrides sobre la tabla versionada y recalculan los resultados de forma reactiva, sin alterar `pricing.json` en disco (RF-08).

#### Scenario: Edición de un precio recalcula el blend

- **WHEN** el usuario cambia el precio de output de Opus de 25,00 a 30,00 USD/MTok
- **THEN** la tarifa por hora de Opus, el blend y todas las métricas se recalculan al instante usando 30,00, sin modificar `pricing.json`

#### Scenario: Restaurar valores oficiales

- **WHEN** el usuario, tras editar uno o más precios, pulsa "restaurar oficiales"
- **THEN** todos los overrides se descartan y la tabla y los resultados vuelven a los valores de `pricing.json`

#### Scenario: Categorías según el proveedor de la pestaña

- **WHEN** el usuario abre la pestaña de precios de OpenAI
- **THEN** la tabla muestra las columnas `input`, `cached_input` y `output` para los modelos de OpenAI, sin columna de escritura de caché

### Requirement: Toggle de recargo regional/Bedrock

El panel DEBE ofrecer un toggle de **Recargo regional (+10%)** únicamente cuando el proveedor activo declara el modificador regional (Anthropic y OpenAI). Cuando está activo, aplica un recargo del 10% a todas las categorías de todos los modelos (RF-08). El estado por defecto depende del proveedor: en Anthropic está **activado por defecto** (el acceso vía Amazon Bedrock se toma como caso base); en OpenAI está **desactivado por defecto** (los endpoints de residencia regional son opt-in). El usuario puede cambiarlo. Para proveedores que no ofrecen el modificador (Google), el toggle no se muestra.

#### Scenario: Recargo activo por defecto en Anthropic

- **WHEN** el proveedor activo es Anthropic y no se ha tocado el toggle
- **THEN** el recargo del 10% está aplicado y aparece su badge junto a los resultados

#### Scenario: Recargo disponible pero inactivo por defecto en OpenAI

- **WHEN** el proveedor activo es OpenAI y no se ha tocado el toggle
- **THEN** el toggle de recargo regional se muestra desactivado y el cálculo no aplica recargo hasta que el usuario lo active

#### Scenario: Toggle ausente en proveedores sin recargo

- **WHEN** el proveedor activo es Google
- **THEN** el toggle de recargo regional no se muestra y el cálculo no aplica recargo

## ADDED Requirements

### Requirement: Modificadores condicionales al proveedor activo

El panel DEBE mostrar únicamente los modificadores que ofrece el proveedor activo según su declaración `modifiers` en `pricing.json`. El toggle de Batch API se muestra para los tres proveedores; el recargo regional solo para los que lo declaran (Anthropic y OpenAI). Los badges de modificadores activos reflejan solo los aplicables al proveedor activo.

#### Scenario: Batch disponible en todos los proveedores

- **WHEN** el proveedor activo es Google
- **THEN** el toggle de Batch API está disponible y, al activarlo al 40%, reduce el coste en un 20% con su badge correspondiente

#### Scenario: Conjunto de modificadores cambia con el proveedor

- **WHEN** el usuario cambia el proveedor activo de Anthropic a Google
- **THEN** desaparece el toggle de recargo regional y permanece el de Batch API
