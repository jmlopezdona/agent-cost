## MODIFIED Requirements

### Requirement: Proveedor activo del escenario

La aplicación DEBE mantener un **proveedor activo** por escenario (Anthropic/Claude, OpenAI/ChatGPT o Google/Gemini) y un selector de familia visible en cabecera para cambiarlo. Un escenario usa un único proveedor: todos sus modelos, su mezcla, su perfil de tokens y sus modificadores pertenecen al proveedor activo. El proveedor por defecto DEBE ser `anthropic`. Cambiar de familia desde el selector NO DEBE cargar el preset por defecto de la familia: DEBE conservar las tasas de token compartidas (globales) y restaurar o anclar el estado por familia según el requisito "Conservación de estado al cambiar de familia".

#### Scenario: Selección de familia

- **WHEN** el usuario selecciona la familia OpenAI/ChatGPT estando en Anthropic
- **THEN** el proveedor activo pasa a `openai` y los controles de mezcla, perfil de tokens, precios y modificadores pasan a reflejar los de OpenAI, conservando las tasas de token compartidas (input/output/cache read) y anclando la mezcla, el régimen y los modificadores al preset análogo de OpenAI (o al estado memorizado si ya se había visitado)

#### Scenario: Proveedor por defecto al arrancar

- **WHEN** la aplicación arranca sin proveedor en la URL
- **THEN** el proveedor activo es `anthropic` y el escenario reproduce el comportamiento previo a multi-proveedor

## ADDED Requirements

### Requirement: Conservación de estado al cambiar de familia

Al cambiar de familia, la aplicación DEBE tratar las **tasas de token con clave compartida por las tres familias** (input fresco, output, cache read) como **globales**: describen la carga del agente y se aplican a la familia destino. Las tasas de token **propias** de una familia (cache write de Anthropic, almacenamiento de Gemini), el **régimen** (horas/día, días/semana, duty cycle, número de agentes), la **mezcla** de modelos y los **modificadores** (Batch, recargo regional, almacenamiento) DEBEN ser **por familia**. La aplicación DEBE memorizar el estado de cada familia y, al volver a una ya visitada, restaurarlo; la primera vez que se entra en una familia DEBE anclar al **preset análogo** por caso de uso (mismo número de escenario: P3↔O3↔G3), no al preset por defecto de la familia. Esta memoria es de sesión en RAM y NO DEBE serializarse en la URL ni en `sessionStorage`; solo el escenario activo se persiste y se comparte.

#### Scenario: Las tasas de token compartidas son globales entre familias

- **WHEN** el usuario ajusta la tasa de cache read en Anthropic y a continuación cambia a Google
- **THEN** la tasa de cache read de Google adopta el mismo valor; y si la edita en Google y vuelve a Anthropic, Anthropic refleja el último valor (sincronización en ambos sentidos)

#### Scenario: Régimen y mezcla por familia desde el preset análogo en la primera visita

- **WHEN** el usuario está en el preset P3 (greenfield) de Anthropic con el régimen personalizado y cambia por primera vez a OpenAI
- **THEN** el escenario se ancla a O3 (greenfield de OpenAI): la mezcla y el régimen son los de O3, mientras que las tasas de token compartidas conservan los valores globales actuales

#### Scenario: Volver a una familia ya visitada restaura su mezcla editada

- **WHEN** el usuario edita la mezcla de Gemini, cambia a ChatGPT y después vuelve a Gemini
- **THEN** la mezcla de Gemini se restaura tal como se dejó (no se resetea por el ida y vuelta), aplicando encima las tasas de token globales vigentes

#### Scenario: Estado personalizado coherente con tokens globales

- **WHEN** el usuario edita una tasa de token compartida y cambia de familia
- **THEN** la familia destino aparece marcada como "Personalizado (basado en …)" porque su perfil de carga difiere del preset base, aun cuando su mezcla y régimen sean los del preset análogo

#### Scenario: La memoria por familia no viaja en el enlace compartido

- **WHEN** el usuario configura varias familias en una sesión y comparte el enlace
- **THEN** el enlace solo contiene el escenario activo; la memoria por familia no se serializa y se reconstruye al navegar entre familias
