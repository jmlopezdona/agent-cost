# scenario-presets

## Purpose

Escenarios predefinidos (P1, P2, P4) cargados desde `presets.json` que aplican todos los parámetros de una vez, muestran su descripción en lenguaje de negocio (resuelta desde i18n por el id del preset) y marcan el estado "Personalizado (basado en …)" al modificar cualquier valor. P2 es el escenario inicial por defecto.

## Requirements

### Requirement: Presets P1, P2 y P4 desde fichero de datos

La aplicación DEBE incluir presets definidos en `src/data/presets.json`, separados de la lógica (CA-05.2), cada uno etiquetado con su `provider` (`anthropic`, `openai` o `google`). Los seis presets del PRD §8 —P1…P6— se etiquetan como `anthropic` con todos sus valores actuales (tokens, mezcla, régimen, duty cycle, número de agentes, nombre, descripción y `learnings`). La tasa de input fresco (`inputK`) DEBE reflejar el uso real de estos modelos operados como servicio: 20 k/h en los presets de carga típica (P1/P2/P4), 24 k/h en el preset greenfield de output alto (P3), 12 k/h en el enjambre QA de contexto corto (P5) y 22 k/h en el agente autónomo de contexto grande (P6). Para OpenAI y Google se añaden presets análogos que replican la intención de P1–P6 (pair programming, delivery balanceado, QA nocturno, etc.) con la mezcla y el perfil de tokens propios del catálogo de cada proveedor; el `inputK` de cada preset análogo DEBE coincidir con el de su par por número (P3↔O3↔G3), por ser una tasa de carga compartida. La mezcla de cada preset solo referencia modelos de su `provider` y suma 1.

#### Scenario: Valores completos del preset P2

- **WHEN** se carga `presets.json`
- **THEN** P2 está etiquetado `provider: anthropic` y contiene input 20 k/h, output 210 k/h, cache read 30 M/h, cache write 530 k/h, mezcla 0/15/65/20, régimen 24×7, duty 60% y 1 agente, con su nombre, descripción y `learnings`

#### Scenario: Input fresco calibrado a uso real

- **WHEN** se carga `presets.json`
- **THEN** ningún preset declara `inputK` por encima de ~24 k/h (P1/P2/P4 = 20, P3 = 24, P5 = 12, P6 = 22), coherente con la mediana real de input no cacheado por hora activa con prompt caching, y los presets análogos de OpenAI y Google replican esos mismos valores por caso de uso

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

### Requirement: Estado personalizado al modificar un preset

Cualquier cambio manual posterior a la carga de un preset DEBE marcar el estado del escenario como "Personalizado (basado en <preset>)", conservando la referencia al preset de origen.

#### Scenario: Modificación tras cargar preset

- **WHEN** el usuario carga P2 y después cambia el duty cycle a 70%
- **THEN** la cabecera muestra "Personalizado (basado en Agente de delivery balanceado)" en lugar del nombre del preset

#### Scenario: Recarga del preset desde estado personalizado

- **WHEN** el estado es personalizado y el usuario vuelve a seleccionar el mismo preset
- **THEN** todos los parámetros se restauran a los valores originales del preset y desaparece la marca de personalizado

### Requirement: Preset por defecto al arrancar

Al abrir la aplicación sin parámetros en la URL, DEBE cargarse el preset P2 como escenario inicial.

#### Scenario: Primera carga sin URL compartida

- **WHEN** el usuario abre la aplicación sin query params
- **THEN** el escenario activo es P2 y las métricas muestran el caso de referencia

### Requirement: Campo learnings por preset mostrado en la UI

Cada preset DEBE tener asociado un texto `learnings` con 1-2 frases de "qué observar" en el escenario (PRD §8), resuelto desde las tablas de i18n por el id del preset, y la UI DEBE mostrarlo en el idioma activo junto a la descripción del escenario activo. Para cada id de preset DEBE existir su `learnings` en los tres idiomas.

#### Scenario: Learnings de P6 visible en el idioma activo

- **WHEN** el escenario activo es P6 y el idioma es francés
- **THEN** la UI muestra su `learnings` en francés, señalando que el cache read concentra la mayor parte del coste y que la palanca es la ingeniería de contexto, no el modelo

#### Scenario: Todos los presets tienen learnings en los tres idiomas

- **WHEN** se valida la app al arrancar
- **THEN** los seis presets (P1–P6) tienen `learnings` no vacío en `es`, `en` y `fr`, y la ausencia en cualquiera de ellos se detecta como error
