## MODIFIED Requirements

### Requirement: Tarjetas de métricas principales

La UI DEBE mostrar cuatro tarjetas de métricas: blend por hora activa, techo mensual, ponderado mensual y ponderado anual, con el ponderado mensual destacado visualmente como número héroe (RF-07.4, §10). Todas se expresan en la moneda de presentación seleccionada (defecto EUR).

#### Scenario: Métricas del caso de referencia en USD

- **WHEN** el escenario activo es P2 con precios por defecto y la moneda seleccionada es USD
- **THEN** las tarjetas muestran ≈ $13,8/h, ≈ $10.060/mes (techo), ≈ $6.040/mes (ponderado, destacado) y ≈ $72.500/año

#### Scenario: Métricas del caso de referencia en EUR

- **WHEN** el escenario activo es P2 con precios por defecto, la moneda seleccionada es EUR y `fx` = 0,92
- **THEN** las tarjetas muestran las mismas magnitudes convertidas a euros (p. ej. techo ≈ 9.255 € y ponderado ≈ 5.555 €), con el cálculo interno intacto en USD

### Requirement: Formateo de todas las cifras

Toda cifra mostrada DEBE ir formateada con separadores de miles según convención española, el símbolo de la moneda de presentación activa (€ o $) y decimales controlados: enteros para importes mensuales/anuales y 1 decimal para tarifas por hora (CA-01.1), manteniendo el cálculo interno en USD con precisión completa.

#### Scenario: Redondeo solo en presentación

- **WHEN** el cálculo interno del ponderado mensual da 6.038,4567 USD y la moneda activa es USD
- **THEN** la tarjeta muestra "6.038 $" y los cálculos derivados usan el valor sin redondear

#### Scenario: Símbolo según moneda activa

- **WHEN** la moneda activa cambia de USD a EUR
- **THEN** las cifras de las tarjetas pasan a mostrar el símbolo € y el valor convertido con `fx`, sin recargar la página
