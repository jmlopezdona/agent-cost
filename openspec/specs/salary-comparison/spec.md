# salary-comparison

## Purpose

Comparativa del coste del escenario de agentes con perfiles humanos en España desde `salaries.json`: coste empresa por perfil, equivalencia en FTE, ratio de horas y €/h, conversión USD→EUR configurable, visualización de barras horizontales y disclaimer permanente.

## Requirements

### Requirement: Datos salariales desde fichero con fuente y fecha

Los cuatro perfiles (Junior 25.000 €, Mid 40.000 €, Senior 60.000 €, Tech Lead 75.000 € brutos anuales) DEBEN vivir en `src/data/salaries.json` con campos de fuente, `last_reviewed` y rango de referencia (CA-06.3, §9).

#### Scenario: Carga de perfiles por defecto

- **WHEN** la aplicación arranca
- **THEN** la comparativa muestra los cuatro perfiles con los brutos anuales por defecto del PRD §9

### Requirement: Cálculo de coste empresa por perfil

La comparativa DEBE calcular para cada perfil: coste empresa anual = bruto × multiplicador (default 1,30), coste empresa mensual (anual/12) y coste por hora efectiva (anual / horas efectivas, default 1.720 h/año).

#### Scenario: Coste empresa del perfil Mid

- **WHEN** el bruto anual es 40.000 € con multiplicador 1,30 y 1.720 h efectivas
- **THEN** el coste empresa es 52.000 €/año, ≈ 4.333 €/mes y ≈ 30,2 €/h efectiva

### Requirement: Conversión del coste del agente a EUR

El coste del agente DEBE calcularse en USD y convertirse a EUR con un tipo de cambio configurable, mostrado siempre junto al resultado en EUR (RF-06).

#### Scenario: Tipo de cambio visible

- **WHEN** la comparativa muestra el coste mensual del agente en EUR
- **THEN** el tipo de cambio aplicado (p. ej. "1 USD = 0,92 €") aparece junto al resultado y es editable

### Requirement: Salidas de la comparativa

La comparativa DEBE mostrar, para el escenario actual: (1) equivalencia en FTE por perfil (`coste_agente_mensual_EUR / coste_empresa_mensual`), (2) ratio de horas activas mensuales del agente frente a las ~143 h efectivas/mes de un FTE, y (3) €/h activa del agente frente a €/h efectiva de cada perfil.

#### Scenario: Equivalencia en FTE

- **WHEN** el coste ponderado mensual del agente es 5.556 € y el coste empresa mensual del perfil Mid es 4.333 €
- **THEN** la comparativa muestra ≈ 1,3× un Mid (y los ratios análogos para los otros tres perfiles)

#### Scenario: Comparativa de horas

- **WHEN** el agente tiene 437 h activas mensuales con el régimen actual
- **THEN** se muestra el ratio frente a ≈ 143 h efectivas/mes de un FTE (≈ 3,1×)

### Requirement: Visualización de barras horizontales

La comparativa DEBE incluir un gráfico de barras horizontales con el coste mensual del escenario de agentes junto a las barras de coste empresa mensual de los cuatro perfiles, en EUR (CA-06.1).

#### Scenario: Barras comparativas

- **WHEN** la comparativa se renderiza con el escenario P2
- **THEN** se muestran cinco barras (agente + 4 perfiles) a escala común en EUR, distinguibles por color más una señal secundaria

### Requirement: Perfiles editables en sesión

Los valores de bruto anual de los perfiles DEBEN ser editables desde la UI con efecto inmediato en la comparativa durante la sesión, sin persistencia.

#### Scenario: Edición de un bruto anual

- **WHEN** el usuario cambia el bruto del Senior de 60.000 € a 70.000 €
- **THEN** el coste empresa, las equivalencias FTE y la barra del Senior se recalculan al instante

### Requirement: Disclaimer permanente

La comparativa DEBE mostrar de forma permanente y visible un disclaimer indicando que los salarios son orientativos, el multiplicador es una aproximación y la comparativa no implica equivalencia de capacidades ni sustituibilidad (CA-06.2), visible sin scroll dentro de la vista de comparativa.

#### Scenario: Disclaimer siempre visible

- **WHEN** el usuario visualiza la sección de comparativa salarial
- **THEN** el disclaimer es visible sin acción adicional ni scroll dentro de la sección
