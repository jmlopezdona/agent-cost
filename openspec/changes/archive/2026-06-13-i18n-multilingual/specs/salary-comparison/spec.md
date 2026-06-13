## MODIFIED Requirements

### Requirement: Datos salariales desde fichero con fuente y fecha

Los cuatro perfiles (Junior 25.000 €, Mid 40.000 €, Senior 60.000 €, Tech Lead 75.000 € brutos anuales) DEBEN vivir en `src/data/salaries.json` con sus **valores numéricos** (brutos, multiplicador, horas efectivas), id de rol, `last_reviewed` y rango de referencia (CA-06.3, §9). Los **nombres de rol** (Junior/Mid/Senior/Tech Lead) y la **atribución de fuente mostrada al usuario** DEBEN resolverse desde las tablas de i18n por el id del rol, en el idioma activo, y no como literales en `salaries.json`.

#### Scenario: Carga de perfiles por defecto

- **WHEN** la aplicación arranca
- **THEN** la comparativa muestra los cuatro perfiles con los brutos anuales por defecto del PRD §9 y sus nombres de rol en el idioma activo

#### Scenario: Nombres de rol en el idioma activo

- **WHEN** el idioma activo es inglés
- **THEN** los nombres de los cuatro perfiles y la atribución de fuente se muestran en inglés, resueltos por el id del rol desde la tabla `en`, mientras los brutos y demás valores numéricos provienen de `salaries.json`
