## MODIFIED Requirements

### Requirement: Visualización del desglose por categoría de token

La UI DEBE mostrar un gráfico de donut o barras apiladas con el desglose del coste por hora activa entre las cuatro categorías (cache read, output, cache write, input fresco), como visualización principal de optimización (RF-07.1). Este gráfico DEBE presentarse en una pestaña, activa por defecto, dentro del sistema de pestañas de gráficos.

#### Scenario: Desglose visible y proporcional

- **WHEN** el escenario activo es P2
- **THEN** el gráfico muestra las cuatro categorías con sus proporciones, siendo cache read el segmento mayor, con etiquetas o leyenda con valor y porcentaje

#### Scenario: Desglose como pestaña por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** la pestaña del desglose por categoría está activa y su gráfico es el visible

### Requirement: Alternativa textual a los gráficos

Cada gráfico DEBE ofrecer una alternativa textual accesible (tabla oculta visualmente o `aria-label` descriptivo con los datos) para lectores de pantalla. Esta alternativa textual DEBE estar disponible para ambos gráficos con independencia de qué pestaña esté visualmente activa, de modo que un usuario de lector de pantalla acceda a los datos de los dos gráficos sin cambiar de pestaña.

#### Scenario: Lectura por tecnología asistiva

- **WHEN** un lector de pantalla recorre la sección del desglose
- **THEN** puede acceder a los valores y porcentajes de las cuatro categorías en formato textual

#### Scenario: Datos del gráfico no visible siguen accesibles

- **WHEN** la pestaña activa es el desglose por categoría y un lector de pantalla recorre la zona de gráficos
- **THEN** puede acceder también a la alternativa textual del gráfico de techo vs. ponderado, aunque su canvas no esté visible

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
