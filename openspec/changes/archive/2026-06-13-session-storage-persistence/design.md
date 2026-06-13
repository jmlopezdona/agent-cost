## Context

El MVP y la Fase 2 dejaron el escenario persistido **exclusivamente en la URL**: `useScenarioStore.ts` llama a `syncUrl()` tras cada `update()`, que serializa el escenario con `serializeScenario(...)` y lo escribe con `history.replaceState` (`writeUrl`). La carga inicial reconstruye el estado con `deserializeScenario(window.location.search, ...)`. El único estado en `localStorage` es el tema (`src/lib/theme.ts`).

Este cambio **invierte el modelo de persistencia** sin tocar el formato de serialización: la fuente de verdad pasa a `sessionStorage` y la URL queda como artefacto de compartir bajo demanda. El serializador compacto (claves cortas, solo diffs frente al preset base, `pv` para la versión de precios) se reaprovecha sin cambios — produce un string que igual de bien va a una query string que a un valor de `sessionStorage`.

Restricciones duras del repo aplicables: motor puro e **caso dorado intocable** (este cambio no toca `src/engine/`); cero literales de UI en componentes (strings en `i18n/es.ts`); resultados derivados, no almacenados (`useResults`); colores solo vía design tokens; bundle < 250 kB gzip (no se añaden librerías). La **regla 7** ("URL como única persistencia de escenario") se reescribe como parte de este cambio.

## Goals / Non-Goals

**Goals:**

- Persistir el escenario y los modificadores en `sessionStorage` para que sobrevivan al refresco, por pestaña.
- Mantener la URL limpia durante la edición; generarla solo bajo demanda al "Copiar enlace".
- Dar precedencia a un enlace entrante, adoptarlo en `sessionStorage` y limpiar la URL.
- Añadir un botón Reset que vacíe el almacenamiento y vuelva al preset por defecto.
- Reaprovechar `serializeScenario`/`deserializeScenario` sin cambios de formato.

**Non-Goals:**

- No se cambia el formato de serialización (claves cortas, diffs, `pv`).
- No se usa `localStorage` para el escenario (decisión: por pestaña con `sessionStorage`; el tema sigue en `localStorage`).
- No se persiste nada en backend.
- No se toca el motor, el caso dorado, ni el aviso de versión de precios.
- No se sincronizan pestañas entre sí (sin escuchar el evento `storage`): cada pestaña es independiente, como hoy con la URL.

## Decisions

### D1 — `sessionStorage` como fuente de verdad, no `localStorage`

Decisión de producto: la configuración debe **aguantar el refresco** pero no necesita sobrevivir al cierre de la pestaña. `sessionStorage` cumple esto y, al ser **por pestaña**, conserva la independencia entre pestañas que hoy proporciona la URL (dos pestañas → dos escenarios). `localStorage` se descartó porque, al compartirse entre todas las pestañas del origin, introduce conflicto multipestaña (la última escritura gana, y un evento `storage` podría pisar la otra pestaña en vivo).

- Clave: `agentcost-scenario` (paralela a `agentcost-theme` del tema).
- Valor: el **mismo string** que hoy va a la query (`serializeScenario(...)`), incluido `p`/`pv`. Reutilizar el formato evita un segundo serializador y garantiza que "lo que se guarda" y "lo que se comparte" sean idénticos.
- No se escucha el evento `storage`: cada pestaña mantiene su estado en memoria y solo sobrescribe su propia clave al cambiar.

### D2 — La escritura pasa de la URL a `sessionStorage`; `serialize`/`deserialize` no cambian

`syncUrl()` se convierte en `syncSession()`: produce el mismo string con `serializeScenario(...)` y lo guarda con `sessionStorage.setItem(KEY, query)` en vez de `writeUrl(query)`. El helper de almacenamiento (lectura/escritura con guardas de entorno, igual que `writeUrl` comprueba `typeof window`) vive en `urlSync.ts` o en un `sessionSync.ts` nuevo:

```
writeSession(query: string): void   // sessionStorage.setItem, no-op fuera del navegador
readSession(): string | null        // sessionStorage.getItem
clearSession(): void                // sessionStorage.removeItem
```

`deserializeScenario(search, ...)` ya acepta cualquier query string: se le pasa el valor de `sessionStorage` igual que hoy se le pasa `location.search`.

### D3 — Precedencia al cargar: URL > sessionStorage > preset por defecto

La carga inicial del store decide la fuente:

```
const urlQuery = window.location.search           // "?p=P2&i=..."
const sessionQuery = readSession()                // string | null

if (urlQuery tiene parámetros de escenario):
    initial = deserializeScenario(urlQuery, ...)
    writeSession(urlQuery sin el "?")             // adoptar el enlace
    writeUrl('')                                  // LIMPIAR la URL (replaceState a ruta pelada)
else if (sessionQuery != null):
    initial = deserializeScenario(sessionQuery, ...)
else:
    initial = deserializeScenario('', ...)        // preset por defecto
```

