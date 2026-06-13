## Context

El MVP dejó la arquitectura preparada para esta fase: el motor (`src/engine/`) es puro y ya define `EngineOptions` con `batchFraction`, `batchDiscount` (default 0,5) y `regionalSurcharge` (default 1), aplicados en `priceModifier(...)` de forma neutra; `src/engine/salary.ts` ya acepta `employerCostMultiplier` y `effectiveHoursPerYear` configurables; el store serializa el escenario en la URL con diffs frente al preset base y `history.replaceState`; el formateo consciente de moneda vive en `src/lib/format.ts`. Falta exponer todo eso en la UI, cablearlo al recálculo (`useResults`) y a la persistencia, completar los presets y añadir las funciones de comunicación (presentación, exportación).

Restricciones duras del repo aplicables: motor puro e **caso dorado intocable** (P2 → blend ≈ 13,8 $/h, techo ≈ 10.060 $/mes, ponderado ≈ 6.040 $/mes); sin redondeo interno; datos en JSON con type guards; cero literales de UI en componentes (todo en `i18n/es.ts`); resultados derivados, no almacenados (`useResults` + `useMemo`); URL como única persistencia del escenario (salvo el tema en localStorage); colores solo vía design tokens; Chart.js con registro selectivo; bundle < 250 kB gzip.

## Goals / Non-Goals

**Goals:**

- Completar los seis presets del PRD §8 con `learnings` y los defaults de modificadores (P5 → Batch 80%).
- Panel de configuración avanzada que edite precios, batch, recargo, divisa y multiplicadores con recálculo reactivo y badges de modificadores activos.
- Modo presentación conmutable por UI y por URL (`present=1`).
- Exportación CSV/JSON del escenario y PNG de cada gráfico.
- Persistencia en URL de los nuevos parámetros con reproducibilidad exacta (CA-09.1) y accesibilidad AA + pulido responsive.

**Non-Goals:**

- No se implementa el "modelo personalizado"/tier self-hosted ni multi-proveedor (Fase 3, PRD §13).
- No se añade i18n EN ni analítica (Fase 3); los strings se siguen centralizando en `es.ts` para no bloquearlo.
- No se cambia la firma del motor ni el caso dorado; los modificadores siguen siendo opts neutros.
- No se persiste nada en backend ni en localStorage salvo el tema ya existente.

## Decisions

### D1 — `learnings` y modificadores por defecto viven en `presets.json`, no en código

`learnings` se añade como campo `string` a `Preset` (en `engine/types.ts`) y al type guard `isPreset` de `data/index.ts`; los seis presets lo rellenan. Los defaults de modificadores de un preset (solo P5 con Batch) se modelan como un bloque opcional `modifiers` en el preset (`{ batchEnabled, batchFraction }`) para que al cargar el preset se inicialicen el toggle y el slider. Alternativa descartada: hardcodear el caso de P5 en el store — viola la regla "datos en JSON, no en código".

### D2 — Los modificadores y la configuración salarial son estado de nivel superior del store, no parte del `Scenario`

El `Scenario` describe el perfil de carga (tokens, mezcla, régimen). Los modificadores de precio (batch on/%, Bedrock on), el `fx`, el multiplicador de coste empresa y las horas efectivas son **configuración de cálculo/presentación**, igual que `fx` y `currency` ya lo son hoy. Se añaden al store como campos de nivel superior con sus acciones (`setBatchEnabled`, `setBatchFraction`, `setRegional`, `setEmployerMultiplier`, `setEffectiveHours`). Como `fx`/`currency`, **no** marcan "Personalizado" salvo que el preset declare un default propio que el usuario cambie (caso del batch de P5).

- El recálculo en `src/lib/useResults.ts` compone `EngineOptions` a partir de estos campos: `{ batchFraction: batchEnabled ? batchFraction : 0, regionalSurcharge: regional ? 1.10 : 1 }`, y pasa la tabla de precios efectiva (con overrides) y la `SalaryConfig` editada.

### D3 — Precios editables como overrides sobre la tabla versionada, con "restaurar oficiales"

`pricing.json` sigue siendo la fuente versionada e inmutable en disco. La edición en UI produce un mapa de **overrides** `Record<ModelId, Partial<ModelPricing>>` en el store; la tabla efectiva se deriva fusionando `pricingTable` + overrides en `useResults` (memoizado). "Restaurar oficiales" vacía los overrides. Esto mantiene `pricing.json` como verdad y deja los edits como capa de sesión/compartible. El badge "precios editados" aparece cuando hay overrides.

### D4 — Persistencia en URL de los nuevos parámetros (rule #7)

Se añaden a `PARAMS`/serialización de `urlSync.ts`, solo cuando difieren del defecto:

