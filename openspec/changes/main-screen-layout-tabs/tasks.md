## 1. Acordeón exclusivo de configuración

- [ ] 1.1 Crear `src/components/layout/Accordion.tsx` (o `ConfigAccordion`): contenedor con estado local de la sección abierta (`'schedule' | 'mix' | 'tokens' | 'advanced'`, inicial `'schedule'`), renderizado en el orden Régimen y utilización → Mezcla de modelos → Tasa de tokens E/S → Configuración avanzada, invariante "siempre una abierta" (click en la abierta no la cierra). Cabecera = `<button aria-expanded aria-controls>`; panel = `<div id role="region" aria-labelledby hidden={!open}>`. Títulos/hints desde i18n, sin literales.
- [ ] 1.2 Refactorizar `TokenRatesSection`, `ModelMixSection`, `ScheduleSection` para exponer su contenido sin el wrapper de título (o que el acordeón aporte la cabecera), conservando sus strings de i18n.
- [ ] 1.3 Integrar `AdvancedConfigSection` como una sección más del acordeón: eliminar su `<details>`/`<summary>` propio y reutilizar su cuerpo; cerrada por defecto, sujeta a la exclusividad.
- [ ] 1.4 Montar el acordeón en la columna de configuración de `src/App.tsx` en sustitución de las cuatro secciones apiladas.

## 2. Pestañas de gráficos

- [ ] 2.1 Crear `src/components/charts/ChartTabs.tsx`: estado local de pestaña activa (`'donut' | 'ceiling'`, inicial `'donut'`), patrón `role="tablist"`/`tab`/`tabpanel` con `aria-selected` y panel inactivo `hidden`. Etiquetas de pestaña desde i18n (claves nuevas).
- [ ] 2.2 Montar condicionalmente solo el canvas del gráfico activo (renderizado condicional de `CategoryDonut`/`CeilingVsWeightedChart`) para evitar el canvas a tamaño 0; verificar render correcto al cambiar de pestaña.
- [ ] 2.3 Renderizar la alternativa textual (`sr-only`/`aria-label`) de ambos gráficos siempre, fuera del canvas condicionado, para no perder accesibilidad del gráfico no visible (regla 9).
- [ ] 2.4 Añadir las etiquetas de pestaña a `src/i18n/es.ts` con la forma tipada existente.

## 3. Reordenación del grid y salary full-width

- [ ] 3.1 En `src/App.tsx`, ajustar la columna de configuración de `lg:row-span-3` a `lg:row-span-2` y colocar `ChartTabs` en la fila de gráficos.
- [ ] 3.2 Mover `SalaryComparison` a una fila propia a todo el ancho (`lg:col-span-5 lg:col-start-1 lg:row-start-3`); verificar el apilado correcto en móvil (orden config, metrics, charts, salary) sin scroll horizontal a 360 px.

## 4. Verificación

- [ ] 4.1 Confirmar que el estado de UI (sección abierta, pestaña activa) NO entra en el store, `urlSync.ts` (`PARAMS`/`RECOGNIZED_KEYS`) ni en el `sessionStorage` del escenario; un refresco reabre Tokens + Donut y conserva el escenario.
- [ ] 4.2 Ajustar los tests e2e de humo (Playwright) para abrir la sección del acordeón correspondiente antes de interactuar con controles que ya no estén visibles por defecto.
- [ ] 4.3 Pasar `lint`, `typecheck`, `test`, `build` y, por tocar UI, `test:e2e`; comprobar presupuesto de bundle con `npm run size`.
- [ ] 4.4 Revisión manual de accesibilidad: foco/`aria-expanded` del acordeón, navegación tablist/tabpanel de las pestañas, y que el contenido cerrado/oculto queda fuera del orden de tabulación.
