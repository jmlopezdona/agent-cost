# results-display

## Purpose

Presentación de resultados: tarjetas de métricas principales con el ponderado mensual como número héroe, formateo en convención española y desglose visual del coste por hora por categoría de token, con actualización reactiva, soporte de modo claro/oscuro y alternativa textual accesible.

## Requirements

### Requirement: Tarjetas de métricas principales

La UI DEBE mostrar cuatro tarjetas de métricas: blend por hora activa, techo mensual, ponderado mensual y ponderado anual, con el ponderado mensual destacado visualmente como número héroe (RF-07.4, §10). Todas se expresan en la moneda de presentación seleccionada (defecto EUR).

#### Scenario: Métricas del caso de referencia en USD

- **WHEN** el escenario activo es P2 con precios por defecto y la moneda seleccionada es USD
- **THEN** las tarjetas muestran ≈ $13,8/h, ≈ $3.585/mes (techo), ≈ $2.151/mes (ponderado, destacado) y ≈ $25.800/año

#### Scenario: Métricas del caso de referencia en EUR

- **WHEN** el escenario activo es P2 con precios por defecto, la moneda seleccionada es EUR y `fx` = 0,92
- **THEN** las tarjetas muestran las mismas magnitudes convertidas a euros (p. ej. techo ≈ 3.298 € y ponderado ≈ 1.979 €), con el cálculo interno intacto en USD

### Requirement: Formateo de todas las cifras

Toda cifra mostrada DEBE ir formateada con separadores de miles según convención española, el símbolo de la moneda de presentación activa (€ o $) y decimales controlados: enteros para importes mensuales/anuales y 1 decimal para tarifas por hora (CA-01.1), manteniendo el cálculo interno en USD con precisión completa.

#### Scenario: Redondeo solo en presentación

- **WHEN** el cálculo interno del ponderado mensual da 6.038,4567 USD y la moneda activa es USD
- **THEN** la tarjeta muestra "6.038 $" y los cálculos derivados usan el valor sin redondear

#### Scenario: Símbolo según moneda activa

- **WHEN** la moneda activa cambia de USD a EUR
- **THEN** las cifras de las tarjetas pasan a mostrar el símbolo € y el valor convertido con `fx`, sin recargar la página

### Requirement: Visualización del desglose por categoría de token

La UI DEBE mostrar un gráfico de donut o barras apiladas con el desglose del coste por hora activa entre las cuatro categorías (cache read, output, cache write, input fresco), como visualización principal de optimización (RF-07.1). Este gráfico DEBE presentarse en una pestaña, activa por defecto, dentro del sistema de pestañas de gráficos.

#### Scenario: Desglose visible y proporcional

- **WHEN** el escenario activo es P2
- **THEN** el gráfico muestra las cuatro categorías con sus proporciones, siendo cache read el segmento mayor, con etiquetas o leyenda con valor y porcentaje

#### Scenario: Desglose como pestaña por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** la pestaña del desglose por categoría está activa y su gráfico es el visible

### Requirement: Actualización reactiva y soporte de tema en visualizaciones

Todas las visualizaciones DEBEN actualizarse reactivamente ante cualquier cambio de input y respetar el modo claro/oscuro activo (CA-07.1). Al activarse su pestaña, el gráfico correspondiente DEBE renderizarse con sus dimensiones reales (sin quedar a tamaño cero por haber estado oculto).

#### Scenario: Cambio de tema con gráfico visible

- **WHEN** el usuario cambia de modo claro a oscuro
- **THEN** los colores de fondo, texto y series del gráfico se adaptan al tema oscuro sin recargar la página

#### Scenario: Recálculo del gráfico al mover un slider

- **WHEN** el usuario aumenta el cache read de 30 a 60 M/h
- **THEN** el segmento de cache read del gráfico crece de forma inmediata y los porcentajes se reajustan

#### Scenario: Render correcto al activar una pestaña

- **WHEN** el usuario cambia a la pestaña de un gráfico que no estaba visible
- **THEN** el gráfico se muestra dibujado a su tamaño correcto, sin recortes ni canvas en blanco

### Requirement: Alternativa textual a los gráficos

Cada gráfico DEBE ofrecer una alternativa textual accesible (tabla oculta visualmente o `aria-label` descriptivo con los datos) para lectores de pantalla. Esta alternativa textual DEBE estar disponible para ambos gráficos con independencia de qué pestaña esté visualmente activa, de modo que un usuario de lector de pantalla acceda a los datos de los dos gráficos sin cambiar de pestaña.

#### Scenario: Lectura por tecnología asistiva

- **WHEN** un lector de pantalla recorre la sección del desglose
- **THEN** puede acceder a los valores y porcentajes de las cuatro categorías en formato textual

#### Scenario: Datos del gráfico no visible siguen accesibles

- **WHEN** la pestaña activa es el desglose por categoría y un lector de pantalla recorre la zona de gráficos
- **THEN** puede acceder también a la alternativa textual del gráfico de techo vs. ponderado, aunque su canvas no esté visible

### Requirement: Señal secundaria al color en las series de gráficos

Cada serie de datos de las visualizaciones (desglose por categoría, techo vs ponderado, comparativa salarial) DEBE distinguirse por color **más** una señal secundaria (patrón de relleno, borde o forma), no solo por color, para cumplir accesibilidad (CA-07.2). Los colores DEBEN seguir viniendo de los design tokens, sin hardcodear en componentes ni en gráficos.

#### Scenario: Distinción sin depender del color

- **WHEN** se renderiza el gráfico de desglose por categoría
- **THEN** cada categoría se distingue por color y por una señal secundaria (p. ej. patrón o borde), de modo que sea diferenciable sin percibir el color

#### Scenario: Señal secundaria respeta los tokens de color

- **WHEN** el usuario cambia entre modo claro y oscuro
- **THEN** las series mantienen su señal secundaria y sus colores provienen de los design tokens del tema activo

### Requirement: Reactividad de las visualizaciones ante los modificadores

Las visualizaciones y las tarjetas de métricas DEBEN actualizarse reactivamente cuando se activan o ajustan los modificadores de configuración avanzada (Batch API, recargo regional, precios editados), manteniéndose por debajo del presupuesto de recálculo (< 16 ms).

#### Scenario: Activar batch repinta los resultados

- **WHEN** el usuario activa Batch API al 40%
- **THEN** las tarjetas de métricas y los gráficos de coste se repintan al instante con las cifras ya descontadas, sin acción de confirmación

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
