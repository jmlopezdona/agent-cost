## 1. Estado y tipo de moneda

- [x] 1.1 Añadir `type Currency = 'eur' | 'usd'` y `DEFAULT_CURRENCY = 'eur'` en `src/data/index.ts` (junto a `DEFAULT_FX_EUR_PER_USD`), exportados con type guard si procede
- [x] 1.2 Añadir campo `currency: Currency` y acción `setCurrency(c: Currency)` al store `useScenarioStore.ts`, inicializado desde el estado deserializado de la URL con fallback a `DEFAULT_CURRENCY`

## 2. Persistencia en URL

- [x] 2.1 Incluir `currency` en `serialize(...)` de `urlSync.ts` con clave `cur` (`eur`/`usd`), escrita solo si difiere de `DEFAULT_CURRENCY`
- [x] 2.2 Leer `cur` en `deserialize(...)` con validación a `'eur' | 'usd'` y fallback al defecto ante valor inválido o ausente
- [x] 2.3 Añadir round-trip de `cur` a `urlSync.test.ts`: defecto EUR no aparece en la URL; USD se serializa y se restaura; valor inválido cae al defecto

## 3. Conversión y formateo conscientes de moneda

- [x] 3.1 Añadir `eurToUsd(eur, fx) = eur / fx` (función pura) en `src/engine/salary.ts` junto a `usdToEur`, con test en `salary.test.ts`
- [x] 3.2 Añadir a `src/lib/format.ts` el mapa de símbolos `{ eur: '€', usd: '$' }`, `formatMoney(value, currency)` (entero + símbolo) y `formatMoneyPerHour(value, currency)` (1 decimal + `/h`), respetando la convención es-ES; mantener helpers antiguos como adaptadores si siguen usados
- [x] 3.3 Añadir/actualizar tests de formato cubriendo ambas monedas (incluido el caso de 4 dígitos sin separador y el de miles con separador)

## 4. Selector en la cabecera

- [x] 4.1 Añadir strings del selector de moneda a `src/i18n/es.ts` (label del grupo, opciones EUR/USD, aria-labels)
- [x] 4.2 Implementar el control segmentado €/$ en `Header.tsx` (patrón de botones existente, `aria-pressed`), enlazado a `currency`/`setCurrency`

## 5. Migración de cifras a moneda activa

- [x] 5.1 `MetricCards.tsx`: usar `formatMoney`/`formatMoneyPerHour` con `currency`, convirtiendo USD→EUR con `fx` cuando la moneda sea EUR
- [x] 5.2 `charts/CeilingVsWeightedChart.tsx`: ticks, tooltips y `aria-label` en la moneda activa (conversión + símbolo)
- [x] 5.3 `charts/CategoryDonut.tsx`: leyenda, tooltips y tabla `sr-only` de tasas por hora en la moneda activa
- [x] 5.4 `controls/ModelMixSection.tsx` y `controls/TokenRatesSection.tsx`: tasas `$/h` → moneda activa
- [x] 5.5 `salary/SalaryComparison.tsx`: presentar coste del agente, costes empresa, €/h y barras en la moneda activa; cuando sea USD convertir las nóminas EUR→USD con `fx`; mantener visible el tipo de cambio editable
- [x] 5.6 Grep de control: `formatUSD|formatEUR|formatUsdPerHour|formatEurPerHour|'\\$'|'€'` en `src/components` no debe dejar símbolos de moneda hardcodeados ni formateadores de moneda fija

## 6. Verificación

- [x] 6.1 `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde; caso dorado de `engine.test.ts` sin tocar y pasando
- [x] 6.2 `npm run test:e2e` en verde; añadir/ajustar humo que verifique que el cambio de moneda propaga el símbolo a las métricas
- [x] 6.3 `npm run size` dentro del presupuesto (< 250 kB gzip)
- [x] 6.4 Comprobación manual a 360 px: el selector es operable y no introduce overflow
