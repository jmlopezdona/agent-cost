## ADDED Requirements

### Requirement: Sobreprecio de contexto largo por modelo elegible

El motor DEBE calcular la tarifa por hora de un modelo como mezcla ponderada de su tarifa de **contexto estándar** y su tarifa de **contexto largo**, según una fracción `longContextFraction` (0–1) del trabajo elegible. Para un modelo elegible: `tarifa = (1 − f) × tarifa_estándar + f × tarifa_largo`, aplicada por categoría sobre las tasas de token del escenario. Un modelo **no elegible** (sin bloque de precios de contexto largo declarado) DEBE facturarse siempre a su tarifa estándar, con independencia de `longContextFraction`. El sobreprecio se compone con los modificadores existentes (Batch, recargo regional) sin alterarlos. El caso dorado P2 (Anthropic, sin modelos elegibles) DEBE permanecer inalterado.

#### Scenario: Fracción de contexto largo encarece solo al modelo elegible

- **WHEN** el proveedor activo es OpenAI, la mezcla incluye GPT‑5.5 (input 5 → 8, output 30 → 36 en contexto largo) y el usuario fija la fracción de contexto largo en 50%
- **THEN** la tarifa por hora de GPT‑5.5 se calcula como `0,5 × estándar + 0,5 × largo`, y los modelos sin tramo (p. ej. GPT‑5.4 nano) mantienen su tarifa estándar

#### Scenario: Anthropic es inerte ante el contexto largo

- **WHEN** el proveedor activo es Anthropic (ningún modelo declara tramo de contexto largo) y la fracción de contexto largo es 100%
- **THEN** el blend, el techo y el ponderado son idénticos a los del mismo escenario con contexto largo al 0% (el caso dorado P2 no cambia)

#### Scenario: Fracción cero es neutra

- **WHEN** la fracción de contexto largo es 0
- **THEN** todos los modelos se facturan a su tarifa estándar, con independencia de que sean elegibles o no

### Requirement: Conmutación a tarifas de contexto largo de GitHub Copilot

Cuando el sub‑modo **vía GitHub Copilot** está activo Y hay fracción de contexto largo, el motor DEBE usar, para los modelos elegibles, las tarifas de contexto largo de **Copilot** (delta declarado en `pricing.json`) en lugar de las de la API nativa. Si la fracción de contexto largo es 0, el sub‑modo Copilot DEBE ser neutro (las tarifas estándar de Copilot coinciden con las nativas).

#### Scenario: Copilot aplica la tarifa de contexto largo más alta

- **WHEN** GPT‑5.5 está en la mezcla, la fracción de contexto largo es 100% y el sub‑modo Copilot está activo (long Copilot 10/45 frente a nativo 8/36)
- **THEN** la fracción de contexto largo de GPT‑5.5 se factura a 10/45 en lugar de 8/36

#### Scenario: Copilot sin contexto largo es neutro

- **WHEN** el sub‑modo Copilot está activo pero la fracción de contexto largo es 0
- **THEN** el cálculo es idéntico al de Copilot desactivado