Regla: **un enlace explícito gana** (el usuario hizo clic para ver *ese* escenario). Tras consumirlo se adopta en `sessionStorage` y la URL se limpia, de modo que la barra de direcciones queda limpia siempre salvo el instante de abrir el enlace. "Parámetros de escenario" = la query contiene al menos una clave reconocida (`p` u otra de `PARAMS`/modificadores), no solo basura; si la query no aporta nada reconocible se trata como vacía y se cae a `sessionStorage`/default. El aviso por `pv` distinto (`staleVersion`) se calcula como hoy desde la query entrante, antes de limpiar.

### D4 — "Copiar enlace" serializa bajo demanda

`copyLink` en `Header.tsx` deja de leer `window.location.href` (que ya no lleva estado) y construye la URL en el momento:

```
const query = serializeScenario(<estado actual del store>, ...)
const url = `${origin}${pathname}${query ? '?' + query : ''}`
navigator.clipboard.writeText(url)
```

Para no duplicar la larga lista de argumentos de `serializeScenario`, se expone un selector/acción del store (p. ej. `buildShareUrl()` o un `serializeCurrent()` que el store ya tiene cableado en `syncSession`) que devuelve la query actual; `Header` solo le antepone `origin + pathname`. El fallback de portapapeles (textarea + `execCommand`) se conserva.

### D5 — Reset vacía `sessionStorage` y vuelve al preset por defecto

Nueva acción `reset()` en el store:

```
reset():
    clearSession()
    set({ ...scenarioFromPreset(DEFAULT_PRESET), presetId: DEFAULT_PRESET_ID,
          isCustomized: false, modificadores neutros (MOD_DEFAULTS), priceOverrides: {},
          presentation: false })
    // currency y fx se mantienen: son preferencia de presentación, no escenario
```

Alcance fijado: Reset devuelve escenario + modificadores a su defecto neutro, pero **conserva `currency` y `fx`** (preferencias de presentación, coherente con que `setCurrency`/`setFx` no marcan "Personalizado"). Tras `reset()` no se vuelve a escribir `sessionStorage` (queda vacío); el siguiente cambio del usuario lo repuebla vía `syncSession()`. El botón vive en la cabecera, junto a "Copiar enlace".

### D6 — `present` (modo presentación) persiste en `sessionStorage`

`present` ya forma parte del string serializado (`present=1`). Como el resto del estado de pestaña, se guarda en `sessionStorage` y aguanta el refresco. Sigue siendo honrado desde un enlace entrante (precedencia D3), de modo que proyectar desde un link `?...&present=1` mantiene su comportamiento actual. No requiere lógica nueva: cae solo al reutilizar el serializador.

### D7 — Multipestaña y otras consecuencias asumidas

- **Multipestaña**: con `sessionStorage` cada pestaña es independiente (como hoy con la URL). No se escucha `storage`. Duplicar una pestaña copia su `sessionStorage` (comportamiento nativo deseable); una pestaña nueva en blanco arranca en el preset por defecto.
- **Bookmarks**: hacer bookmark de la URL ya no guarda un escenario (la URL está limpia). El sustituto es "Copiar enlace" para guardar/compartir un escenario concreto, y `sessionStorage` para "mi sesión actual". Cambio de hábito asumido y alineado con el objetivo de URLs limpias.
- **Privacidad/NFR**: mejora — el escenario deja de viajar en la URL (historial del navegador, logs de referrer) durante el uso normal. `sessionStorage` no sale del navegador, igual que la URL no salía a backend.

## Risks / Trade-offs

- **Pérdida del bookmark de escenario** (D7): mitigado por "Copiar enlace". Aceptado.
- **Cierre de pestaña pierde el estado**: es el comportamiento pedido ("que aguante el refresh y ya"). Quien quiera conservar un escenario usa "Copiar enlace".
- **Detección de "parámetros de escenario" en la URL** (D3): hay que distinguir una query con estado real de una con basura para no limpiar/adoptar de más. Se reutiliza el conjunto de claves conocidas (`p` + `PARAMS` + modificadores + `present`); cualquier clave reconocida activa la rama de adopción.

## Migration / Rollout

- Sin migración de datos: no había persistencia previa salvo la URL. Un usuario con una URL vieja la abre, el escenario se adopta en `sessionStorage` y la URL se limpia — transición transparente.
- Cambio puramente cliente; el despliegue estático a GitHub Pages no requiere pasos especiales.
- Actualizar la regla 7 de `AGENTS.md` en el mismo cambio para que la documentación no contradiga el nuevo modelo.
