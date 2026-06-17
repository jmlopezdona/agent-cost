## Why

Tras multi-proveedor, cambiar de familia (`setProvider`) **cargaba el preset por defecto** de la nueva familia (decisión D7 de `add-multi-provider-models`). En la práctica eso "reseteaba" el escenario: al ir de Gemini a ChatGPT y volver a Gemini se perdía el mix editado, y un perfil de tokens cuidadosamente ajustado desaparecía al cambiar de familia. Para un business case que compara familias eso es justo lo contrario de lo que el usuario espera: quiere comparar **el mismo trabajo** ejecutado por familias distintas y volver a una familia sin perder lo que tenía.

Este cambio **documenta la implementación actual** de la conservación de estado al cambiar de proveedor, ya en el código. No introduce comportamiento nuevo: refleja en las specs lo que el motor de UI ya hace, corrigiendo la semántica de D7.

## What Changes

- **Tasas de tokens compartidas = globales entre familias.** Las categorías de token con clave compartida por las tres familias (input fresco, output, cache read) describen la **carga del agente** y se aplican a las tres: editarlas en una familia se refleja en las demás. Las categorías propias de una familia (cache write de Anthropic, almacenamiento de Gemini) son por familia.
- **Régimen, mezcla y modificadores = por familia.** Cada familia recuerda su régimen (horas/día, días/semana, duty cycle, agentes), su mezcla de modelos y sus modificadores (Batch, recargo regional, almacenamiento). La mezcla es intrínsecamente por familia porque los modelos difieren.
- **Anclaje al caso de uso análogo.** La primera vez que se entra en una familia, el escenario se ancla a su **preset análogo** (mismo caso de uso por número: P3↔O3↔G3), no al preset por defecto de la familia. Así se conserva la intención del escenario al cambiar de familia.
- **Memoria por familia (de sesión).** Al abandonar una familia se memoriza su estado completo (régimen, mezcla, modificadores, tokens propios); al volver se restaura tal cual. Es **memoria de sesión en RAM**: no se serializa a la URL ni a `sessionStorage` (solo el escenario activo viaja en el enlace compartido). Un refresco restaura el escenario activo como hasta ahora; la memoria por familia se reconstruye al navegar.
- **`isCustomized` derivado por comparación con el preset base.** El estado "Personalizado (basado en …)" se recalcula comparando el escenario resultante con su preset base. Como las tasas de token son globales, una edición de tokens marca **todas** las familias como personalizadas (coherente: el perfil de carga está editado en todas).

## Capabilities

### Modified Capabilities

- `multi-provider`: la "Selección de familia" deja de cargar el preset por defecto; pasa a conservar las tasas de token globales y a restaurar/anclar el estado por familia. Se añade el requisito de conservación de estado por familia.

## Impact

- **Store**: `src/store/useScenarioStore.ts` — `setProvider` reescrito (memoria `providerCache` por familia, overlay de tasas globales, anclaje al preset análogo, derivación de `isCustomized`); helper `sameScenarioAsPreset`; `reset` limpia la memoria.
- **Datos**: `src/data/index.ts` — `analogPresetFor(presetId, providerId)` (P3→O3→G3, cae al default si no hay análogo).
- **Cobertura**: `src/store/sessionPersistence.test.ts` — tokens globales en ambos sentidos, régimen desde el preset análogo, round-trip de mezcla por familia, preset limpio sin marca de personalizado.
- **Sin cambios**: serialización/URL (la memoria por familia no se serializa), el cálculo de coste, y el selector de **presets** (elegir un preset desde el desplegable sigue cargando todos sus parámetros como antes).
- **Fuera de alcance**: hacer globales los modificadores (Batch/regional) o el régimen; persistir la memoria por familia entre refrescos; mezcla cruzada entre familias o modo flota.
