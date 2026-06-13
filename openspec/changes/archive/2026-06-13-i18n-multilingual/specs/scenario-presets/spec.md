## MODIFIED Requirements

### Requirement: Presets P1, P2 y P4 desde fichero de datos

La aplicación DEBE incluir los seis presets del PRD §8 —P1 (Pair programming supervisado), P2 (Agente de delivery balanceado), P3 (Diseño intensivo / greenfield), P4 (Evolutivos sobre código maduro), P5 (Enjambre QA nocturno) y P6 (Agente autónomo de mantenimiento)— definidos en `src/data/presets.json`, separados de la lógica (CA-05.2), con todos los **valores numéricos/estructurales** del PRD §8: id, tokens, mezcla de modelos, régimen, duty cycle y número de agentes. La **prosa de cada preset** —nombre, descripción de 2-3 frases en lenguaje de negocio (CA-05.1) y `learnings`— DEBE resolverse desde las tablas de i18n indexada por el id del preset (no como literales en `presets.json`), en el idioma activo.

#### Scenario: Valores completos del preset P2

- **WHEN** se carga `presets.json`
- **THEN** P2 contiene input 42 k/h, output 210 k/h, cache read 30 M/h, cache write 530 k/h, mezcla 0/15/65/20, régimen 24×7, duty 60% y 1 agente, y su nombre, descripción y `learnings` se resuelven desde i18n por el id `p2`

#### Scenario: Valores completos del preset P5

- **WHEN** se carga `presets.json`
- **THEN** P5 contiene input 25 k/h, output 120 k/h, cache read 12 M/h, cache write 300 k/h, mezcla 0/0/30/70, régimen 12×7, duty 85% y 5 agentes, con el bloque de modificadores que activa Batch al 80%, y su prosa resuelta desde i18n por el id `p5`

#### Scenario: Valores completos del preset P6

- **WHEN** se carga `presets.json`
- **THEN** P6 contiene input 45 k/h, output 220 k/h, cache read 50 M/h, cache write 600 k/h, mezcla 0/10/70/20, régimen 24×7, duty 80% y 1 agente, y su prosa resuelta desde i18n por el id `p6`

### Requirement: Campo learnings por preset mostrado en la UI

Cada preset DEBE tener asociado un texto `learnings` con 1-2 frases de "qué observar" en el escenario (PRD §8), resuelto desde las tablas de i18n por el id del preset, y la UI DEBE mostrarlo en el idioma activo junto a la descripción del escenario activo. Para cada id de preset DEBE existir su `learnings` en los tres idiomas.

#### Scenario: Learnings de P6 visible en el idioma activo

- **WHEN** el escenario activo es P6 y el idioma es francés
- **THEN** la UI muestra su `learnings` en francés, señalando que el cache read concentra la mayor parte del coste y que la palanca es la ingeniería de contexto, no el modelo

#### Scenario: Todos los presets tienen learnings en los tres idiomas

- **WHEN** se valida la app al arrancar
- **THEN** los seis presets (P1–P6) tienen `learnings` no vacío en `es`, `en` y `fr`, y la ausencia en cualquiera de ellos se detecta como error
