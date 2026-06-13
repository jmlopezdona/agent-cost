## ADDED Requirements

### Requirement: Acordeón exclusivo de configuración

Las secciones de configuración de la columna de controles DEBEN presentarse en un acordeón exclusivo en el orden Régimen y utilización, Mezcla de modelos, Tasa de tokens E/S y Configuración avanzada: como máximo una sección abierta a la vez. La sección "Régimen y utilización" DEBE estar abierta por defecto al arrancar. Siempre DEBE haber exactamente una sección abierta: hacer clic en la cabecera de la sección ya abierta NO la cierra.

#### Scenario: Una sola sección abierta por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** la sección "Régimen y utilización" está abierta, aparece en primer lugar y las otras tres muestran solo su cabecera en el orden Mezcla de modelos, Tasa de tokens E/S, Configuración avanzada

#### Scenario: Abrir una sección cierra la anterior

- **WHEN** el usuario hace clic en la cabecera de "Mezcla de modelos" estando abierta "Régimen y utilización"
- **THEN** se abre "Mezcla de modelos" y se cierra "Régimen y utilización", quedando solo una abierta

#### Scenario: No se puede colapsar la sección abierta

- **WHEN** el usuario hace clic en la cabecera de la sección actualmente abierta
- **THEN** la sección permanece abierta y sigue habiendo exactamente una sección abierta

#### Scenario: Accesibilidad del acordeón

- **WHEN** una tecnología asistiva recorre la columna de configuración
- **THEN** cada cabecera es un control con `aria-expanded` que refleja su estado y el contenido de las secciones cerradas queda fuera del orden de tabulación

### Requirement: Pestañas de gráficos de resultados

Los dos gráficos de resultados (desglose por categoría de token y techo vs. ponderado mensual) DEBEN presentarse en un sistema de pestañas que muestre solo un gráfico a la vez. La pestaña del desglose por categoría de token (Donut) DEBE estar activa por defecto.

#### Scenario: Donut activo por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** se muestra el gráfico de desglose por categoría de token y el gráfico de techo vs. ponderado no es visible

#### Scenario: Cambiar de pestaña

- **WHEN** el usuario selecciona la pestaña "Techo vs. ponderado mensual"
- **THEN** se muestra ese gráfico y se oculta el de desglose por categoría

#### Scenario: Accesibilidad de las pestañas

- **WHEN** una tecnología asistiva recorre la zona de gráficos
- **THEN** las pestañas exponen el patrón tablist/tab/tabpanel con `aria-selected` en la pestaña activa y el panel inactivo marcado como oculto

### Requirement: Comparativa salarial a todo el ancho

En la disposición de escritorio, la sección de comparativa salarial DEBE ocupar todo el ancho de la pantalla, situada debajo de la columna de configuración y de la zona de resultados, en lugar de limitarse a las columnas de resultados.

#### Scenario: Salary full-width en escritorio

- **WHEN** la aplicación se muestra en un viewport de escritorio
- **THEN** la comparativa salarial se extiende a lo ancho de toda la rejilla por debajo del resto de secciones

#### Scenario: Apilado en móvil

- **WHEN** la aplicación se muestra en un viewport de 360 px
- **THEN** la comparativa salarial aparece apilada en una sola columna junto al resto de secciones, sin scroll horizontal

### Requirement: Estado de presentación de UI no persistido

El estado de presentación de la interfaz (qué sección del acordeón está abierta y qué pestaña de gráfico está activa) es estado de UI y NO DEBE persistirse en la URL compartible ni en el `sessionStorage` del escenario. Tampoco DEBE persistirse por otros medios de inicio.

#### Scenario: La URL compartida no incluye estado de UI

- **WHEN** el usuario abre la sección "Tasa de tokens E/S", cambia a la pestaña "Techo vs. ponderado" y copia el enlace para compartir
- **THEN** la URL generada no contiene ningún parámetro sobre la sección abierta ni la pestaña activa

#### Scenario: El refresco restablece el estado de UI por defecto

- **WHEN** el usuario cambia la sección abierta y la pestaña activa y luego refresca la página
- **THEN** vuelve a mostrarse abierta la sección "Régimen y utilización" y activa la pestaña del Donut, mientras el escenario se conserva
