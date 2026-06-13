## Why

La pantalla principal apila verticalmente las cuatro secciones de configuración en la columna izquierda y los dos gráficos en la derecha, lo que obliga a un scroll vertical largo y deja la altura de la página sin acotar. Agrupar la configuración en un acordeón exclusivo y los gráficos en pestañas reduce el scroll, hace la altura predecible y ordena la lectura sin perder ningún control ni dato.

## What Changes

- **Acordeón exclusivo de configuración** (columna izquierda): las cuatro secciones pasan a un acordeón donde solo una está abierta a la vez. El orden es: Régimen y utilización, Mezcla de modelos, Tasa de tokens E/S y Configuración avanzada. La primera (Régimen y utilización) abierta por defecto; siempre hay exactamente una abierta (no se pueden colapsar todas).
- **BREAKING (a nivel de comportamiento de UI)**: "Configuración avanzada" deja de ser un `<details>` independiente cerrado por defecto y se integra como una sección más del acordeón, sujeta a la misma regla de exclusividad.
- **Pestañas de gráficos** (columna derecha): los dos gráficos (CategoryDonut "Desglose del coste por categoría de token" y CeilingVsWeightedChart "Techo vs. ponderado mensual") pasan a un sistema de pestañas que muestra solo uno a la vez. El Donut activo por defecto.
- **Comparativa salarial a todo el ancho**: `SalaryComparison` pasa de ocupar las tres columnas derechas a ocupar todo el ancho (cols 1–5) debajo del resto en desktop.
- **Estado de UI no persistido**: la sección abierta del acordeón y la pestaña activa de gráficos son estado de UI puro; no se serializan en la URL ni en el `sessionStorage` del escenario, y no se persisten de inicio.
- **Sin cambios funcionales**: no se toca el motor, el escenario, su persistencia ni el modo presentación (los gráficos ya están fuera de presentación).

## Capabilities

### New Capabilities
- `main-layout`: organización espacial de la pantalla principal — acordeón exclusivo para las secciones de configuración, sistema de pestañas para los gráficos de resultados, comparativa salarial a todo el ancho, y la regla de que el estado de presentación de la UI no se persiste.

### Modified Capabilities
- `advanced-config`: el panel de configuración avanzada deja de ser un panel colapsable independiente cerrado por defecto y se integra en el acordeón exclusivo de configuración.
- `results-display`: los gráficos se muestran de uno en uno mediante pestañas (Donut por defecto); la alternativa textual de cada gráfico debe seguir disponible para el gráfico no visible y el gráfico debe redimensionarse correctamente al activarse su pestaña.

## Impact

- **Componentes**: `src/App.tsx` (reordenación del grid), `src/components/controls/*Section.tsx` y `AdvancedConfigSection.tsx` (envoltura en acordeón), `src/components/charts/CategoryDonut.tsx` y `CeilingVsWeightedChart.tsx` (montaje en pestañas), `src/components/layout/Section.tsx` (o un nuevo componente acordeón), `src/components/salary/SalaryComparison.tsx` (posición full-width).
- **Nuevos componentes de layout** para el acordeón y las pestañas (patrón accesible tablist/tabpanel y accordion con `aria-expanded`).
- **i18n**: posibles etiquetas nuevas para las pestañas de gráficos en `src/i18n/es.ts`.
- **Chart.js**: gestionar el canvas oculto (resize al activar la pestaña o montar/desmontar) para evitar el renderizado a tamaño 0.
- **Sin impacto** en `src/engine/`, `src/store/` (escenario, urlSync, sessionStorage del escenario) ni en el modo presentación.