- Escalares: `b` (batch %, scale 100, solo si batch activo), `bd` (Bedrock 0/1), `em` (employer multiplier), `eh` (effective hours). `fx` y `cur` ya existen.
- Modo presentación: `present=1` (no es escenario sino vista; se lee de la URL y conmuta el layout, pero no entra en el diff de escenario).
- Overrides de precios: clave compacta `px` con codificación `modelo.campo:valor` separada por comas (p. ej. `px=opus.output:30,haiku.input:1.2`), solo las celdas cambiadas. La deserialización valida modelo/campo/valor numérico y descarta entradas inválidas (consistente con el fallback de parámetros inválidos ya existente).

Cada nuevo parámetro añade su round-trip a `urlSync.test.ts`. Trade-off asumido: `px` puede crecer con muchas ediciones; al serializar solo deltas y un puñado de celdas reales, el coste es acotado y se prefiere a romper CA-09.1 (reproducibilidad exacta de un escenario compartido con precios editados).

### D5 — Batch se aplica solo a la fracción elegible; Bedrock a todas las categorías

Se conserva la semántica ya implementada en `priceModifier`: `(1 − batchFraction × batchDiscount) × surcharge`, aplicada por categoría en `categoryCosts`. Esto equivale a aplicar −50% solo a la fracción `batchFraction` del coste (el resto a precio pleno) y el recargo regional a todo. Con defaults neutros (`batchFraction=0`, `surcharge=1`) el resultado es idéntico al caso dorado; se añaden tests de `engine.test.ts` para batch y recargo sin tocar los scenarios dorados.

### D6 — Modo presentación como flag de vista derivado de la URL, no del escenario

Un campo `presentation: boolean` en el store, inicializado desde `present=1` de la URL y conmutable con un botón en la cabecera. El layout renderiza condicionalmente: oculta la columna de controles y la configuración avanzada, amplía tipografía de métricas y gráficos, y muestra nombre + descripción + `learnings` del escenario. La URL refleja `present=1` con `replaceState` para poder proyectar desde un enlace.

### D7 — Exportación sin dependencias pesadas

- CSV/JSON: se generan en cliente a partir del escenario + `Results` (serialización propia, sin librería) y se descargan vía `Blob` + enlace temporal.
- PNG por gráfico: se usa `canvas.toDataURL('image/png')` del propio canvas de Chart.js (ya en el bundle); no se añade html2canvas ni similares, para respetar el presupuesto de bundle. Cada gráfico expone una función/ref de exportación.
- PNG de montaje ("exportar todo"): además del botón por gráfico, un botón de exportación conjunta compone las tres visualizaciones en un único PNG dibujando cada canvas sobre un canvas offscreen con `drawImage(...)` y luego `toDataURL`. No requiere librería nueva; respeta tema activo y presupuesto de bundle.

### D8 — Señal secundaria en series de gráficos (CA-07.2, accesibilidad AA)

Las series que hoy se distinguen solo por color (donut por categoría, barras techo vs ponderado, barras de comparativa salarial) suman una señal secundaria: patrón de relleno o borde diferenciado por serie, definido junto a `chartTheme()` en `chartSetup.ts` (sin hardcodear colores; los colores siguen viniendo de los design tokens). Se mantiene/ː refuerza la alternativa textual (`sr-only`/`aria-label`) ya presente.

## Risks / Trade-offs

- [El panel avanzado introduce muchos controles y estado nuevo] → Modelar modificadores y salario como campos de nivel superior (no dentro de `Scenario`) evita contaminar el diff de presets y reutiliza el patrón de `fx`/`currency`. Recálculo sigue derivado en `useResults`.
- [Overrides de precios en la URL pueden crecer] → Serializar solo celdas cambiadas con codificación compacta `px`; validar y descartar entradas inválidas; el caso común (sin edición) no añade nada a la URL.
- [Export PNG podría tentar a añadir una librería pesada] → Usar el `toDataURL` nativo del canvas de Chart.js; verificar `npm run size` tras el cambio.
- [Riesgo de tocar el caso dorado al cablear modificadores] → Defaults neutros y tests dedicados de batch/recargo separados de los scenarios dorados, que no se modifican.
- [Accesibilidad de la tabla de precios editable y del modo presentación] → Labels e `aria` en cada celda/numérico, navegación por teclado; modo presentación conmutable por teclado y `aria-pressed`.

## Migration Plan

Cambio aditivo: sin migración de datos. Una URL antigua sin los nuevos parámetros se interpreta con los defaults neutros (sin batch, sin recargo, multiplicador 1,30, 1.720 h, sin overrides, sin modo presentación), reproduciendo el comportamiento actual. Rollback = revertir el commit; las URLs con los nuevos parámetros simplemente los ignorarían.

## Open Questions

Ninguna pendiente. Resueltas con el usuario:

- **Overrides de precios en la URL**: sí se serializan como deltas compactos `px` (cumple CA-09.1 y la regla dura #7).
- **Exportación PNG**: ambas opciones — un botón por gráfico (PNG individual) y un botón "exportar todo" que genera un montaje con las tres visualizaciones.
