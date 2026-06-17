## ADDED Requirements

### Requirement: Serialización de los parámetros de contexto largo

El estado de contexto largo (fracción elegible) y del sub‑modo **vía GitHub Copilot** DEBE serializarse en la query compartible y en `sessionStorage` mediante claves cortas en `PARAMS`, siguiendo la convención existente de serializar solo el diff frente al preset base. Ambas claves DEBEN incluirse en `RECOGNIZED_KEYS` para que un enlace que las contenga cuente como "enlace entrante con estado". Un enlace sin estos parámetros DEBE deserializarse a los valores por defecto (fracción 0, Copilot desactivado).

#### Scenario: Round‑trip de contexto largo + Copilot

- **WHEN** el usuario fija el % de contexto largo en 60 y activa "vía GitHub Copilot", copia el enlace y lo abre en otra pestaña
- **THEN** el escenario se restaura con contexto largo al 60% y el sub‑modo Copilot activo

#### Scenario: Defaults cuando faltan los parámetros

- **WHEN** se abre un enlace que no incluye los parámetros de contexto largo
- **THEN** la fracción de contexto largo es 0 y el sub‑modo Copilot está desactivado

#### Scenario: Solo se serializa el diff frente al preset

- **WHEN** la fracción de contexto largo es 0 (valor por defecto) y Copilot está desactivado
- **THEN** la query compartida no incluye los parámetros de contexto largo
