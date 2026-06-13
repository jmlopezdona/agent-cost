## MODIFIED Requirements

### Requirement: Panel colapsable de configuración avanzada

La configuración avanzada DEBE vivir como una sección del acordeón exclusivo de la columna de controles, cerrada por defecto, sin que su contenido bloquee el uso básico de la calculadora (§10, RF-08). Al abrirla, las demás secciones del acordeón se cierran conforme a la regla de exclusividad; los controles básicos (tokens, mezcla, régimen) son accesibles abriendo su sección correspondiente.

#### Scenario: Panel plegado por defecto

- **WHEN** la aplicación arranca sin interacción del usuario
- **THEN** la sección de configuración avanzada está cerrada y los controles básicos son usables a través del acordeón sin desplegar la avanzada

#### Scenario: Abrir la avanzada cierra las demás

- **WHEN** el usuario abre la sección de configuración avanzada
- **THEN** se muestra su contenido y la sección que estuviera abierta antes se cierra, quedando solo la avanzada abierta
