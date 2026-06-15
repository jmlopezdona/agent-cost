# cost-engine

## Purpose

Motor de cálculo puro sin dependencias de UI: tarifa por hora activa por modelo, blend ponderado por mezcla de modelos, horas programadas mensuales, techo y ponderado mensual/anual, desglose de coste por categoría de token y conversión de divisa USD→EUR. Incluye los datos de precios versionados (`pricing.json`).

## Requirements

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

### Requirement: Blend ponderado por mezcla de modelos

El motor DEBE calcular la tarifa blend como `Σ (mix_modelo × tarifa_hora(modelo))` sobre los modelos del proveedor activo, donde la mezcla se expresa en fracciones que suman 1. El número de modelos y cuál actúa como resto vienen de los datos del proveedor, no fijados en el motor.

#### Scenario: Mezcla 100% en un único modelo

- **WHEN** la mezcla es 100% Opus y 0% el resto
- **THEN** el blend coincide exactamente con la tarifa por hora de Opus

#### Scenario: Mezcla repartida

- **WHEN** la mezcla es 15% Opus, 65% Sonnet y 20% Haiku (P2)
- **THEN** el blend es la suma ponderada de las tres tarifas por esas fracciones

### Requirement: Proyección mensual y anual

El motor DEBE calcular `horas_mes_programadas = horas_dia × dias_semana × (52/12)`, `techo_mensual = blend_hora × horas_mes_programadas × n_agentes`, `ponderado_mensual = techo_mensual × duty_cycle` y `ponderado_anual = ponderado_mensual × 12`, manteniendo precisión completa en los cálculos internos.

#### Scenario: Caso de referencia dorado (CA-01.3)

- **WHEN** se calcula el preset P2 completo (tokens 20/210/30/530, mezcla 0/15/65/20, régimen 12×5, duty 60%, 1 agente) con los precios por defecto
- **THEN** el blend ≈ $13,8/h activa, el techo ≈ $3.585/mes y el ponderado ≈ $2.151/mes, cada uno con error relativo < 1% respecto a estos valores de referencia

#### Scenario: Escalado por número de agentes

- **WHEN** el número de agentes pasa de 1 a 5 sin cambiar nada más
- **THEN** el techo y el ponderado mensual y anual se multiplican exactamente por 5

### Requirement: Desglose de coste por categoría de token

El motor DEBE devolver, para el blend actual, el coste por hora aportado por cada categoría (input fresco, output, cache read, cache write) en USD/h y como porcentaje del total.

#### Scenario: Suma del desglose

- **WHEN** se calcula el desglose para cualquier escenario
- **THEN** la suma de las cuatro categorías en USD/h es igual al blend por hora y los porcentajes suman 100%

#### Scenario: Cache read dominante en el caso de referencia

- **WHEN** se calcula el desglose del preset P2 con los precios por defecto
- **THEN** la categoría cache read es la de mayor coste por hora del desglose

### Requirement: Conversión de divisa USD→EUR

El motor DEBE convertir cualquier resultado en USD a EUR multiplicando por un tipo de cambio configurable que se recibe como parámetro.

#### Scenario: Conversión aplicada al ponderado mensual

- **WHEN** el ponderado mensual es 6.000 USD y el tipo de cambio es 0,92 EUR/USD
- **THEN** el resultado en EUR es 5.520

### Requirement: Pureza e independencia de la UI

El motor DEBE implementarse como módulo puro en `src/engine/` sin dependencias de DOM, React ni del store, de modo que sea ejecutable en Node (tests, futuro CLI).

#### Scenario: Ejecución en entorno de test sin DOM

- **WHEN** la suite de Vitest ejecuta el motor en entorno Node puro (sin jsdom)
- **THEN** todos los cálculos funcionan sin errores de dependencias de navegador

### Requirement: Datos de precios versionados

Los precios DEBEN vivir en `src/data/pricing.json` con campos `version` y `effective_date`, organizados por proveedor: `providers: Record<ProviderId, { name, costModel, modifiers, remainderModel, models }>`. Cada modelo declara su precio por cada categoría de su `costModel`. Los valores por defecto de Anthropic son los del PRD (RF-03): Fable 10/50/1/12,50 — Opus 5/25/0,50/6,25 — Sonnet 3/15/0,30/3,75 — Haiku 1/5/0,10/1,25 USD/MTok. OpenAI y Google declaran sus modelos y precios oficiales con su propia fuente y fecha.

#### Scenario: Carga de precios por defecto

- **WHEN** la aplicación arranca sin parámetros en la URL
- **THEN** el motor usa los precios del proveedor por defecto (`anthropic`) en `pricing.json` y su `version` queda disponible para la serialización en URL

#### Scenario: Type guard valida el esquema por proveedor

- **WHEN** se carga `pricing.json`
- **THEN** el type guard verifica que cada proveedor tiene `costModel`, `models` con precio por cada categoría de su `costModel` y un `remainderModel` que existe entre sus modelos

### Requirement: Modificador de descuento Batch API

