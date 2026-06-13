## ADDED Requirements

### Requirement: Tres idiomas seleccionables con forma canónica única

La aplicación DEBE ofrecer tres idiomas de interfaz —español (`es`), inglés (`en`) y francés (`fr`)— donde el español es el locale canónico cuya tabla de strings define la **forma de referencia**. Las tablas de inglés y francés DEBEN tener exactamente el mismo conjunto de claves anidadas y las mismas firmas de función que la tabla española; una clave ausente, sobrante o con firma divergente DEBE impedir la compilación (`typecheck`). Ningún string de UI DEBE quedar fuera de las tablas de i18n.

#### Scenario: Paridad de claves entre los tres idiomas

- **WHEN** se compila el proyecto con `npm run typecheck`
- **THEN** las tablas `en` y `fr` satisfacen el tipo canónico derivado de `es` y cualquier divergencia de claves o firmas produce un error de tipo

#### Scenario: Cobertura completa de la UI

- **WHEN** se muestra cualquier pantalla en `en` o `fr`
- **THEN** todos los textos de interfaz (cabecera, controles, ayudas, resultados, gráficos, comparativa y exportación) aparecen en el idioma activo, sin literales en español residuales en los componentes

### Requirement: Selector de idioma en la cabecera

La cabecera DEBE ofrecer un selector de idioma con las tres opciones (Español/English/Français) junto a los controles de tema y moneda. Sus etiquetas DEBEN mostrarse como endónimos fijos, no traducidos. El control DEBE ser accesible (etiqueta y estado de selección expuestos a tecnología asistiva).

#### Scenario: Cambio de idioma desde el selector

- **WHEN** el usuario selecciona "English" en el selector de idioma estando en español
- **THEN** toda la interfaz pasa a inglés de forma inmediata y el selector refleja "English" como opción activa

### Requirement: Resolución reactiva del idioma activo

El idioma activo DEBE resolverse desde un único punto de verdad (store de idioma) y consumirse en los componentes mediante un hook, de modo que cambiar de idioma actualice toda la página de forma reactiva sin recargar y sin pasar por estados de carga asíncronos. El idioma DEBE ser ortogonal al escenario: cambiarlo no altera ningún valor del escenario ni los resultados numéricos.

#### Scenario: Cambio de idioma no altera el escenario

- **WHEN** el usuario tiene el preset P2 activo y cambia de español a francés
- **THEN** los textos pasan a francés mientras los valores del escenario y todas las cifras calculadas permanecen idénticos (solo cambia su formateo de locale)

#### Scenario: Cambio reactivo sin recarga

- **WHEN** el usuario cambia el idioma con un resultado visible en pantalla
- **THEN** las etiquetas, ayudas y textos se reemplazan al instante sin recargar la página ni perder el estado actual

### Requirement: Idioma inicial autodetectado con fallback inglés

En la primera carga sin preferencia de idioma guardada, la aplicación DEBE resolver el idioma inicial en este orden de precedencia: (1) el idioma persistido en `localStorage` si es válido; (2) si no hay preferencia guardada, el idioma del navegador (`navigator.language`) cuando empiece por `es`, `fr` o `en`; (3) si no coincide ninguno, **inglés** como fallback. Una elección explícita del usuario DEBE persistir y prevalecer sobre la autodetección en cargas posteriores.

#### Scenario: Navegador en un idioma soportado

- **WHEN** un usuario sin preferencia guardada abre la app con el navegador configurado en francés
- **THEN** la interfaz arranca en francés

#### Scenario: Navegador en un idioma no soportado

- **WHEN** un usuario sin preferencia guardada abre la app con el navegador en alemán
- **THEN** la interfaz arranca en inglés (fallback)

#### Scenario: La elección guardada prevalece sobre el navegador

- **WHEN** el usuario eligió español explícitamente en una visita anterior y vuelve con el navegador en inglés
- **THEN** la interfaz arranca en español, respetando la preferencia guardada

### Requirement: Persistencia local del idioma y atributo de idioma del documento

El idioma seleccionado DEBE persistirse en `localStorage` (clave propia), aplicarse antes del primer paint para evitar un cambio visible de idioma tras la carga, y reflejarse en el atributo `lang` de `<html>`. El idioma **NO DEBE** serializarse en la URL del escenario ni en su `sessionStorage`: es una preferencia del visor, de modo que un enlace compartido se abre en el idioma del receptor, no del emisor.

#### Scenario: Persistencia entre sesiones

- **WHEN** el usuario selecciona francés y más tarde vuelve a abrir la aplicación
- **THEN** la aplicación arranca en francés sin parpadeo de otro idioma y `<html lang="fr">`

#### Scenario: El idioma no contamina el enlace compartido

- **WHEN** un usuario en inglés copia el enlace del escenario y otro usuario en español lo abre
- **THEN** el receptor ve el mismo escenario pero con la interfaz en su propio idioma (español), y la URL no contiene ningún parámetro de idioma

### Requirement: Prosa de presets y salarios resuelta desde i18n por id

Los textos humanos de los presets (`name`, `description`, `learnings`) y de los perfiles salariales (nombres de rol y atribución de fuente mostrada al usuario) DEBEN resolverse desde las tablas de i18n, indexados por el id del preset o del rol, y no como literales en `presets.json` / `salaries.json`. Para cada id existente en los datos numéricos DEBE existir su prosa en los tres idiomas.

#### Scenario: Descripción del preset en el idioma activo

- **WHEN** el escenario activo es P2 y el idioma es inglés
- **THEN** el nombre, la descripción y los learnings de P2 se muestran en inglés, resueltos por el id `p2` desde la tabla `en`

#### Scenario: Cobertura de prosa para todos los ids

- **WHEN** se valida la app al arrancar
- **THEN** para cada id de preset y de rol salarial presente en los datos existe su prosa en `es`, `en` y `fr`, y falta una de ellas se detecta como error
