## Context

`add-multi-provider-models` decidió (D7) que cambiar de familia cargara el preset por defecto de esa familia. Era simple pero implicaba un reset: perfil de tokens y mezcla se perdían al cambiar de familia, y volver a una familia ya visitada no recuperaba lo editado. El producto pide comparar **el mismo trabajo** entre familias y poder ir y volver sin perder estado.

El escenario es single-provider: `Scenario` tiene `providerId`, `tokens` (claves `rateKey` del proveedor activo), `mix` (claves de modelo del proveedor activo) y el régimen. Las claves de `tokens` solo coinciden parcialmente entre familias:

| Categoría | Anthropic | OpenAI | Google |
|---|---|---|---|
| input (`inputK`) | ✓ | ✓ | ✓ |
| output (`outputK`) | ✓ | ✓ | ✓ |
| cache read (`cacheReadM`) | ✓ | ✓ (cached_input) | ✓ |
| cache write (`cacheWriteK`) | ✓ | — | — |
| almacenamiento (`cacheStorageM`) | — | — | ✓ |

Las tres comparten `inputK`/`outputK`/`cacheReadM`; el resto es propio de una familia. Verificado además que en los seis tríos de presets análogos (P_n/O_n/G_n) esas tres claves compartidas son **idénticas** y el régimen también, de modo que cambiar desde un preset limpio produce exactamente el análogo limpio.

## Goals / Non-Goals

**Goals:**

- Conservar el perfil de carga (tasas de token compartidas) entre familias: editar una vez, comparar en todas.
- Recordar por familia el régimen, la mezcla y los modificadores; ir y volver no resetea.
- Conservar el caso de uso al cambiar de familia anclando al preset análogo.
- Derivar `isCustomized` de forma fiable comparando con el preset base.

**Non-Goals:**

- Hacer globales los modificadores (Batch/regional/almacenamiento) o el régimen.
- Persistir la memoria por familia entre refrescos o en la URL.
- Mezcla cruzada entre familias / modo flota (siguen fuera de alcance).

## Decisions

### D1 — Tasas de token compartidas son globales; lo demás, por familia

El perfil de tokens se separa conceptualmente en dos:

- **Claves compartidas por las tres familias** (`inputK`, `outputK`, `cacheReadM`): describen la carga del agente y son **globales**. Al cambiar de familia se aplican (overlay) sobre las tasas de la familia destino, y editarlas en cualquier familia se refleja en las demás.
- **Claves propias de una familia** (`cacheWriteK` de Anthropic, `cacheStorageM` de Google): son **por familia**.

`weightedSwePro`, mezcla y régimen no entran aquí; el régimen y la mezcla son por familia (ver D2).

**Implementación**: en `setProvider`, `withGlobalTokens(familyTokens)` recorre las claves de la familia destino y, para las que existan también en el escenario actual (las compartidas), copia el valor global vigente.

**Alternativa descartada**: tokens por familia (cada una su perfil). Más aislado pero obliga a re-introducir el mismo perfil de carga en cada familia para compararlas con el mismo trabajo, que es el caso de uso central.

### D2 — Memoria por familia (de sesión) para régimen, mezcla y modificadores

`providerCache: Partial<Record<ProviderId, ProviderMemory>>` guarda, por familia, el `scenario`, el `presetId` base y los modificadores (`batchEnabled`, `batchFraction`, `regional`, `storageEnabled`). Al cambiar de familia:

1. Se memoriza el estado de la familia que se abandona.
2. Si la familia destino **ya fue visitada**, se restaura su estado (régimen, mezcla, tokens propios, modificadores), aplicando encima las tasas globales actuales (D1).
3. Si es la **primera vez**, se ancla a su preset análogo (D3) y se aplican las tasas globales.

Es memoria **de sesión en RAM**: no se serializa. Solo el escenario activo se persiste en `sessionStorage` y viaja en el enlace compartido (regla dura de persistencia del repo). `reset()` vacía la memoria.

**Alternativa descartada**: persistir la memoria por familia en `sessionStorage`/URL. Complicaría la serialización (un parámetro por familia) y el enlace compartido sin un beneficio claro; el escenario activo basta para compartir.

### D3 — Anclaje al preset análogo por caso de uso

`analogPresetFor(presetId, providerId)` mapea el preset actual al de la otra familia con el **mismo número de escenario** (prefijo de familia P/O/G + número): P3 → O3 → G3. Cae al preset por defecto de la familia si no existe análogo. Así, cambiar de familia conserva la **intención** del escenario (greenfield sigue siendo greenfield), no salta al "balanceado" por defecto.

### D4 — `isCustomized` derivado por comparación con el preset base

En vez de arrastrar el flag, `setProvider` lo recalcula con `sameScenarioAsPreset(scenario, preset)`: compara régimen, todas las claves de tokens y todas las fracciones de mezcla contra el preset base resultante. Consecuencia querida: como las tasas de token son globales, si el usuario las editó, **todas** las familias quedan marcadas como personalizadas (el perfil de carga está editado en todas). Un cambio que solo afecta a la mezcla o al régimen marca personalizada solo a esa familia.

## Risks / Trade-offs

- **[Modificadores por familia sorprenden]** → Cambiar a una familia cuyo preset análogo no trae Batch lo desactiva. Mitigación: es coherente con "solo tokens globales" y los presets de QA (P5/O5/G5) traen Batch en su análogo. Si se quisiera, hacer Batch global sería un cambio acotado posterior.
- **[Memoria de sesión no sobrevive al refresco]** → Tras recargar, solo el escenario activo se restaura; la memoria por familia se reconstruye al navegar. Aceptado: el enlace/`sessionStorage` solo modelan el escenario activo.
- **[Coste de comparar escenario vs preset]** → `sameScenarioAsPreset` es O(claves); trivial y solo en el cambio de familia.

## Migration Plan

Aditivo y reversible por commit. La capability `multi-provider` corrige el escenario de "Selección de familia" y añade el requisito de conservación de estado por familia. Sin migración de datos: `pricing.json`/`presets.json` no cambian.