El motor DEBE aceptar una fracción de trabajo elegible para Batch API y un descuento (default 0,5 = −50%) vía `EngineOptions`, aplicando el descuento solo a esa fracción del coste de cada categoría: factor de batch = `1 − batchFraction × batchDiscount`. Con `batchFraction = 0` (default) el modificador es neutro.

#### Scenario: Descuento aplicado a la fracción elegible

- **WHEN** se calcula un escenario con `batchFraction = 0,40` y `batchDiscount = 0,5`
- **THEN** el coste resultante es el del escenario sin batch multiplicado por `1 − 0,40 × 0,5 = 0,80`

#### Scenario: Batch neutro por defecto

- **WHEN** no se pasa `batchFraction` (o vale 0)
- **THEN** el resultado coincide exactamente con el cálculo sin batch y el caso dorado de P2 permanece intacto

### Requirement: Modificador de recargo regional/Bedrock

El motor DEBE aceptar un factor de recargo regional vía `EngineOptions` (`regionalSurcharge`, default 1 = sin recargo) que multiplica el coste de todas las categorías de todos los modelos **del proveedor que lo ofrece**. Un recargo del 10% se expresa como `1,10`. El recargo regional solo se aplica a proveedores cuyo `modifiers` lo declara (Anthropic y OpenAI); para los que no lo declaran (Google) el motor lo ignora aunque se pase.

#### Scenario: Recargo del 10% sobre todo el coste

- **WHEN** se calcula un escenario de Anthropic u OpenAI con `regionalSurcharge = 1,10`
- **THEN** el blend y todas las métricas de coste son las del escenario base multiplicadas por 1,10

#### Scenario: Recargo neutro por defecto

- **WHEN** no se pasa `regionalSurcharge` (o vale 1)
- **THEN** el resultado coincide exactamente con el cálculo sin recargo y el caso dorado de P2 permanece intacto

#### Scenario: Recargo no ofrecido por el proveedor

- **WHEN** el proveedor activo es Google, que no declara el modificador regional, y se intenta aplicar un recargo
- **THEN** el motor no aplica recargo y la UI no ofrece el toggle correspondiente

#### Scenario: Composición de batch y recargo

- **WHEN** se calcula con `batchFraction = 0,40`, `batchDiscount = 0,5` y `regionalSurcharge = 1,10`
- **THEN** el coste base se multiplica por `(1 − 0,40 × 0,5) × 1,10 = 0,88`

### Requirement: Cálculo con tabla de precios editada

El motor DEBE calcular usando la tabla de precios efectiva que reciba como parámetro, de modo que los overrides de precios editados en la UI se reflejen en el resultado sin modificar `pricing.json`. El motor permanece puro: no conoce el origen (oficial u override) de los precios.

#### Scenario: Precio editado altera el blend

- **WHEN** se pasa al motor una tabla en la que el output de Opus es 30,00 USD/MTok en lugar de 25,00
- **THEN** la tarifa por hora de Opus y el blend se calculan con 30,00, sin que el motor dependa de cómo se obtuvo ese valor

### Requirement: Coste de almacenamiento de caché (storage) por proveedor

El motor DEBE calcular las categorías de tipo `storage` como coste mensual `tokens_retenidos × precio_storage × horas_mes_programadas`, sumándolo al techo y al ponderado mensual **fuera** del blend por hora activa. La categoría `storage` es opcional y por defecto está desactivada (se modela la caché implícita); cuando está activa, usa la tasa de tokens retenidos del perfil del escenario. Con storage desactivado el resultado coincide con el cálculo sin storage.

#### Scenario: Storage desactivado es neutro

- **WHEN** el proveedor activo es Google con la categoría `cache_storage` desactivada
- **THEN** el coste mensual no incluye término de almacenamiento y el blend por hora no se ve afectado

#### Scenario: Storage activo suma coste mensual

- **WHEN** se activa `cache_storage` con tokens retenidos R (M), precio de almacenamiento P (USD/MTok·h) y H horas mensuales programadas
- **THEN** el coste mensual añade `R × P × H` al techo, antes de aplicar duty cycle, y el blend por hora activa permanece sin cambios

### Requirement: Modificadores de precio por proveedor

El motor DEBE aplicar a cada modelo únicamente los modificadores que declara su proveedor en `modifiers` (p. ej. Batch en los tres proveedores; recargo regional en Anthropic y OpenAI, no en Google). La función de modificador de precio depende del proveedor del modelo, de modo que el cálculo siga siendo correcto si en el futuro coexisten varios proveedores.

#### Scenario: Batch disponible en todos los proveedores

- **WHEN** se aplica `batchFraction = 0,40` a un escenario de OpenAI o de Google
- **THEN** el coste se reduce en `0,40 × 0,5 = 20%`, igual que en Anthropic, porque los tres declaran el modificador `batch`

#### Scenario: Modificador solo del proveedor que lo ofrece

- **WHEN** un proveedor no declara el modificador regional en `modifiers`
- **THEN** el motor no aplica ese modificador a sus modelos, con independencia del estado del toggle
