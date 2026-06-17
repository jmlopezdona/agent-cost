## ADDED Requirements

### Requirement: Elegibilidad de contexto largo por proveedor y modelo

Cada proveedor DEBE declarar en `pricing.json` qué modelos tienen tramo de **contexto largo** y a partir de qué umbral de input, junto con las tarifas de contexto largo (nativa y delta de GitHub Copilot) de esos modelos. Un modelo sin bloque de contexto largo NO es elegible: el motor lo factura siempre a su tarifa estándar. La declaración DEBE reflejar la realidad de cada API a la fecha de `effective_date`: Anthropic sin modelos elegibles (1M a tarifa plana); Google solo los modelos Pro (Flash/Flash‑Lite planos); OpenAI los modelos con tramo (p. ej. GPT‑5.5 y GPT‑5.4, no mini/nano).

#### Scenario: Anthropic no declara modelos de contexto largo

- **WHEN** se inspecciona la familia Anthropic en `pricing.json`
- **THEN** ningún modelo declara bloque de contexto largo y el modificador queda inerte sobre el coste de esa familia

#### Scenario: Gemini limita la elegibilidad a los modelos Pro

- **WHEN** se inspecciona la familia Google en `pricing.json`
- **THEN** los modelos Pro declaran tramo de contexto largo (input ×2 / output ×1,5) y los Flash/Flash‑Lite no

#### Scenario: La elegibilidad sobrevive al cambio de familia

- **WHEN** el usuario tiene contexto largo activo y cambia de OpenAI a Anthropic y de vuelta
- **THEN** la fracción global de contexto largo se conserva y solo afecta al coste de las familias con modelos elegibles
