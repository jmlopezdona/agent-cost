# results-display

## ADDED Requirements

### Requirement: Tarjetas de métricas principales

La UI DEBE mostrar cuatro tarjetas de métricas: blend $/h activa, techo mensual, ponderado mensual y ponderado anual, con el ponderado mensual destacado visualmente como número héroe (RF-07.4, §10).

#### Scenario: Métricas del caso de referencia

- **WHEN** el escenario activo es P2 con precios por defecto
- **THEN** las tarjetas muestran ≈ $13,8/h, ≈ $10.060/mes (techo), ≈ $6.040/mes (ponderado, destacado) y ≈ $72.500/año

### Requirement: Formateo de todas las cifras

Toda cifra mostrada DEBE ir formateada con separadores de miles según convención española, símbolo de divisa y decimales controlados: enteros para importes mensuales/anuales y 1 decimal para $/h (CA-01.1), manteniendo el cálculo interno con precisión completa.

#### Scenario: Redondeo solo en presentación

- **WHEN** el cálculo interno del ponderado mensual da 6.038,4567 USD
- **THEN** la tarjeta muestra "6.038 $" (o formato equivalente con símbolo) y los cálculos derivados usan el valor sin redondear

### Requirement: Visualización del desglose por categoría de token

La UI DEBE mostrar un gráfico de donut o barras apiladas con el desglose del coste por hora activa entre las cuatro categorías (cache read, output, cache write, input fresco), como visualización principal de optimización (RF-07.1).

#### Scenario: Desglose visible y proporcional

- **WHEN** el escenario activo es P2
- **THEN** el gráfico muestra las cuatro categorías con sus proporciones, siendo cache read el segmento mayor, con etiquetas o leyenda con valor y porcentaje

### Requirement: Actualización reactiva y soporte de tema en visualizaciones

Todas las visualizaciones DEBEN actualizarse reactivamente ante cualquier cambio de input y respetar el modo claro/oscuro activo (CA-07.1).

#### Scenario: Cambio de tema con gráfico visible

- **WHEN** el usuario cambia de modo claro a oscuro
- **THEN** los colores de fondo, texto y series del gráfico se adaptan al tema oscuro sin recargar la página

#### Scenario: Recálculo del gráfico al mover un slider

- **WHEN** el usuario aumenta el cache read de 30 a 60 M/h
- **THEN** el segmento de cache read del gráfico crece de forma inmediata y los porcentajes se reajustan

### Requirement: Alternativa textual a los gráficos

Cada gráfico DEBE ofrecer una alternativa textual accesible (tabla oculta visualmente o `aria-label` descriptivo con los datos) para lectores de pantalla.

#### Scenario: Lectura por tecnología asistiva

- **WHEN** un lector de pantalla recorre la sección del desglose
- **THEN** puede acceder a los valores y porcentajes de las cuatro categorías en formato textual
