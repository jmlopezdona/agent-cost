# scenario-presets

## Purpose

Escenarios predefinidos (P1, P2, P4) cargados desde `presets.json` que aplican todos los parámetros de una vez, muestran su descripción en lenguaje de negocio y marcan el estado "Personalizado (basado en …)" al modificar cualquier valor. P2 es el escenario inicial por defecto.

## Requirements

### Requirement: Presets P1, P2 y P4 desde fichero de datos

La aplicación DEBE incluir los seis presets del PRD §8 —P1 (Pair programming supervisado), P2 (Agente de delivery balanceado), P3 (Diseño intensivo / greenfield), P4 (Evolutivos sobre código maduro), P5 (Enjambre QA nocturno) y P6 (Agente autónomo de mantenimiento)— definidos en `src/data/presets.json`, separados de la lógica (CA-05.2), con todos los valores del PRD §8: tokens, mezcla de modelos, régimen, duty cycle y número de agentes, más nombre, descripción de 2-3 frases en lenguaje de negocio (CA-05.1) y campo `learnings`.

#### Scenario: Valores completos del preset P2

- **WHEN** se carga `presets.json`
- **THEN** P2 contiene input 42 k/h, output 210 k/h, cache read 30 M/h, cache write 530 k/h, mezcla 0/15/65/20, régimen 24×7, duty 60% y 1 agente, con su nombre, descripción y `learnings`

#### Scenario: Valores completos del preset P5

- **WHEN** se carga `presets.json`
- **THEN** P5 contiene input 25 k/h, output 120 k/h, cache read 12 M/h, cache write 300 k/h, mezcla 0/0/30/70, régimen 12×7, duty 85% y 5 agentes, con su `learnings` y el bloque de modificadores que activa Batch al 80%

#### Scenario: Valores completos del preset P6

- **WHEN** se carga `presets.json`
- **THEN** P6 contiene input 45 k/h, output 220 k/h, cache read 50 M/h, cache write 600 k/h, mezcla 0/10/70/20, régimen 24×7, duty 80% y 1 agente, con su `learnings`

### Requirement: Selección de preset carga todos los parámetros

Al seleccionar un preset desde el selector de cabecera, la aplicación DEBE cargar todos los parámetros del escenario de una vez, mostrar la descripción del preset y aplicar el bloque de modificadores por defecto que el preset declare (p. ej. P5 activa Batch al 80%), dejando neutros los modificadores en los presets que no lo declaren (RF-05).

#### Scenario: Cambio de preset

- **WHEN** el usuario selecciona P4 estando activo P2
- **THEN** todos los controles (tokens, mezcla, régimen, duty, agentes) adoptan los valores de P4, la descripción mostrada pasa a la de P4 y los resultados se recalculan

#### Scenario: Preset con modificadores por defecto

- **WHEN** el usuario selecciona P5
- **THEN** además de los tokens, mezcla, régimen, duty y agentes de P5, el toggle de Batch API queda activo con 80% de trabajo elegible y aparece el badge correspondiente

#### Scenario: Preset sin modificadores deja el estado neutro

- **WHEN** el usuario selecciona P2 estando activo P5
- **THEN** el toggle de Batch API queda desactivado y no se aplica ningún descuento

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

Cada preset en `presets.json` DEBE incluir un campo `learnings` con 1-2 frases de "qué observar" en el escenario (PRD §8), y la UI DEBE mostrarlo junto a la descripción del escenario activo.

#### Scenario: Learnings de P6 visible

- **WHEN** el escenario activo es P6
- **THEN** la UI muestra su `learnings` señalando que el cache read concentra la mayor parte del coste y que la palanca es la ingeniería de contexto, no el modelo

#### Scenario: Todos los presets tienen learnings

- **WHEN** se valida `presets.json` al arrancar
- **THEN** los seis presets (P1–P6) incluyen un campo `learnings` no vacío y el type guard rechaza un preset sin él
