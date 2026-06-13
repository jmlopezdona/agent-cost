## MODIFIED Requirements

### Requirement: Presets P1, P2 y P4 desde fichero de datos

La aplicación DEBE incluir presets definidos en `src/data/presets.json`, separados de la lógica (CA-05.2), cada uno etiquetado con su `provider` (`anthropic`, `openai` o `google`). Los seis presets del PRD §8 —P1…P6— se etiquetan como `anthropic` con todos sus valores actuales (tokens, mezcla, régimen, duty cycle, número de agentes, nombre, descripción y `learnings`). Para OpenAI y Google se añaden presets análogos que replican la intención de P1–P6 (pair programming, delivery balanceado, QA nocturno, etc.) con la mezcla y el perfil de tokens propios del catálogo de cada proveedor. La mezcla de cada preset solo referencia modelos de su `provider` y suma 1.

#### Scenario: Valores completos del preset P2

- **WHEN** se carga `presets.json`
- **THEN** P2 está etiquetado `provider: anthropic` y contiene input 42 k/h, output 210 k/h, cache read 30 M/h, cache write 530 k/h, mezcla 0/15/65/20, régimen 24×7, duty 60% y 1 agente, con su nombre, descripción y `learnings`

#### Scenario: Presets análogos por proveedor

- **WHEN** se carga `presets.json`
- **THEN** existen presets etiquetados `provider: openai` y `provider: google` que replican la intención de los escenarios P1–P6 con mezclas formadas solo por modelos de su respectivo proveedor

#### Scenario: Type guard valida coherencia preset-proveedor

- **WHEN** un preset declara una mezcla con un modelo que no pertenece a su `provider`
- **THEN** el type guard de presets lo rechaza como inválido

### Requirement: Selección de preset carga todos los parámetros

Al seleccionar un preset desde el selector de cabecera, la aplicación DEBE cargar todos los parámetros del escenario de una vez, fijar el proveedor activo al `provider` del preset, mostrar la descripción del preset y aplicar el bloque de modificadores por defecto que el preset declare (p. ej. P5 activa Batch al 80%), dejando neutros los modificadores en los presets que no lo declaren (RF-05). El selector DEBE filtrar los presets mostrados por la familia activa.

#### Scenario: Cambio de preset dentro de la familia activa

- **WHEN** el usuario selecciona P4 estando activo P2 (ambos de Anthropic)
- **THEN** todos los controles (tokens, mezcla, régimen, duty, agentes) adoptan los valores de P4, la descripción mostrada pasa a la de P4 y los resultados se recalculan

#### Scenario: Selección de preset de otra familia fija el proveedor activo

- **WHEN** el usuario selecciona un preset etiquetado `provider: google`
- **THEN** el proveedor activo pasa a Google, los controles adoptan los valores del preset y la mezcla solo contiene modelos de Google

#### Scenario: Preset con modificadores por defecto

- **WHEN** el usuario selecciona P5
- **THEN** además de los tokens, mezcla, régimen, duty y agentes de P5, el toggle de Batch API queda activo con 80% de trabajo elegible y aparece el badge correspondiente
