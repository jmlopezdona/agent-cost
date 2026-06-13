## Context

La app es una SPA estática en español. El i18n actual es un único módulo `src/i18n/es.ts` que exporta un objeto `strings` (objeto tipado anidado, con valores string y algunas funciones tipo `customized(presetName) => string`). **21 componentes** —incluido `src/components/charts/chartSetup.ts`— hacen `import { strings } from '../../i18n/es'` de forma estática. El formateo de cifras (`src/lib/format.ts`) fija `Intl.NumberFormat('es-ES', …)` y coloca el símbolo de moneda como sufijo. La prosa humana de los presets (`name`/`description`/`learnings`) vive en `src/data/presets.json` y los nombres de rol y la fuente salarial en `src/data/salaries.json`, validados por type guards en `src/data/index.ts`.

Precedentes de preferencias de presentación en el repo:
- **Tema**: store Zustand (`src/lib/theme.ts`) + `localStorage` (`agentcost-theme`), aplicado antes del primer paint desde `index.html`, clase `dark` en `<html>`. **No** viaja en la URL.
- **Moneda**: parte del escenario (`store`), serializada en la URL (`cur`) y en `sessionStorage`. El formateo consciente de moneda vive solo en `format.ts`.

Restricciones duras relevantes (AGENTS.md): motor puro sin DOM/React (regla 1), sin redondeo interno —formateo solo en `format.ts`— (regla 2), datos en JSON con type guards (regla 4), cero literales de UI en componentes (regla 5), escenario en `sessionStorage`/URL pero el estado de UI/preferencias del visor no necesariamente (regla 7), colores solo por tokens (regla 8), bundle < 250 kB gzip.

El idioma es una **preferencia de presentación del visor**, ortogonal al escenario: igual que el tema, no al escenario.

## Goals / Non-Goals

**Goals:**
- Tres locales seleccionables: `es` (canónico/forma de referencia), `en`, `fr`, con el mismo conjunto exacto de claves y firmas.
- Resolución reactiva del idioma activo en toda la UI sin recarga, vía hook respaldado por un store.
- Idioma inicial autodetectado de `navigator.language` con **fallback EN**; la elección explícita persiste y prevalece.
- Persistencia local en `localStorage`, aplicación antes del primer paint y `<html lang>` correcto.
- Formateo nativo por locale (`es-ES`/`fr-FR`/`en-US`) con colocación idiomática del símbolo de moneda.
- Migrar la prosa traducible de presets y salarios fuera de los JSON a las tablas i18n, indexada por id.
- Garantía de paridad de claves entre los tres locales (a nivel de tipos + test).

**Non-Goals:**
- No tocar el motor (`src/engine/`), el caso dorado, el escenario, su `sessionStorage`/URL ni `urlSync`. El idioma **no** se serializa en la URL del escenario.
- No añadir más de tres idiomas ni infraestructura de carga remota de traducciones; las tres tablas se empaquetan en el bundle.
- No traducir contenido generado por el usuario ni los ids internos de modelos/presets/roles.
- No introducir una librería de i18n externa (i18next, react-intl); el patrón tipado actual basta y respeta el presupuesto de bundle.

## Decisions

### D1 — `es.ts` define el tipo canónico `Strings`; `en`/`fr` deben satisfacerlo

`src/i18n/es.ts` exporta el objeto `es` y de él se deriva el tipo canónico `export type Strings = typeof es`. `en.ts` y `fr.ts` se declaran `export const en: Strings = { … }` (y `fr`), de modo que **el compilador obliga** a que tengan exactamente las mismas claves anidadas y las mismas firmas de función. Falta de clave, clave de más o firma divergente = error de `typecheck`.

- **Por qué**: la deriva entre idiomas es el fallo clásico de i18n; resolverlo en el sistema de tipos lo hace gratis en cada `npm run typecheck`.
- **Alternativa descartada**: mapas planos con claves string y validación en runtime. Pierde el chequeo estático y el autocompletado; además el objeto actual usa funciones (interpolación), no solo strings, que un mapa plano no modela bien.

### D2 — Locale activo en un store Zustand + hook `useStrings()`

Un nuevo store (`src/store/useLocale.ts`, o `src/lib/i18n.ts`) mantiene `{ lang: Locale, setLang }` donde `Locale = 'es' | 'en' | 'fr'`. Un registro `STRINGS: Record<Locale, Strings> = { es, en, fr }` resuelve la tabla. El hook `useStrings()` devuelve `STRINGS[lang]`; los componentes lo llaman al principio del render (`const t = useStrings()`) y sustituyen `strings.x.y` por `t.x.y`.

