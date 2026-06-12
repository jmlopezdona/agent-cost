# scenario-presets

## ADDED Requirements

### Requirement: Presets P1, P2 y P4 desde fichero de datos

La aplicación DEBE incluir los presets P1 (Pair programming supervisado), P2 (Agente de delivery balanceado) y P4 (Sonnet-first con escalación) definidos en `src/data/presets.json`, separados de la lógica (CA-05.2), con todos los valores del PRD §8: tokens, mezcla de modelos, régimen, duty cycle y número de agentes, más nombre y descripción de 2-3 frases en lenguaje de negocio (CA-05.1).

#### Scenario: Valores completos del preset P2

- **WHEN** se carga `presets.json`
- **THEN** P2 contiene input 42 k/h, output 210 k/h, cache read 30 M/h, cache write 530 k/h, mezcla 0/15/65/20, régimen 24×7, duty 60% y 1 agente, con su nombre y descripción

### Requirement: Selección de preset carga todos los parámetros

Al seleccionar un preset desde el selector de cabecera, la aplicación DEBE cargar todos los parámetros del escenario de una vez y mostrar la descripción del preset (RF-05).

#### Scenario: Cambio de preset

- **WHEN** el usuario selecciona P4 estando activo P2
- **THEN** todos los controles (tokens, mezcla, régimen, duty, agentes) adoptan los valores de P4, la descripción mostrada pasa a la de P4 y los resultados se recalculan

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
