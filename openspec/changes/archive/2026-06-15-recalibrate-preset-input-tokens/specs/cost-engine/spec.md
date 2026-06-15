## MODIFIED Requirements

### Requirement: Cálculo de tarifa por hora activa por modelo

El motor DEBE calcular la tarifa por hora activa de cada modelo recorriendo el `costModel` de su proveedor: para cada categoría de tipo `rate`, `coste = (tasa_tokens / escala) × precio_categoría`, con todas las tarifas en USD/MTok tomadas de `pricing.json`. El esquema de Anthropic (`input/output/cache_read/cache_write` con escalas `k/k/M/k`) DEBE reducir exactamente a la fórmula RF-01, de modo que el caso de referencia permanezca intacto. Las categorías de tipo `storage` no entran en la tarifa por hora activa (ver "Coste de almacenamiento de caché").

#### Scenario: Tarifa por hora de un modelo con el perfil de tokens P2

- **WHEN** se calcula la tarifa de Sonnet 4.6 con input 20 k/h, output 210 k/h, cache read 30 M/h y cache write 530 k/h, con los precios por defecto
- **THEN** el resultado es 20/1000×3,00 + 210/1000×15,00 + 30×0,30 + 530/1000×3,75 = 14,1975 USD/h, sin redondeo interno

#### Scenario: Categoría de tokens a cero

- **WHEN** una categoría de tokens (p. ej. cache read) es 0
- **THEN** esa categoría aporta 0 al coste y el resto de la fórmula se calcula con normalidad

#### Scenario: Esquema de coste de otro proveedor

- **WHEN** el proveedor activo es OpenAI y su `costModel` es `input/cached_input/output`
- **THEN** la tarifa por hora del modelo es la suma de esas tres categorías de tipo `rate`, sin categoría de escritura de caché

### Requirement: Proyección mensual y anual

El motor DEBE calcular `horas_mes_programadas = horas_dia × dias_semana × (52/12)`, `techo_mensual = blend_hora × horas_mes_programadas × n_agentes`, `ponderado_mensual = techo_mensual × duty_cycle` y `ponderado_anual = ponderado_mensual × 12`, manteniendo precisión completa en los cálculos internos.

#### Scenario: Caso de referencia dorado (CA-01.3)

- **WHEN** se calcula el preset P2 completo (tokens 20/210/30/530, mezcla 0/15/65/20, régimen 12×5, duty 60%, 1 agente) con los precios por defecto
- **THEN** el blend ≈ $13,8/h activa, el techo ≈ $3.585/mes y el ponderado ≈ $2.151/mes, cada uno con error relativo < 1% respecto a estos valores de referencia

#### Scenario: Escalado por número de agentes

- **WHEN** el número de agentes pasa de 1 a 5 sin cambiar nada más
- **THEN** el techo y el ponderado mensual y anual se multiplican exactamente por 5
