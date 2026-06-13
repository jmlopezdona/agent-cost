## Why

Hoy el escenario vive **únicamente en la query string**: cada toque de slider reescribe la URL con `history.replaceState` (`syncUrl()` tras cada `update()` en `useScenarioStore.ts`), y al cargar se reconstruye desde `window.location.search`. Esto tiene tres fricciones para el usuario:

- La URL se "ensucia" permanentemente durante el uso normal, aunque no quiera compartir nada.
- No hay forma de volver al estado inicial sin editar la URL a mano: falta un botón de **Reset**.
- La única persistencia frente a un refresco es esa URL sucia; si el usuario la limpia, pierde su configuración.

Lo que se quiere: que la configuración **aguante el refresco** sin ensuciar la barra de direcciones, que exista un **Reset** explícito, y que la URL de compartir (botón "Copiar enlace") siga llevando exactamente los valores no-defecto. El serializador compacto que ya existe (`serializeScenario`/`deserializeScenario`) se reaprovecha tal cual; solo cambia **dónde** se leen y escriben sus strings.

## What Changes

- **Fuente de verdad → `sessionStorage`**: el escenario y los modificadores pasan a persistirse en `sessionStorage` (por pestaña, sobrevive al refresco, se descarta al cerrar la pestaña). Esto conserva la independencia entre pestañas que hoy da la URL y cumple el requisito "que aguante el refresh y ya". Se descartó `localStorage` (compartido entre pestañas → conflicto multipestaña) por decisión de producto.
- **La URL deja de auto-sincronizarse en cada cambio**: durante la edición la barra de direcciones permanece **limpia**. `writeUrl`/`replaceState` ya no se llama tras cada `update()`; se usa solo para adoptar/limpiar un enlace entrante.
- **Precedencia al cargar**: si la URL trae parámetros de escenario, **gana** (enlace explícito), se adopta en `sessionStorage` y la URL se **limpia** con `replaceState` a la ruta pelada; si no hay parámetros pero hay `sessionStorage`, se restaura; si no hay ninguno, preset por defecto.
- **"Copiar enlace" construye la URL bajo demanda**: en vez de copiar `window.location.href` (que ya no lleva estado), serializa el estado actual a una URL completa en el momento de pulsar.
- **Botón Reset**: nueva acción que vacía `sessionStorage` y devuelve al preset por defecto con modificadores neutros. Mantiene la moneda (`currency`) y el tipo de cambio (`fx`) como preferencias de presentación.
- **Modo presentación (`present`) persiste en `sessionStorage`** junto al resto del estado de la pestaña (aguanta refresco); sigue siendo honrado desde un enlace entrante (`present=1`) para poder proyectar desde un link.
- El **motor sigue puro y el caso dorado intacto**: este cambio es de persistencia/UI; no toca `src/engine/`.
- Strings nuevos (botón Reset y confirmación) en `src/i18n/es.ts`; cero literales de UI en componentes.

## Capabilities

### New Capabilities

- `session-persistence`: El escenario y los modificadores persisten en `sessionStorage` (por pestaña, sobreviven al refresco), con precedencia de un enlace entrante sobre el estado almacenado y un botón "Reset" que vacía el almacenamiento y vuelve al preset por defecto.

### Modified Capabilities

- `url-sharing`: La URL deja de ser la persistencia del escenario y de auto-actualizarse en cada cambio; pasa a ser un artefacto de compartir generado **bajo demanda** al copiar el enlace. Un enlace entrante se adopta en `sessionStorage` y la URL se limpia. La restauración exacta y el aviso por versión de precios distinta se mantienen para los enlaces entrantes.

## Impact

- **Código**:
  - Estado/persistencia: `src/store/useScenarioStore.ts` — `syncUrl()` → `syncSession()` (escribe el string serializado en `sessionStorage`); carga inicial con precedencia URL→session→default y adopción+limpieza del enlace entrante; nueva acción `reset()`. `src/store/urlSync.ts` — se extrae el helper de lectura/escritura de `sessionStorage` (o módulo nuevo `sessionSync.ts`); `serializeScenario`/`deserializeScenario` se mantienen sin cambios; `writeUrl` se conserva para construir la URL de compartir y para limpiar el enlace entrante.
  - UI: `src/components/layout/Header.tsx` — `copyLink` construye la URL desde el estado (no desde `location.href`); nuevo botón **Reset** con su confirmación.
  - i18n: `src/i18n/es.ts` — strings de Reset.
- **Tests**: `urlSync.test.ts` — el round-trip de serialización se mantiene; se añaden tests de precedencia de carga (URL gana sobre session; session gana sobre default; URL entrante se limpia) y de `reset()`. Playwright humo — editar un valor no ensucia la URL; refrescar conserva el estado; Reset vuelve al defecto; "Copiar enlace" produce una URL con los diffs.
- **Documentación**: actualizar la **regla 7 de `AGENTS.md`** ("URL como única persistencia de escenario") para reflejar que `sessionStorage` persiste el escenario, la URL es artefacto de compartir bajo demanda, y un enlace entrante tiene precedencia y se adopta. La excepción del tema en `localStorage` se mantiene.
- **Sin impacto en**: el motor (`src/engine/`) ni el caso dorado, el formato de serialización compacto (claves cortas, solo diffs), el aviso de versión de precios (`pv`/`staleVersion`), ni el backend (no hay).
- **NFR**: sin regresión de bundle (no se añaden librerías). Privacidad: mejora, ya que el escenario deja de viajar en la URL (historial, logs) durante el uso normal; `sessionStorage` no sale del navegador.
