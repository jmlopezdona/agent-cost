## ADDED Requirements

### Requirement: Modificador de contexto largo con sub‑modo GitHub Copilot

El panel de configuración avanzada DEBE ofrecer un control de **Contexto largo** con un slider de "% del trabajo por encima del umbral de contexto largo" (0–100%), análogo al de Batch API. La fracción elegible se factura a la tarifa de contexto largo de cada modelo elegible; el resto, a la estándar. El control es **global** (se arrastra entre familias, como Batch y recargo regional) y se muestra en las tres familias, indicando que solo impacta en el coste de las familias/modelos con tramo aplicable (OpenAI y Gemini Pro); en Anthropic el control es visible pero inerte sobre el coste. Por defecto el control está desactivado (fracción 0). Anidado bajo Contexto largo, el panel DEBE ofrecer un toggle **vía GitHub Copilot** que solo es visible/efectivo cuando hay fracción de contexto largo y, al activarse, sustituye las tarifas de contexto largo nativas por las de Copilot en los modelos elegibles. Los modificadores activos DEBEN reflejarse con su badge junto a los resultados.

#### Scenario: Contexto largo al 50% encarece la fracción elegible

- **WHEN** el proveedor activo es OpenAI y el usuario fija el % de contexto largo en 50
- **THEN** el coste de los modelos con tramo (GPT‑5.5/5.4) se recalcula como mezcla 50/50 de tarifa estándar y de contexto largo, y aparece el badge de contexto largo junto a los resultados

#### Scenario: Control visible pero inerte en Anthropic

- **WHEN** el proveedor activo es Anthropic y el usuario fija el % de contexto largo en 80
- **THEN** el control se muestra con un aviso de "no aplica a esta familia" y el coste no cambia respecto al 0%

#### Scenario: Sub‑modo Copilot solo visible con contexto largo activo

- **WHEN** la fracción de contexto largo es 0
- **THEN** el toggle "vía GitHub Copilot" no se muestra (o está deshabilitado) y no tiene efecto sobre el cálculo

#### Scenario: Copilot conmuta las tarifas de contexto largo

- **WHEN** hay fracción de contexto largo > 0 sobre un modelo elegible de OpenAI o Gemini y el usuario activa "vía GitHub Copilot"
- **THEN** la fracción de contexto largo se factura a las tarifas de Copilot (más altas) y el badge indica el sub‑modo Copilot
