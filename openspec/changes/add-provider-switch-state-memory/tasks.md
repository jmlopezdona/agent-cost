## 1. Anclaje al preset análogo (datos)

- [x] 1.1 `analogPresetFor(presetId, providerId)` en `src/data/index.ts`: mapea por número de escenario al preset de la otra familia (P3→O3→G3) con prefijo P/O/G; cae a `defaultPresetFor` si no hay análogo

## 2. Conservación de estado al cambiar de familia (store)

- [x] 2.1 `providerCache: Partial<Record<ProviderId, ProviderMemory>>` en el store (memoria de sesión, no serializada); inicial `{}`
- [x] 2.2 `setProvider` reescrito: memoriza el estado de la familia que se abandona; tasas de token compartidas globales vía `withGlobalTokens`; restaura el estado memorizado al volver y ancla al preset análogo en la primera visita; régimen/mezcla/modificadores por familia
- [x] 2.3 `sameScenarioAsPreset(scenario, preset)` y derivación de `isCustomized` por comparación con el preset base
- [x] 2.4 `reset()` vacía `providerCache` además de volver al preset por defecto

## 3. Cobertura y cierre

- [x] 3.1 Tests en `src/store/sessionPersistence.test.ts`: tasas globales en ambos sentidos, régimen desde el preset análogo en la primera visita, round-trip de mezcla por familia (Gemini→ChatGPT→Gemini) y preset limpio sin marca de personalizado
- [x] 3.2 Puerta: `lint`, `typecheck`, `test`, `test:e2e`, `build` y `size` (< 250 kB gzip) en verde; caso dorado de coste de P2 intacto
