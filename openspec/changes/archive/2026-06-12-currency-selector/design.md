## Context

El motor calcula en USD con precisión completa y el formateo vive en `src/lib/format.ts`. Ya existe un tipo de cambio `fx` (EUR por USD, defecto 0,92) en el store, editable desde la comparativa salarial y serializado en la URL. Hoy las cifras de coste del agente se muestran fijas en USD (`formatUSD`, `formatUsdPerHour`) y solo la comparativa salarial trabaja en EUR (`formatEUR`, `formatEurPerHour`, `usdToEur`). El cambio introduce una moneda de presentación global que unifica todas las cifras, por defecto EUR.

Restricciones duras del repo aplicables: motor puro e intocable (caso dorado en USD), sin redondeo interno, datos en JSON, cero literales de UI/moneda en componentes, resultados derivados no almacenados, URL como única persistencia del escenario (salvo tema en localStorage), colores vía tokens.

## Goals / Non-Goals

**Goals:**

- Selector global EUR/USD en la cabecera, defecto EUR, que cambia la unidad de TODAS las cifras monetarias de forma reactiva.
- Conversión solo en presentación con el `fx` existente; motor intacto en USD.
- Formateo consciente de moneda centralizado en `format.ts`, convención es-ES.
- Persistencia de la moneda en la URL (`cur`), serializada solo si difiere del defecto.

**Non-Goals:**

- No se añade una segunda divisa real ni multi-fx (sigue habiendo un único `fx` EUR↔USD).
- No se editan los precios ni los datos de salarios.
- No se persiste la moneda en localStorage (va en la URL como el resto del escenario).
- No se internacionaliza el número (sigue es-ES); la i18n EN es Fase 2/3.

## Decisions

### D1 — La moneda es estado de presentación en el store, serializado en la URL (no en localStorage)

El usuario pidió que el enlace compartido conserve la moneda. `fx` ya vive en el store como campo de nivel superior (no dentro del preset) y se serializa en la URL cuando difiere del defecto; la moneda sigue exactamente el mismo patrón con la clave `cur`. Alternativa descartada: localStorage como el tema — más simple pero no viaja en los enlaces, contradiciendo la decisión de producto.

- Tipo: `type Currency = 'eur' | 'usd'`; defecto `'eur'` (constante `DEFAULT_CURRENCY` en `src/data/index.ts` junto a `DEFAULT_FX_EUR_PER_USD`).
- Store: nuevo campo `currency` + acción `setCurrency`. Se incluye en `serialize(...)` y `deserialize(...)` de `urlSync.ts` con clave `cur` (valores `eur`/`usd`), solo escrita si `currency !== DEFAULT_CURRENCY`. Valor inválido → fallback al defecto.

### D2 — Formateo consciente de moneda con una función `money(...)` parametrizada

En lugar de duplicar formateadores por moneda, `format.ts` expone formateadores que reciben la moneda activa y producen el símbolo correcto manteniendo el resto de la convención es-ES. Se conservan los helpers existentes como adaptadores para no romper llamadas, pero los componentes pasan a usar la variante consciente de moneda.

- `formatMoney(value, currency)` → entero + símbolo (`"10.060 €"` / `"10.060 $"`).
- `formatMoneyPerHour(value, currency)` → 1 decimal + `"/h"`.
- El símbolo se deriva de un mapa `{ eur: '€', usd: '$' }`; cero símbolos hardcodeados en componentes/gráficos.
- Alternativa descartada: `Intl.NumberFormat({ style: 'currency' })` — coloca el símbolo y el formato de moneda según locale (p. ej. "10.060 $" vs el orden deseado) y complica reproducir exactamente la convención actual ("6038 $" sin separador en 4 dígitos). Se mantiene el patrón manual ya usado.

### D3 — Conversión en un único punto de presentación, no en el motor

El motor devuelve siempre USD (costes del agente) y los datos de salarios son EUR nativos. La conversión se aplica al formatear, según la moneda activa y `fx`:

- Coste del agente (USD nativo): EUR → `usd * fx`; USD → sin cambio.
- Nóminas (EUR nativo): USD → `eur / fx`; EUR → sin cambio.
- Se añade el helper inverso `eurToUsd(eur, fx) = eur / fx` en `src/engine/salary.ts` (función pura, junto a `usdToEur`), para que la lógica de conversión siga siendo pura y testeable. Los componentes solo eligen qué conversión aplicar según la moneda.

### D4 — Selector UI en la cabecera junto al tema

Un control segmentado de dos opciones (€ / $) con `aria-pressed`, alineado con el toggle de tema existente. Strings desde `i18n/es.ts`. No requiere nuevo componente genérico; se implementa inline en `Header.tsx` siguiendo el patrón de los botones de preset/tema.

## Risks / Trade-offs

- [El defecto cambia de USD a EUR: el caso de referencia visible deja de coincidir con los valores en USD del PRD] → El caso dorado del **motor** permanece en USD e intocable (`engine.test.ts`); los scenarios de presentación del spec `results-display` se actualizan para cubrir ambas monedas. Documentar en la entrada que la conversión EUR usa `fx` por defecto.
- [Doble fuente de verdad de conversión (agente USD→EUR, nóminas EUR→USD)] → Centralizar ambas direcciones en helpers puros (`usdToEur`/`eurToUsd`) y elegir dirección en un único punto por componente; cubrir con tests.
- [Cifras que hoy llaman `formatUSD`/`formatUsdPerHour` repartidas en varios componentes] → Migración mecánica a `formatMoney(..., currency)`; un grep de `formatUSD|formatUsdPerHour|'\\$'|'€'` en `src/components` debe quedar sin literales de moneda.
- [El `fx` editable vive en la comparativa salarial pero ahora afecta a toda la página] → Aceptable; el tipo de cambio mostrado sigue visible junto a la comparativa. Posible mejora futura (mover el control de `fx` cerca del selector) queda fuera de alcance.

## Migration Plan

Cambio puramente aditivo de presentación, sin migración de datos. Una URL antigua sin `cur` se interpreta como EUR (nuevo defecto). Rollback = revertir el commit; las URLs con `cur` simplemente ignorarían el parámetro.

## Open Questions

Ninguna pendiente: persistencia (URL) y alcance de la comparativa salarial (sigue al selector) fueron confirmados con el usuario.
