## ADDED Requirements

### Requirement: Tabla de precios editable por modelo y categoría

El panel de configuración avanzada DEBE mostrar una tabla de precios editable con las cuatro categorías (input, output, cache read, cache write) por cada modelo (Fable, Opus, Sonnet, Haiku), partiendo de los valores oficiales de `pricing.json`. Las ediciones se aplican como overrides sobre la tabla versionada y recalculan los resultados de forma reactiva, sin alterar `pricing.json` en disco (RF-08).

#### Scenario: Edición de un precio recalcula el blend

- **WHEN** el usuario cambia el precio de output de Opus de 25,00 a 30,00 USD/MTok
- **THEN** la tarifa por hora de Opus, el blend y todas las métricas se recalculan al instante usando 30,00, sin modificar `pricing.json`

#### Scenario: Restaurar valores oficiales

- **WHEN** el usuario, tras editar uno o más precios, pulsa "restaurar oficiales"
- **THEN** todos los overrides se descartan y la tabla y los resultados vuelven a los valores de `pricing.json`

### Requirement: Toggle de Batch API con porcentaje elegible

El panel DEBE ofrecer un toggle de **Batch API (−50%)** y un slider de "% del trabajo elegible para batch" (0–100%); el descuento se aplica solo a esa fracción del coste (RF-08). Por defecto el toggle está desactivado.

#### Scenario: Batch al 40% reduce el coste de la fracción elegible

- **WHEN** el usuario activa Batch API y fija el % elegible en 40
- **THEN** el coste se reduce en `0,40 × 50% = 20%` respecto al escenario sin batch y los resultados se recalculan reactivamente

#### Scenario: Batch desactivado es neutro

- **WHEN** el toggle de Batch API está desactivado
- **THEN** el cálculo no aplica ningún descuento, con independencia del valor del slider de % elegible

### Requirement: Toggle de recargo regional/Bedrock

El panel DEBE ofrecer un toggle de **Recargo regional/Bedrock (+10%)** que, cuando está activo, aplica un recargo del 10% a todas las categorías de todos los modelos (RF-08). Está **activado por defecto** (el acceso vía Amazon Bedrock se toma como caso base), de modo que la cifra por defecto incluye el recargo; el usuario puede desactivarlo.

#### Scenario: Recargo activo por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** el toggle de recargo regional/Bedrock está activo y todas las métricas de coste ya incluyen el ×1,10

#### Scenario: Desactivar el recargo recalcula sin él

- **WHEN** el usuario desactiva el recargo regional/Bedrock
- **THEN** el blend y todas las métricas de coste pasan a calcularse sin el ×1,10 y se recalculan al instante

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

La configuración avanzada DEBE vivir en un panel colapsable dentro de la columna de controles, plegado por defecto, sin que su contenido bloquee el uso básico de la calculadora (§10, RF-08).

#### Scenario: Panel plegado por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** el panel de configuración avanzada está plegado y los controles básicos (tokens, mezcla, régimen) son usables sin desplegarlo
