## Context

La pantalla principal (`src/App.tsx`) usa en desktop un grid de 5 columnas:

```
cols:  1   2  │  3   4   5
row1  CFG-col │  metrics (PresetLearnings, ModifierBadges, MetricCards)
row2  CFG-col │  charts (CategoryDonut + CeilingVsWeightedChart apilados)
row3  CFG-col │  SalaryComparison
```

La columna de configuración (`lg:col-span-2 lg:row-span-3`) apila cuatro secciones: `TokenRatesSection`, `ModelMixSection`, `ScheduleSection` (todas `Section` siempre abierta) y `AdvancedConfigSection` (que ya es un `<details>` colapsable, cerrado por defecto). Esa mezcla de patrones —tres fijas y una colapsable— es la incoherencia que arrastramos.

`Section` (`src/components/layout/Section.tsx`) es un wrapper trivial: `<section>` con `<h2>` título, hint opcional y `children`. Los strings de título/hint salen de `src/i18n/es.ts`.

Restricciones del repo relevantes (AGENTS.md): cero literales de UI en componentes (regla 5), el estado del escenario va a `sessionStorage`/URL pero **el estado de UI no** (regla 7), gráficos canvas necesitan alternativa textual accesible (regla 9), responsive desde 360px, Lighthouse A11y ≥ 90.

## Goals / Non-Goals

**Goals:**
- Acordeón exclusivo para las 4 secciones de configuración en el orden Régimen y utilización → Mezcla de modelos → Tasa de tokens E/S → Configuración avanzada: una abierta a la vez, primera (Régimen y utilización) por defecto, siempre una abierta.
- Integrar "Configuración avanzada" como una sección más del acordeón (un solo patrón).
- Pestañas para los dos gráficos: uno visible a la vez, Donut por defecto.
- `SalaryComparison` a todo el ancho (cols 1–5) debajo del resto en desktop.
- Accesibilidad correcta (accordion `aria-expanded`, tablist/tabpanel) y alternativa textual de gráficos preservada.

**Non-Goals:**
- No tocar el motor (`src/engine/`), el escenario, su `sessionStorage`/URL ni `urlSync`.
- No persistir el estado de UI (sección abierta, pestaña activa) en ningún sitio de inicio.
- No modificar el modo presentación (los gráficos ya no aparecen allí).
- No cambiar el contenido de ningún control, gráfico ni de la comparativa salarial: solo su contenedor/posición.

## Decisions

### D1 — Acordeón exclusivo con estado en `App` (o componente contenedor), no en cada sección

Un componente `ConfigAccordion` mantiene `useState` con el id de la sección abierta (`'schedule' | 'mix' | 'tokens' | 'advanced'`, inicial `'schedule'`). El acordeón renderiza las secciones en ese orden (Régimen y utilización, Mezcla de modelos, Tasa de tokens E/S, Configuración avanzada) como cabeceras-botón; al hacer click en una cerrada, se convierte en la abierta; click en la ya abierta **no la cierra** (invariante "siempre una abierta"). Cada item envuelve el contenido actual de cada `*Section`.

- **Por qué estado centralizado**: la exclusividad necesita un único punto de verdad. Si cada sección guardara su propio abierto/cerrado, forzar "solo una" requeriría coordinación entre hermanos.
- **Alternativa descartada**: `<details name="config">` nativo de HTML (grupo exclusivo por atributo `name`). Lo permite cerrar todas (rompe "siempre una abierta") y el soporte/comportamiento del atributo `name` es desigual; además no controlamos el resize de los charts desde ahí. Preferimos control explícito en React.
- Las `*Section` actuales se refactorizan para exponer su **contenido** sin el wrapper `<section>`/título, o se mantiene `Section` y el acordeón controla la apertura. Decisión concreta en tasks: extraer el cuerpo de cada sección y que `ConfigAccordion` aporte la cabecera clicable. Los strings de título/hint siguen viniendo de i18n.

### D2 — Patrón de accesibilidad del acordeón

Cabecera = `<button aria-expanded={isOpen} aria-controls={panelId}>`; panel = `<div id={panelId} role="region" aria-labelledby={headerId} hidden={!isOpen}>`. Usar `hidden` (no solo CSS) para que el contenido cerrado salga del orden de tabulación y del árbol de accesibilidad. Esto satisface Lighthouse A11y y deja los inputs ocultos fuera del tab.

### D3 — Pestañas de gráficos con patrón tablist/tabpanel

Un componente `ChartTabs` con `useState` de pestaña activa (`'donut' | 'ceiling'`, inicial `'donut'`). `role="tablist"` con dos `role="tab"` (`aria-selected`, `aria-controls`), y dos `role="tabpanel"` (`aria-labelledby`), el inactivo con `hidden`. Etiquetas de pestaña desde i18n (nuevas claves).

### D4 — Chart.js y el canvas oculto (montar/desmontar > resize)