- **Por qué Zustand y no Context**: ya es el patrón del repo (tema, escenario); evita un provider extra y permite leer el locale también fuera de React (p. ej. en `format`/export). El cambio de `lang` re-renderiza solo a quien usa el hook.
- **Por qué cargar las tres tablas (no lazy)**: cada tabla es pequeña (≈ 8–10 kB sin gzip); las tres caben holgadamente en el presupuesto y permiten cambio de idioma **síncrono e instantáneo** sin estados de carga. Si en el futuro crecieran, se puede lazy-load por locale sin cambiar la API del hook.

### D3 — Migración de las 21 importaciones estáticas

Cada componente cambia `import { strings } from '../../i18n/es'` + usos `strings.…` por `const t = useStrings()` + `t.…`. `chartSetup.ts` no es un componente React: las funciones que hoy leen `strings` reciben el locale o la tabla como argumento desde el punto de llamada (un componente que sí tiene el hook), manteniendo `chartSetup` libre de hooks.

- **Por qué no un alias mágico**: re-exportar `strings` dinámico desde un módulo rompería la reactividad (un import es estático). El hook es la vía idiomática en React.

### D4 — Prosa de datos a i18n, indexada por id; JSON solo numérico

Se añaden a cada tabla i18n sendos sub-objetos indexados por id:
```
presets: { p1: { name, description, learnings }, p2: { … }, … },
salaryRoles: { junior: { name }, mid: { … }, … },
salarySource: '…'   // atribución mostrada al usuario
```
`presets.json` y `salaries.json` pierden `name`/`description`/`learnings` (presets) y los nombres de rol/fuente visible (salarios), conservando id, valores numéricos, mezcla, régimen, brutos, multiplicadores y fechas/fuentes como metadato técnico. Los type guards de `src/data/index.ts` dejan de exigir esos strings; un test nuevo verifica que **para cada id de preset/rol existe su prosa en los tres locales**.

- **Por qué fuera del JSON**: la prosa es UI (regla 5) y debe traducirse; mantenerla en `presets.json` obligaría a anidar `{es,en,fr}` mezclando datos con presentación. Indexar por id mantiene el motor puro (consume solo números) y centraliza todos los strings en i18n.
- **Coste asumido**: traducir 6 descripciones + 6 learnings + 4 roles × 2 idiomas nuevos. Se asume como parte explícita del alcance.

### D5 — Formateo nativo por locale en `format.ts`

`format.ts` deja de tener formatters de módulo fijados a `es-ES`. Se introduce `makeFormatters(locale: Locale)` que crea los `Intl.NumberFormat` del locale (`es-ES`/`fr-FR`/`en-US`) y expone las mismas funciones (`formatMoney`, `formatMoneyPerHour`, `formatPercent`, …). La **colocación del símbolo** se decide por locale: prefijo pegado en `en` (`$6,038`, `$13.8/h`), sufijo con espacio en `es`/`fr` (`6038 $`, `13,8 $/h`). Los componentes obtienen los formatters vía un hook `useFormat()` que liga el locale activo (paralelo a cómo hoy reciben `currency`).

- **Por qué un factory ligado por hook y no un parámetro `locale` en cada llamada**: minimiza el ruido en los call-sites (ya pasan `currency`); el hook resuelve locale una vez por render. El motor sigue sin tocar formateo (regla 2 intacta).
- **Consecuencia conocida**: la convención es-ES de "sin separador de miles en 4 dígitos" (`6038 $`) ya no aplica a `en`/`fr` (que usan sus propias reglas Intl: `6,038` en EN, `6 038` en FR). Es el comportamiento deseado, no una regresión.

### D6 — Resolución del idioma inicial: precedencia y aplicación pre-paint

Orden de precedencia al arrancar:
1. `localStorage['agentcost-lang']` si contiene un locale válido → ese (elección explícita previa).
2. Si no, autodetección: `navigator.language` que empiece por `es`/`fr`/`en` → ese locale.
3. Si no coincide ninguno → **`en` (fallback)**.

Un script inline en `index.html` (como el del tema) resuelve esto antes del primer paint y fija `document.documentElement.lang`, evitando flash de idioma incorrecto. El store se inicializa del mismo valor. `setLang` escribe en `localStorage` y actualiza `<html lang>`.

