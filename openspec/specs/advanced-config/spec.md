# advanced-config

## Purpose

Panel colapsable de configuración avanzada que expone modificadores del escenario sin alterar `pricing.json` en disco: tabla de precios editable por modelo y categoría, toggle de Batch API con porcentaje elegible, toggle de recargo regional/Bedrock, tipo de cambio USD→EUR editable, multiplicador de coste empresa y horas efectivas, más badges de los modificadores activos junto a los resultados.

## Requirements

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

### Requirement: Toggle de Batch API con porcentaje elegible

El panel DEBE ofrecer un toggle de **Batch API (−50%)** y un slider de "% del trabajo elegible para batch" (0–100%); el descuento se aplica solo a esa fracción del coste (RF-08). Por defecto el toggle está desactivado.

#### Scenario: Batch al 40% reduce el coste de la fracción elegible

- **WHEN** el usuario activa Batch API y fija el % elegible en 40
- **THEN** el coste se reduce en `0,40 × 50% = 20%` respecto al escenario sin batch y los resultados se recalculan reactivamente

#### Scenario: Batch desactivado es neutro

- **WHEN** el toggle de Batch API está desactivado
- **THEN** el cálculo no aplica ningún descuento, con independencia del valor del slider de % elegible

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

### Requirement: Tipo de cambio USD→EUR editable

El panel DEBE permitir editar el tipo de cambio USD→EUR (`fx`), compartido con la comparativa salarial y la moneda de presentación, con efecto inmediato en todas las cifras convertidas (RF-08).

#### Scenario: Cambio de fx propaga a la presentación en EUR

- **WHEN** la moneda activa es EUR y el usuario cambia `fx` de 0,92 a 0,95
- **THEN** todas las cifras de coste del agente mostradas en EUR se recalculan con el nuevo tipo de cambio

### Requirement: Multiplicador de coste empresa y horas efectivas editables

El panel DEBE permitir editar el multiplicador de **coste empresa** (default 1,30) y las **horas efectivas anuales** del FTE (default 1.720), con efecto inmediato en la comparativa salarial (RF-08).

#### Scenario: Edición del multiplicador recalcula la comparativa

- **WHEN** el usuario cambia el multiplicador de coste empresa de 1,30 a 1,40
- **THEN** los costes empresa de los cuatro perfiles, las equivalencias FTE y las barras de la comparativa se recalculan al instante

#### Scenario: Edición de las horas efectivas recalcula €/h efectiva

- **WHEN** el usuario cambia las horas efectivas anuales de 1.720 a 1.600
- **THEN** el coste por hora efectiva de cada perfil y el ratio de horas frente al agente se recalculan con el nuevo valor

### Requirement: Badges de modificadores activos junto a los resultados

Cuando un modificador está activo, la UI DEBE mostrar un badge visible junto a los resultados que lo indique: "batch X% aplicado", "Bedrock +10%" o "precios editados" (CA-08.1). Sin modificadores activos no se muestra ningún badge.

#### Scenario: Badge de batch visible

- **WHEN** Batch API está activo al 40%
- **THEN** junto a los resultados aparece un badge "batch 40% aplicado"

#### Scenario: Sin modificadores no hay badge

- **WHEN** no hay batch, ni recargo regional, ni precios editados
- **THEN** no se muestra ningún badge de modificador junto a los resultados

### Requirement: Panel colapsable de configuración avanzada

La configuración avanzada DEBE vivir como una sección del acordeón exclusivo de la columna de controles, cerrada por defecto, sin que su contenido bloquee el uso básico de la calculadora (§10, RF-08). Al abrirla, las demás secciones del acordeón se cierran conforme a la regla de exclusividad; los controles básicos (tokens, mezcla, régimen) son accesibles abriendo su sección correspondiente.

#### Scenario: Panel plegado por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** la sección de configuración avanzada está cerrada y los controles básicos son usables a través del acordeón sin desplegar la avanzada

#### Scenario: Abrir la avanzada cierra las demás

- **WHEN** el usuario abre la sección de configuración avanzada
- **THEN** se muestra su contenido y la sección que estuviera abierta antes se cierra, quedando solo la avanzada abierta

### Requirement: Modificadores condicionales al proveedor activo

El panel DEBE mostrar únicamente los modificadores que ofrece el proveedor activo según su declaración `modifiers` en `pricing.json`. El toggle de Batch API se muestra para los tres proveedores; el recargo regional solo para los que lo declaran (Anthropic y OpenAI). Los badges de modificadores activos reflejan solo los aplicables al proveedor activo.

#### Scenario: Batch disponible en todos los proveedores

- **WHEN** el proveedor activo es Google
- **THEN** el toggle de Batch API está disponible y, al activarlo al 40%, reduce el coste en un 20% con su badge correspondiente

#### Scenario: Conjunto de modificadores cambia con el proveedor

- **WHEN** el usuario cambia el proveedor activo de Anthropic a Google
- **THEN** desaparece el toggle de recargo regional y permanece el de Batch API
