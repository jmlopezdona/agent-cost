## ADDED Requirements

### Requirement: Tarjetas de desempeño SWE-Pro y coste por punto

La UI DEBE mostrar dos tarjetas de métrica adicionales (no héroe): "Desempeño SWE-Pro" con el desempeño ponderado del mix (`weightedSwePro`, en %) y "Coste/punto" con el coste por punto de desempeño (`costPerPointUSD`, en la moneda de presentación activa). El ponderado mensual sigue siendo el único número héroe. La tarjeta de desempeño DEBE marcar el valor como aproximado (p. ej. con `≈` y una `hint` con el motivo) cuando la mezcla activa incluye algún score con `basis` distinta de `vendor` o `confidence` distinta de `high`; cuando `weightedSwePro` es 0, "Coste/punto" muestra "n/d".

#### Scenario: Tarjetas del caso de referencia en USD

- **WHEN** el escenario activo es P2 con precios y scores por defecto y la moneda es USD
- **THEN** se muestran las tarjetas "Desempeño SWE-Pro" ≈ 61% (marcada como aproximada por incluir scores estimados) y "Coste/punto" ≈ 98 $/mes·pto, sin que cambien las tarjetas de coste existentes

#### Scenario: Coste por punto sin desempeño

- **WHEN** la mezcla activa no tiene scores (`weightedSwePro` = 0)
- **THEN** la tarjeta "Coste/punto" muestra "n/d" y la de desempeño muestra 0% o el estado vacío correspondiente

#### Scenario: Conversión de moneda del coste por punto

- **WHEN** la moneda activa cambia de USD a EUR con `fx` = 0,92
- **THEN** "Coste/punto" pasa a euros con el símbolo €, manteniendo el cálculo interno en USD

### Requirement: Disclaimer de comparabilidad del desempeño

La UI DEBE ofrecer un aviso de que el score SWE-Pro mezcla bases metodológicas (estandarizada Scale SEAL, vendor y estimación) y de que la comparación de desempeño entre familias es indicativa, no una equivalencia exacta. El aviso es un único texto i18n próximo a las métricas de desempeño o al control de mezcla.

#### Scenario: Disclaimer visible junto al desempeño

- **WHEN** el usuario consulta el desempeño ponderado o el coste por punto
- **THEN** dispone de la nota de comparabilidad (texto o tooltip) que explica la mezcla de bases y el carácter indicativo de la comparación entre familias

### Requirement: Alternativa textual de los KPIs de desempeño

Los KPIs de desempeño DEBEN ser accesibles de forma textual, con el valor del desempeño ponderado, el coste por punto y la indicación de aproximación cuando aplique, sin depender del color para transmitir la incertidumbre.

#### Scenario: Lectura accesible del desempeño

- **WHEN** un lector de pantalla recorre la zona de métricas
- **THEN** anuncia el desempeño ponderado, el coste por punto y, si procede, que el valor es aproximado
