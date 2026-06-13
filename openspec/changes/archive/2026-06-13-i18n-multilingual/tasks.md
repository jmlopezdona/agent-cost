## 1. Infraestructura de i18n (tipo canónico, registro, store, hooks)

- [x] 1.1 En `src/i18n/es.ts`, exportar el objeto como `es` y derivar el tipo canónico `export type Strings = typeof es` (sin cambiar todavía las claves existentes) — nota: se retiró el `as const` para que los valores sean `string` (no literales) y `en`/`fr` puedan satisfacer `Strings` con texto distinto
- [x] 1.2 Crear `src/i18n/index.ts`: tipo `Locale = 'es' | 'en' | 'fr'`, registro `STRINGS: Record<Locale, Strings>`, lista de locales soportados y helper de validación de locale
- [x] 1.3 Crear el store de idioma `src/store/useLocale.ts` (Zustand): `{ lang, setLang }`, init desde la resolución de idioma; `setLang` escribe `localStorage['agentcost-lang']` y fija `document.documentElement.lang`
- [x] 1.4 Implementar la resolución de idioma inicial (precedencia: `localStorage` válido → `navigator.language` es/fr/en → fallback `en`) reutilizable por el store y por el script pre-paint (`pickLocale`/`resolveInitialLocale` en `src/i18n/index.ts`)
- [x] 1.5 Crear el hook `useStrings()` que devuelve `STRINGS[lang]` y el hook `useFormat()` que devuelve los formatters ligados al locale activo (`src/i18n/hooks.ts`)
- [x] 1.6 Añadir el script inline de resolución pre-paint en `index.html` (fija `<html lang>` antes del primer paint, igual que el tema)

## 2. Tablas de strings (en/fr) y migración de prosa de datos a i18n

- [x] 2.1 Añadir a `es.ts` los sub-objetos `presets` (`{ p1..p6: { name, description, learnings } }`), `salaryRoles` y `salarySource`, copiando la prosa actual de los JSON — nota: `salaryRoles` incluye también `experience` (p. ej. "0–2 años"), que es prosa visible en la tabla y debe localizarse para cumplir "cobertura completa de la UI" (la firma final por rol es `{ name, experience }`, ampliando el `{ name }` original de la tarea)
- [x] 2.2 Retirar `name`/`description`/`learnings` de `src/data/presets.json` (conservando id y valores numéricos/estructurales) y los nombres de rol + experiencia + fuente visible de `salaries.json` (conservando brutos, rangos, multiplicador, horas, fechas)
- [x] 2.3 Ajustar los type guards de `src/data/index.ts`: dejar de exigir la prosa retirada en los JSON; ajustar tipos de `Preset`/`SalaryProfile` en `src/engine/`
- [x] 2.4 Crear `src/i18n/en.ts` (`export const en: Strings = …`) con toda la traducción al inglés del chrome + presets + roles + fuente
- [x] 2.5 Crear `src/i18n/fr.ts` (`export const fr: Strings = …`) con toda la traducción al francés del chrome + presets + roles + fuente
- [x] 2.6 Verificar con `npm run typecheck` que `en` y `fr` satisfacen `Strings` (paridad de claves/firmas)

## 3. Formateo consciente de locale

- [x] 3.1 Refactorizar `src/lib/format.ts` a `makeFormatters(locale: Locale)`: crear los `Intl.NumberFormat` por locale (`es-ES`/`fr-FR`/`en-US`) y devolver las mismas funciones (`formatMoney`, `formatMoneyPerHour`, `formatPercent`, `formatRatio`, `formatHours`, `formatFx`, etc.)
- [x] 3.2 Implementar la colocación del símbolo de moneda por locale (sufijo con espacio en es/fr; prefijo pegado en en) dentro de los formatters
- [x] 3.3 Conectar `useFormat()` para que devuelva los formatters del locale activo (cacheados por locale); mantener la firma de moneda existente (`currency`) en las funciones

## 4. Migración de consumidores a la resolución dinámica

- [x] 4.1 Migrar los componentes que importan `strings` de `es.ts` a `const t = useStrings()` + `t.…` (controls/: TokenRatesSection, ModelMixSection, ScheduleSection, AdvancedConfigSection)
- [x] 4.2 Migrar layout/: Header, Footer, ConfigAccordion, StaleVersionBanner, PresentationToggle, PresentationScenario
- [x] 4.3 Migrar results/: MetricCards, PresetLearnings, ModifierBadges (resolviendo la prosa de preset/learnings desde i18n por id) y salary/: SalaryComparison (roles/fuente desde i18n)
- [x] 4.4 Migrar charts/: ChartTabs, SalaryChart, CeilingVsWeightedChart, CategoryDonut y export/: ExportMenu a los formatters/strings del locale activo (las gráficas con `useMemo` añaden `t` a sus dependencias para re-renderizar al cambiar de idioma)
- [x] 4.5 Refactor de `src/components/charts/chartSetup.ts`: deja de importar `strings` estático; expone `categoryLabels(t)` que recibe la tabla del componente con el hook
- [x] 4.6 Asegurar que la exportación (CSV/JSON/PNG) emite etiquetas en el idioma activo — nota: PNG ya hereda los labels de las gráficas; CSV/JSON localizan el nombre del preset, las cabeceras de columna (`clave/valor`) y las secciones de alto nivel (`preset/parámetros/modificadores/resultados`); los identificadores de campo numéricos anidados se mantienen estables (D9 + `ExportLabels` inyectados desde `ExportMenu`)

## 5. Selector de idioma en la cabecera

- [x] 5.1 Añadir el selector ES/EN/FR en `Header.tsx` (`LanguageSelector`) junto a los toggles de tema y moneda, con endónimos fijos en `aria-label` y accesibilidad (`aria-pressed`)
- [x] 5.2 Cablear el selector a `setLang` del store de idioma

## 6. Tests y verificación

- [x] 6.1 Test de paridad de claves entre `es`/`en`/`fr` (`src/i18n/parity.test.ts`: recorrido de claves+firmas + presencia de prosa para cada id de preset y rol)
- [x] 6.2 Tests de resolución de idioma inicial (`src/i18n/locale.test.ts`: precedencia localStorage → navigator → fallback en y prevalencia de la elección explícita)
- [x] 6.3 Tests de `format.ts` por locale (`src/lib/format.test.ts`: separadores y colocación del símbolo en es/en/fr, importes mensuales y tarifas por hora)
- [x] 6.4 Verificado que el caso dorado del motor (`engine.test.ts`) y los tests de `urlSync`/sesión siguen pasando sin cambios (81 tests verdes; el idioma no toca escenario ni URL)
- [x] 6.5 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run size` y `npm run test:e2e` pasan (e2e: se fijó `locale: 'es-ES'` en `playwright.config.ts` porque el humo asume la UI en español)
