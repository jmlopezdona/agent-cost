## ADDED Requirements

### Requirement: Exportación del escenario como CSV y JSON

La UI DEBE permitir descargar el escenario actual como fichero CSV y como fichero JSON, incluyendo los parámetros de entrada (tokens, mezcla, régimen, duty, agentes, modificadores activos, `fx`) y los resultados calculados (blend, techo, ponderado mensual y anual, desglose por categoría) (RF-09). La generación es 100% en cliente, sin que ningún dato salga del navegador.

#### Scenario: Descarga JSON del escenario

- **WHEN** el usuario pulsa "exportar JSON" con el escenario P2 activo
- **THEN** se descarga un fichero JSON con los parámetros de entrada y los resultados del escenario, generado en el navegador

#### Scenario: Descarga CSV del escenario

- **WHEN** el usuario pulsa "exportar CSV"
- **THEN** se descarga un fichero CSV con los mismos parámetros y resultados, con cifras sin redondeo de presentación o claramente etiquetadas

#### Scenario: Coherencia del export con los resultados mostrados

- **WHEN** el escenario tiene Batch API al 40% activo
- **THEN** el fichero exportado refleja el modificador activo y los resultados ya con el descuento aplicado, coherentes con las tarjetas de métricas

### Requirement: Exportación de cada gráfico como PNG

La UI DEBE permitir descargar cada visualización (desglose por categoría, techo vs ponderado, comparativa salarial) como imagen PNG individual (RF-09), generada a partir del canvas del propio gráfico, sin enviar datos a ningún servidor.

#### Scenario: Descarga PNG del desglose por categoría

- **WHEN** el usuario pulsa el botón de exportar imagen del gráfico de desglose por categoría
- **THEN** se descarga un PNG que reproduce el gráfico tal como se muestra, respetando el tema activo (claro/oscuro)

### Requirement: Exportación conjunta de las visualizaciones como un único PNG

La UI DEBE ofrecer, además de la exportación por gráfico, un botón "exportar todo" que descargue un único PNG de montaje con las tres visualizaciones (desglose por categoría, techo vs ponderado y comparativa salarial), compuesto en cliente a partir de los canvas de los gráficos, sin enviar datos a ningún servidor.

#### Scenario: Descarga del montaje de los tres gráficos

- **WHEN** el usuario pulsa "exportar todo"
- **THEN** se descarga un único PNG que combina las tres visualizaciones tal como se muestran, respetando el tema activo (claro/oscuro)
