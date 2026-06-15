## MODIFIED Requirements

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
