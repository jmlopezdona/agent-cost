## 1. Helper de sessionStorage

- [x] 1.1 Añadir a `src/store/urlSync.ts` (o nuevo `src/store/sessionSync.ts`) los helpers `writeSession(query)`, `readSession()` y `clearSession()`, con guarda de entorno (`typeof window`/`sessionStorage`) igual que `writeUrl`. Clave `agentcost-scenario`
- [x] 1.2 Conservar `serializeScenario`/`deserializeScenario` sin cambios de formato; conservar `writeUrl` (ahora usado para construir/limpiar la URL de compartir, no para persistir)

## 2. Persistencia y precedencia en el store

- [x] 2.1 Sustituir `syncUrl()` por `syncSession()` en `useScenarioStore.ts`: produce el string con `serializeScenario(...)` y lo guarda con `writeSession(query)` en vez de `writeUrl(query)`. `update()` llama a `syncSession()`
- [x] 2.2 Carga inicial con precedencia URL → sessionStorage → preset por defecto (D3): si la query de `location.search` contiene alguna clave reconocida, `deserializeScenario(location.search)` gana, se adopta con `writeSession(...)` y se limpia la URL con `writeUrl('')`; si no, `deserializeScenario(readSession() ?? '')`
- [x] 2.3 Calcular `staleVersion` desde la query entrante **antes** de limpiar la URL, conservando el aviso de versión de precios
- [x] 2.4 Exponer un selector/acción para obtener la query serializada actual (p. ej. `serializeCurrent()`), reutilizado por `syncSession` y por "Copiar enlace"

## 3. Botón Reset

- [x] 3.1 Acción `reset()` en el store: `clearSession()` + volver a `scenarioFromPreset(DEFAULT_PRESET)`, `presetId` por defecto, `isCustomized=false`, modificadores neutros (`MOD_DEFAULTS`), `priceOverrides={}`, `presentation=false`. Conserva `currency` y `fx`
- [x] 3.2 Botón "Reset" en `Header.tsx` junto a "Copiar enlace", con string en `es.ts` y `aria-label`

## 4. "Copiar enlace" bajo demanda

- [x] 4.1 `copyLink` en `Header.tsx` construye la URL desde el estado actual (`origin + pathname + '?' + serializeCurrent()`) en vez de leer `window.location.href`; conservar el fallback de portapapeles (textarea + `execCommand`)
- [x] 4.2 Verificar que con escenario = preset por defecto sin modificar la URL copiada queda sin query (solo `p`/`pv` mínimos, coherente con el diff)

## 5. i18n

- [x] 5.1 Strings de Reset (`header.reset` y, si aplica, confirmación) en `src/i18n/es.ts`; cero literales en componentes

## 6. Documentación

- [x] 6.1 Reescribir la regla 7 de `AGENTS.md`: `sessionStorage` persiste el escenario (por pestaña, sobrevive al refresco); la URL es artefacto de compartir bajo demanda; un enlace entrante tiene precedencia y se adopta; el tema sigue en `localStorage`

## 7. Tests

- [x] 7.1 `urlSync.test.ts`: el round-trip de `serializeScenario`/`deserializeScenario` se mantiene intacto
- [x] 7.2 Tests de precedencia: URL con estado gana sobre `sessionStorage`; `sessionStorage` gana sobre default; sin ninguno → preset por defecto
- [x] 7.3 Test de adopción + limpieza: abrir con query la guarda en `sessionStorage` y deja `location.search` vacío
- [x] 7.4 Test de `reset()`: vacía `sessionStorage` y vuelve al preset por defecto conservando `currency`/`fx`
- [x] 7.5 Test de `staleVersion`: una query entrante con `pv` distinto conserva el aviso aunque la URL se limpie

## 8. E2E (Playwright humo)

- [x] 8.1 Editar un valor NO añade query a la URL (permanece limpia)
- [x] 8.2 Refrescar la página conserva el escenario editado (sessionStorage)
- [x] 8.3 "Reset" devuelve al preset por defecto
- [x] 8.4 "Copiar enlace" produce una URL con los diffs del escenario; abrirla en contexto limpio restaura el escenario y deja la URL limpia

## 9. Verificación

- [x] 9.1 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde; caso dorado de `engine.test.ts` intacto
- [x] 9.2 `npm run test:e2e` en verde
- [x] 9.3 `npm run size` dentro del presupuesto (< 250 kB gzip; no se añaden librerías)
