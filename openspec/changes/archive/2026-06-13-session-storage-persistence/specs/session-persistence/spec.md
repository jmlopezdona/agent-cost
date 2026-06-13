## ADDED Requirements

### Requirement: Persistencia del escenario en sessionStorage

El escenario y los modificadores de configuración avanzada DEBEN persistirse en `sessionStorage` (almacenamiento por pestaña) usando el mismo formato compacto que la URL de compartir (claves cortas, solo los valores que difieren del preset base, incluida la versión de precios `pv`). El estado DEBE sobrevivir a un refresco de página y ser independiente entre pestañas distintas. La aplicación NO DEBE escuchar el evento `storage` ni sincronizar el estado entre pestañas. El tema sigue persistiéndose aparte en `localStorage`.

#### Scenario: El estado sobrevive al refresco

- **WHEN** el usuario personaliza el escenario (p. ej. mueve el duty cycle a 70% y activa Batch API) y refresca la página
- **THEN** al recargar se restauran exactamente esos valores desde `sessionStorage`, sin que el usuario haya tenido que guardar nada

#### Scenario: Cada pestaña es independiente

- **WHEN** el usuario tiene dos pestañas abiertas con escenarios distintos y edita una
- **THEN** la otra pestaña conserva su propio escenario sin verse afectada

#### Scenario: La edición no ensucia la URL

- **WHEN** el usuario modifica cualquier control del escenario
- **THEN** el estado se guarda en `sessionStorage` y la barra de direcciones permanece limpia (sin query string de escenario)

### Requirement: Precedencia de un enlace entrante sobre el estado almacenado

Al cargar, si la URL contiene parámetros de escenario reconocidos, la aplicación DEBE restaurar el escenario desde la URL (un enlace explícito tiene precedencia), adoptarlo en `sessionStorage` y limpiar la URL a la ruta pelada con `history.replaceState`. Si la URL no contiene parámetros reconocidos pero `sessionStorage` tiene un escenario, DEBE restaurarse desde `sessionStorage`. Si no hay ninguno de los dos, DEBE cargarse el preset por defecto.

#### Scenario: Enlace entrante gana y se adopta

- **WHEN** el usuario abre un enlace compartido con un escenario personalizado, teniendo además un escenario distinto en `sessionStorage`
- **THEN** se muestra el escenario del enlace, se guarda en `sessionStorage` y la barra de direcciones queda limpia (sin la query)

#### Scenario: Sin enlace, se restaura la sesión

- **WHEN** el usuario abre la aplicación sin parámetros en la URL pero con un escenario previo en `sessionStorage` (p. ej. tras un refresco)
- **THEN** se restaura el escenario de `sessionStorage`

#### Scenario: Arranque limpio

- **WHEN** el usuario abre la aplicación sin parámetros en la URL y sin nada en `sessionStorage` (pestaña nueva)
- **THEN** se carga el preset por defecto

### Requirement: Botón Reset

La cabecera DEBE incluir un botón "Reset" que vacíe el escenario almacenado en `sessionStorage` y devuelva la aplicación al preset por defecto con los modificadores en su valor neutro (sin Batch, recargo por defecto, sin overrides de precios, modo presentación desactivado). El Reset DEBE conservar la moneda de presentación y el tipo de cambio, por ser preferencias de presentación y no parte del escenario.

#### Scenario: Reset vuelve al estado inicial

- **WHEN** el usuario, tras personalizar el escenario y activar modificadores, pulsa "Reset"
- **THEN** la aplicación vuelve al preset por defecto con modificadores neutros, `sessionStorage` queda vacío y la moneda/tipo de cambio seleccionados se mantienen

#### Scenario: Reset persiste tras refresco

- **WHEN** el usuario pulsa "Reset" y a continuación refresca la página
- **THEN** la aplicación sigue mostrando el preset por defecto (el estado anterior no reaparece)