Un canvas en un panel `hidden`/`display:none` renderiza a tamaño 0 y no siempre se redimensiona al mostrarse. **Decisión: montar solo el gráfico de la pestaña activa** (renderizado condicional: el panel inactivo no monta su componente de chart). Así Chart.js siempre se inicializa con dimensiones reales y se destruye al cambiar de pestaña.

- **Por qué desmontar en vez de `chart.resize()`**: evita el gotcha por completo, no exige refs ni efectos al togglear, y el coste de re-montar un chart pequeño es despreciable (recálculo reactivo < 16 ms ya garantizado).
- **Trade-off**: la alternativa textual (tabla `sr-only`) del gráfico no visible también desaparece del DOM. Para no perder la regla 9, la **alternativa textual de ambos gráficos se renderiza siempre** (fuera del canvas condicional), de modo que un usuario de lector de pantalla accede a los datos de los dos gráficos independientemente de la pestaña visual activa. El canvas es lo único condicionado por la pestaña.

### D5 — Reordenación del grid y salary full-width

Nuevo layout desktop:

```
cols:  1   2  │  3   4   5
row1  metrics (cols 1–5, full width: PresetLearnings, ModifierBadges, MetricCards)
row2  CFG-acc │  ChartTabs (un gráfico)
row3  SalaryComparison (cols 1–5, full width)
```

Las métricas (KPI strip) ocupan toda la anchura en la fila superior; debajo, la fila central enfrenta **solo** configuración (cols 1–2) y gráficos (cols 3–5), dos bloques de altura muy similar. `SalaryComparison` pasa a `lg:col-span-5 lg:col-start-1 lg:row-start-3`.

- **Por qué metrics full-width arriba (revisado tras feedback)**: la versión inicial dejaba metrics en cols 3–5 con la configuración abarcando `row-span-2` a su izquierda. Como `metrics + charts` (derecha) es más alto que el acordeón (izquierda), la fila full-width de salary arrancaba por debajo de ambas columnas y quedaba un hueco muerto bajo la configuración. Subir las métricas a una franja superior a todo el ancho deja la fila central con dos bloques de altura pareja (acordeón con una sección abierta ≈ tarjeta de gráfico), eliminando el hueco. Los KPIs siguen visibles y actualizándose en vivo.

En móvil todo sigue apilado en una columna (orden: metrics, config, charts, salary) y el acordeón/pestañas son el patrón nativo idóneo a 360px.

### D6 — Estado de UI no persistido

`useState` local en `ConfigAccordion` y `ChartTabs`. No entra en el store de Zustand, ni en `PARAMS`/`RECOGNIZED_KEYS` de `urlSync.ts`, ni en el `sessionStorage` del escenario. Un refresco reabre la primera sección (Régimen y utilización) y la pestaña Donut. Esto respeta la regla 7 (la URL/sessionStorage solo describen el escenario, no la presentación de la UI).

## Risks / Trade-offs

- **[Hueco en desktop si la sección abierta es corta]** Resuelto subiendo las métricas a una franja full-width superior (ver D5): la fila central enfrenta solo configuración y gráficos, de altura pareja, así que no queda hueco muerto bajo la columna izquierda. Un desbalance residual mínimo según qué sección esté abierta es absorbido por la salary full-width inferior.
- **[Pérdida de comparación visual entre los dos gráficos]** Antes se veían los dos apilados; ahora uno a la vez → es la decisión explícita del usuario (no se necesita ver ambos a la vez); la alternativa textual de ambos permanece siempre disponible.
- **[Re-montaje de Chart.js al cambiar pestaña]** Pequeño coste de init → despreciable para charts de este tamaño; elimina por completo el bug de canvas a tamaño 0.
- **[Refactor de las *Section podría tocar tests e2e]** Los tests de humo Playwright pueden depender de que los controles estén visibles sin interacción → si una sección queda cerrada por defecto, el test debe abrir su acordeón antes de interactuar. Revisar `test:e2e`.
- **[Estado de UI no persistido sorprende al refrescar]** El usuario pierde la pestaña/sección activa al recargar → coherente con que es presentación, no escenario; coste bajo y mantiene la regla 7 limpia.

## Migration Plan

Cambio puramente de presentación, sin migración de datos. Pasos: (1) crear componentes de acordeón y pestañas accesibles, (2) envolver secciones y gráficos, (3) reordenar el grid de `App.tsx`, (4) añadir etiquetas de pestaña a i18n, (5) ajustar tests e2e para abrir el acordeón cuando proceda. Rollback = revertir el commit; no hay estado persistido nuevo que limpiar.

## Open Questions

- ¿Las cabeceras del acordeón muestran también el `hint` de cada sección cuando está cerrada, o solo el título? (Propuesta: solo título cerrado; hint visible al abrir, como hoy dentro de `Section`.)
