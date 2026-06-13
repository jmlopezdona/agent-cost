## Why

Hoy toda la UI está cableada a español: los 21 componentes importan estáticamente `strings` desde `src/i18n/es.ts`, el formateo de cifras fija `es-ES` en `src/lib/format.ts` y la prosa de los presets y los salarios vive en español dentro de `src/data/*.json`. El PRD §13 marca el i18n EN como primer entregable de Fase 3, y el producto se usa en preventa y business case agente-vs-FTE ante clientes y dirección que no siempre son hispanohablantes. Esta change introduce soporte multi-idioma —**inglés, español y francés**— manteniendo el español como locale canónico (la forma tipada de referencia) pero mostrando por defecto el idioma autodetectado del navegador.

## What Changes

- **Tres locales seleccionables**: español (`es`, locale canónico/forma de referencia), inglés (`en`) y francés (`fr`). Se crean `src/i18n/en.ts` y `src/i18n/fr.ts` con exactamente la misma forma tipada que `src/i18n/es.ts`; `es.ts` define el tipo canónico y los otros dos deben satisfacerlo (mismas claves, mismas firmas de funciones).
- **Selector de idioma en la cabecera** (ES/EN/FR), junto a los toggles de tema y moneda.
- **Resolución dinámica de strings**: los componentes dejan de importar `strings` estático de `es.ts` y pasan a leer los strings del locale activo vía un hook (`useStrings()`) respaldado por un store de idioma. El cambio de idioma se refleja de forma reactiva en toda la página sin recargar.
- **Idioma inicial autodetectado con fallback EN**: en la primera visita (sin preferencia guardada) se lee `navigator.language`; si empieza por `es` → español, por `fr` → francés, por `en` → inglés, y **cualquier otro idioma cae a inglés**. La elección explícita del usuario se persiste y prevalece sobre la autodetección en visitas posteriores.
- **Persistencia local, como el tema**: el idioma se guarda en `localStorage` (clave propia, p. ej. `agentcost-lang`), se aplica antes del primer paint y se refleja en el atributo `<html lang>`. **No** viaja en la URL del escenario ni en su `sessionStorage`; es preferencia del visor (a diferencia de la moneda, que sí va en la URL).
- **Formateo nativo por locale**: `src/lib/format.ts` deja de fijar `es-ES` y pasa a formatear con el locale activo (`es-ES` / `fr-FR` / `en-US`), incluida la **colocación idiomática del símbolo de moneda** (EN: prefijo `$6,038`; ES/FR: sufijo `6038 $`). El motor sigue intacto y sin redondeo; el formateo sigue siendo la única capa que conoce locale y moneda.
- **Prosa de datos movida a i18n** (decisión de alcance): los textos humanos de los presets (`name`, `description`, `learnings`) y de los salarios (nombres de rol, `source`) dejan de vivir en `src/data/presets.json` / `salaries.json` y pasan a las tres tablas de i18n, **indexados por id** de preset / rol. Los JSON de datos quedan **solo numéricos/estructurales** (valores, mezcla, régimen, brutos, fechas, fuentes-como-metadato si aplica). Esto respeta la regla 5 (cero literales de UI fuera de i18n) y mantiene el motor puro.
- **Sin cambios de motor ni de escenario**: el cálculo, el caso dorado, la persistencia del escenario (`sessionStorage`/URL) y `urlSync` no cambian. El idioma es ortogonal al escenario.

## Capabilities

### New Capabilities
- `internationalization`: selección y resolución de idioma de la aplicación (es/en/fr) — tablas de strings con forma canónica única, hook de resolución del locale activo, selector en cabecera, autodetección con fallback EN, persistencia local en `localStorage`, atributo `<html lang>`, y la regla de que el idioma es preferencia local del visor (no viaja en la URL del escenario).

### Modified Capabilities
- `currency-display`: el formateo deja de fijar la convención `es-ES` y pasa a ser **consciente del locale activo** (`es-ES`/`fr-FR`/`en-US`), con colocación idiomática del símbolo de moneda según idioma. El motor y la conversión `fx` no cambian.
- `scenario-presets`: el `name`, la `description` y los `learnings` de cada preset dejan de vivir como literales en `presets.json` y pasan a las tablas de i18n indexados por id de preset; `presets.json` conserva solo los valores numéricos/estructurales y el id. La UI muestra la prosa del preset en el idioma activo.
- `salary-comparison`: los nombres de rol (Junior/Mid/Senior/Tech Lead) y la atribución de fuente mostrada al usuario se resuelven desde i18n por idioma; `salaries.json` conserva los brutos, multiplicadores, fechas y demás datos numéricos.

## Impact

- **Nuevos ficheros**: `src/i18n/en.ts`, `src/i18n/fr.ts`, un `src/i18n/index.ts` (tipo canónico `Strings`, registro de locales y resolución), y el store/hook de idioma (`src/lib/i18n.ts` o `src/store/useLocale.ts`).
- **`src/i18n/es.ts`**: pasa a exportar el tipo canónico `Strings` (la forma actual) además de la tabla; se le añaden las claves de prosa de presets y roles salariales migradas desde los JSON.
- **21 componentes**: sustituyen `import { strings } from '../../i18n/es'` por la resolución del locale activo (`useStrings()` o equivalente). Incluye `chartSetup.ts`, que hoy también importa `strings`.
- **`src/lib/format.ts`**: parametriza el locale de `Intl.NumberFormat` y la colocación del símbolo; deja de hardcodear `es-ES`.
- **`src/data/presets.json` y `salaries.json`** + sus type guards en `src/data/index.ts`: se elimina la prosa traducible; los type guards dejan de exigir `name`/`description`/`learnings` como strings en el JSON y validan su presencia en i18n.
- **Cabecera** (`src/components/layout/Header.tsx`): nuevo selector de idioma; `index.html` aplica el idioma persistido antes del primer paint (igual que el tema).
- **Exportación** (`export-scenario`): las etiquetas de CSV/JSON/PNG pasan a emitirse en el idioma activo (implementación, sin cambio de requirement).
- **Tests**: `format.test.ts` (formateo por locale), nuevos tests de paridad de claves entre `es`/`en`/`fr`, autodetección y persistencia del idioma. El caso dorado del motor **no** cambia.
- **Sin impacto** en `src/engine/`, en la persistencia del escenario (`sessionStorage`/URL/`urlSync`) ni en el modo presentación más allá de mostrarse en el idioma activo.
