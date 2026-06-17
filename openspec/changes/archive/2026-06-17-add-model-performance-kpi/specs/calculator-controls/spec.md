## ADDED Requirements

### Requirement: Desempeño SWE-Pro por modelo y del mix en la mezcla

El control de mezcla DEBE mostrar, junto al nombre de cada modelo (sliders y modelo resto), su score SWE-bench Pro entre paréntesis (p. ej. "Claude Opus 4.8 (69%)"), marcando con `≈` los scores cuya `basis` no sea `vendor` o `confidence` no sea `high`. Al pie del control, junto a la tarifa blend, la UI DEBE mostrar el desempeño ponderado del mix (`weightedSwePro`). Un modelo sin `swePro` se muestra sin paréntesis de score.

#### Scenario: Score entre paréntesis por modelo

- **WHEN** el proveedor activo es Anthropic y se muestran los modelos de la mezcla
- **THEN** cada nombre incluye su score entre paréntesis (Fable 5 y Opus 4.8 con score de proveedor sin `≈`; Sonnet 4.6 y Haiku 4.5 con `≈` por ser estimados) y el modelo resto también lo muestra

#### Scenario: Desempeño ponderado al pie del mix

- **WHEN** el usuario ajusta cualquier slider de la mezcla
- **THEN** el desempeño ponderado mostrado junto al blend se recalcula al instante junto con la tarifa blend

#### Scenario: Coherencia al cambiar de familia

- **WHEN** el usuario cambia el proveedor activo a Google
- **THEN** los paréntesis muestran los scores de los modelos de Google (Gemini 3.1 Pro con score de proveedor sin `≈`; Flash/Flash-Lite con `≈`) y el desempeño ponderado refleja el mix de esa familia