- **Por qué pre-paint**: igual que el tema, evita FOUC de idioma. La autodetección solo decide cuando **no** hay preferencia guardada; cualquier cambio manual la sobrescribe permanentemente.

### D7 — El idioma no viaja en la URL del escenario

A diferencia de la moneda (`cur` en `urlSync`), el idioma **no** se añade a `PARAMS` ni a `RECOGNIZED_KEYS`. Un enlace compartido abre el escenario en el idioma del **receptor**, no del emisor.

- **Por qué**: el idioma es accesibilidad/preferencia del lector, no parte del escenario. Mezclarlo en la URL contaminaría el round-trip del escenario (que los tests de `urlSync` protegen) sin beneficio claro. Decisión confirmada con el usuario.

### D8 — Selector de idioma en la cabecera

Un control ES/EN/FR en `Header.tsx`, junto a los toggles de tema y moneda, accesible (grupo de botones con `aria-pressed`/`aria-label`, o `<select>` etiquetado). Sus etiquetas son endónimos fijos ("Español"/"English"/"Français"), no traducidos.

### D9 — Exportaciones en el idioma activo

Las etiquetas de las exportaciones (cabeceras del CSV, labels del JSON y textos de la PNG de presentación) DEBEN emitirse en el **idioma activo**, coherentes con lo que el usuario ve en pantalla. Las cifras (valores numéricos del escenario y resultados) no dependen del idioma; solo cambian las etiquetas y su formateo de locale.

- **Por qué idioma activo y no español fijo**: lo que el usuario exporta debe coincidir con lo que ve; un usuario en inglés que comparte un CSV/PNG espera etiquetas en inglés.
- **Alternativa descartada**: claves técnicas neutras estables en el JSON. Aporta reproducibilidad máquina-a-máquina pero introduce una segunda convención de naming solo para el JSON; se prefiere una regla única (idioma activo) para todo el export, dado que el consumidor es humano (business case/presentación), no un pipeline.

### D10 — Endónimos en el selector de idioma

Las opciones del selector (D8) se etiquetan como **endónimos**: "Español" / "English" / "Français", cada idioma en su propia lengua y fijos (no traducidos según el locale activo). Se descartan los códigos ("ES/EN/FR") y las banderas: los endónimos son la convención accesible estándar (un usuario reconoce su idioma aunque la UI esté en otro) y las banderas son un mal proxy de idioma (idioma ≠ país) y peores para lectores de pantalla.

## Risks / Trade-offs

- **Deriva de claves entre locales** → El tipo canónico `Strings` (D1) la convierte en error de compilación; además un test de paridad recorre las claves de `es`/`en`/`fr`.
- **Flash de idioma incorrecto al cargar** → Resolución pre-paint en `index.html` y `<html lang>` fijado antes del render (D6), igual que el tema.
- **Aumento de bundle** (tres tablas + tres `Intl.NumberFormat`) → Strings pequeños; se vigila con `npm run size`. Si rozara el presupuesto, lazy-load por locale sin cambiar la API del hook.
- **Calidad de las traducciones EN/FR** → Riesgo de matices de negocio en la prosa de presets; se asume revisión humana de `en.ts`/`fr.ts`. Las cifras y el motor no dependen del idioma, así que una traducción imperfecta no afecta a los cálculos.
- **Churn de migración en 21 ficheros** → Cambio mecánico y de bajo riesgo (`strings.` → `t.`); cubierto por `lint`/`typecheck` y los tests e2e de humo.
- **Tests existentes que asuman formato es-ES** → Revisar `format`/snapshot tests; el caso dorado del motor es numérico y **no** cambia.

## Migration Plan

1. Introducir el tipo canónico `Strings` y el registro/hook/store de locale sin tocar componentes (coexiste con el import estático).
2. Migrar `format.ts` a `makeFormatters(locale)` + `useFormat()`.
3. Crear `en.ts` y `fr.ts` con la prosa de chrome traducida y añadir `presets`/`salaryRoles`/`salarySource` a los tres locales; retirar la prosa de los JSON y ajustar type guards.
4. Migrar los 21 consumidores a `useStrings()`/`useFormat()` y `chartSetup` a recibir la tabla por argumento.
5. Añadir el selector en `Header.tsx` y la resolución pre-paint en `index.html`.
6. Tests de paridad de claves, autodetección/persistencia y formateo por locale; `lint`/`typecheck`/`test`/`build` y `test:e2e`.

Rollback: el cambio es aditivo en infraestructura; revertir implica volver al import estático de `es` y restaurar la prosa en los JSON.
