# multi-provider

## Purpose

Soporte multi-proveedor por escenario: un proveedor activo (Anthropic/Claude, OpenAI/ChatGPT o Google/Gemini) con esquema de coste declarativo, catálogo de modelos y modelo resto propios de cada familia. Un escenario es single-provider; la mezcla cruzada entre proveedores y el modo flota quedan fuera de alcance.

## Requirements

### Requirement: Proveedor activo del escenario

La aplicación DEBE mantener un **proveedor activo** por escenario (Anthropic/Claude, OpenAI/ChatGPT o Google/Gemini) y un selector de familia visible en cabecera para cambiarlo. Un escenario usa un único proveedor: todos sus modelos, su mezcla, su perfil de tokens y sus modificadores pertenecen al proveedor activo. El proveedor por defecto DEBE ser `anthropic`.

#### Scenario: Selección de familia

- **WHEN** el usuario selecciona la familia OpenAI/ChatGPT estando en Anthropic
- **THEN** el proveedor activo pasa a `openai`, se carga su preset por defecto y los controles de mezcla, perfil de tokens, precios y modificadores pasan a reflejar los de OpenAI

#### Scenario: Proveedor por defecto al arrancar

- **WHEN** la aplicación arranca sin proveedor en la URL
- **THEN** el proveedor activo es `anthropic` y el escenario reproduce el comportamiento previo a multi-proveedor

### Requirement: Esquema de coste declarativo por proveedor

Cada proveedor DEBE declarar en `pricing.json` un `costModel` como lista de categorías (`CostCategory`), cada una con `key`, `kind` (`rate` o `storage`), la tasa de tokens que la dirige (`rateKey`) y su unidad de escala. El motor calcula el coste recorriendo ese `costModel`, sin asumir un conjunto fijo de categorías. Los esquemas mínimos son: Anthropic `input/output/cache_read/cache_write` (todas `rate`); OpenAI `input/cached_input/output` (todas `rate`); Google `input/output/cache_read/cache_storage` (`cache_storage` de tipo `storage`).

#### Scenario: Categorías del proveedor activo

- **WHEN** el proveedor activo es OpenAI
- **THEN** el coste se descompone en `input`, `cached_input` y `output`, sin categoría de escritura de caché

#### Scenario: Categoría de almacenamiento solo en Google

- **WHEN** el proveedor activo es Google
- **THEN** el `costModel` incluye una categoría `cache_storage` de tipo `storage` además de `input`, `output` y `cache_read`

### Requirement: Catálogo de modelos y modelo resto por proveedor

Cada proveedor DEBE declarar entre 3 y 4 modelos (tier frontera/medio/barato) con sus precios oficiales por categoría, y designar un `remainderModel` que absorbe el resto hasta 100% en la mezcla. Los identificadores de modelo se exponen con namespace de proveedor (`anthropic:opus`, `openai:gpt-5`, `google:gemini-flash`).

#### Scenario: Modelo resto de Anthropic

- **WHEN** el proveedor activo es Anthropic y se reparten los sliders entre Fable, Opus y Sonnet
- **THEN** Haiku, declarado como `remainderModel`, absorbe el resto hasta 100%

#### Scenario: Modelo resto de otra familia

- **WHEN** el proveedor activo es Google y se ajustan los sliders de los modelos no-resto
- **THEN** el modelo declarado como `remainderModel` de Google (p. ej. `gemini-flash-lite`) absorbe el resto hasta 100%

### Requirement: Mezcla cruzada y modo flota fuera de alcance

La aplicación NO DEBE permitir, en este alcance, mezclar modelos de distintos proveedores dentro de un mismo escenario ni sumar varios escenarios (modo flota). La mezcla de un escenario solo contiene modelos del proveedor activo.

#### Scenario: La mezcla solo admite modelos del proveedor activo

- **WHEN** el proveedor activo es Anthropic
- **THEN** la mezcla solo puede repartir porcentaje entre modelos de Anthropic, sin opción de añadir modelos de OpenAI o Google al mismo escenario
