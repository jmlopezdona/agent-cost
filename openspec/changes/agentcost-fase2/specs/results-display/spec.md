## ADDED Requirements

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
