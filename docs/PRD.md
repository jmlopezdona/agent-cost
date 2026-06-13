# PRD — AgentCost: Calculadora web de costes de agentes de IA

| Campo | Valor |
|---|---|
| Versión | 1.0 |
| Fecha | 12 de junio de 2026 |
| Estado | Approved |
| Stakeholders | Equipo de plataforma agent-first, preventa/comercial, dirección |

---

## 1. Resumen ejecutivo

AgentCost es una página web estática e interactiva que permite estimar el coste de operar agentes de IA para las distintas actividades del ciclo de desarrollo de software —desde el diseño y la planificación hasta la implementación, las pruebas, la revisión de código y el mantenimiento— sobre la API de Anthropic. El usuario configura la **tasa de tokens E/S por hora activa**, la **mezcla de modelos** (Fable/Opus/Sonnet/Haiku), el **régimen horario** y el **duty cycle**, y obtiene el coste **máximo teórico (techo)** y el **coste ponderado realista**, junto con una **comparativa con costes salariales de perfiles humanos en España**.

El objetivo es doble: (a) herramienta interna de dimensionamiento y FinOps para la plataforma agent-first, y (b) artefacto de comunicación para presentaciones internas y conversaciones con clientes sobre el business case de los agentes.

---

## 2. Contexto y problema

- Los costes de agentes de IA se facturan por token, con cuatro categorías de precio distintas (input fresco, output, cache read, cache write) y cuatro tiers de modelo. Estimar un presupuesto mensual a partir del rate card es poco intuitivo.
- La experiencia real muestra que el coste dominante no es la elección del modelo sino el **volumen de cache read** (tamaño de contexto), algo invisible en una conversación basada solo en $/MTok.
- Las decisiones de negocio (¿agente 24x7 o 8x5?, ¿cuántos agentes?, ¿qué mezcla de modelos?) requieren comparar contra la alternativa natural: el **coste empresa de un perfil humano** equivalente en España.
- Hoy estos cálculos se hacen ad hoc en hojas de cálculo no compartibles ni reproducibles.

---

## 3. Objetivos y métricas de éxito

### Objetivos

1. Permitir estimar el coste mensual y anual de N agentes en menos de 60 segundos partiendo de un preset.
2. Hacer visible el desglose de coste por categoría de token para orientar la optimización (ingeniería de contexto, batch, mezcla).
3. Contextualizar el coste del agente frente al coste empresa de perfiles humanos (junior → tech lead) en España.
4. Generar escenarios compartibles por URL para presentaciones y discusiones asíncronas.

### Métricas de éxito (post-lanzamiento interno)

- ≥ 80% de las estimaciones de coste de agentes del equipo se hacen con la herramienta (vs. hojas ad hoc).
- Tiempo medio hasta primer resultado < 60 s (preset + 1-2 ajustes).
- ≥ 5 escenarios compartidos por URL en presentaciones internas en el primer trimestre.
- 0 incidencias de cálculo erróneo reportadas tras la batería de tests de aceptación.

---

## 4. Usuarios y casos de uso

| Usuario | Caso de uso principal |
|---|---|
| Ingeniero de plataforma / harness | Dimensionar budget caps y rate limits (LiteLLM/agentgateway) a partir del techo teórico; evaluar el impacto de optimizaciones de contexto |
| Responsable de adopción IA / preventa | Construir el business case agente vs. FTE para clientes y dirección, con presets descritos en lenguaje de negocio |
| Dirección / finanzas | Validar presupuestos mensuales/anuales y sensibilidad a supuestos (duty cycle, mezcla) |
| Equipo de delivery | Estimar el coste de incorporar agentes a un proyecto concreto (régimen 8x5, supervisado) |

---

## 5. Alcance

### Incluido (v1)

- Calculadora interactiva client-side con todas las entradas y salidas descritas en RF-01…RF-04.
- 6 presets de escenarios realistas con descripción (RF-05).
- Comparativa salarial España con 4 perfiles editables (RF-06).
- Desglose de coste por categoría de token y por modelo, con visualizaciones (RF-07).
- Modificadores de precio: Batch API, recargo Bedrock/regional, tipo de cambio EUR/USD (RF-08).
- Estado serializado en URL para compartir (RF-09).
- Diseño responsive con modo claro/oscuro.

### Excluido (v1)

- Backend, autenticación o persistencia en servidor (la app es 100% estática).
- Conexión en vivo a APIs de precios o a facturación real (Anthropic Admin API / Cost API) — candidato a v2.
- Modelos de otros proveedores (OpenAI, Google) — candidato a v2 mediante tabla de precios extensible.
- Cálculo fiscal fino de nómina (IRPF por comunidad, pluses); se usa un multiplicador de coste empresa configurable.
- Modelado de coste de infraestructura propia (tier self-hosted tipo Kimi-Dev en Spot) — candidato a v1.1 como "modelo personalizado" con precio editable.

---

## 6. Requisitos funcionales

### RF-01 — Motor de cálculo

El motor implementa exactamente las siguientes fórmulas (todas las tarifas en USD por millón de tokens, MTok):

```
tarifa_hora(modelo) = (input_k / 1000)  × P[modelo].input
                    + (output_k / 1000) × P[modelo].output
                    + cache_read_M      × P[modelo].cache_read
                    + (cache_write_k / 1000) × P[modelo].cache_write

blend_hora = Σ (mix_modelo × tarifa_hora(modelo))        // mix en fracción, Σ mix = 1

horas_mes_programadas = horas_dia × dias_semana × (52 / 12)

techo_mensual    = blend_hora × horas_mes_programadas × n_agentes
ponderado_mensual = techo_mensual × duty_cycle           // duty en fracción
ponderado_anual   = ponderado_mensual × 12
```

Criterios:

- **CA-01.1** Todos los resultados mostrados se redondean para presentación (enteros para mensual/anual, 1 decimal para $/h), pero el cálculo interno mantiene precisión completa.
- **CA-01.2** El recálculo es reactivo (< 16 ms) ante cualquier cambio de input; no hay botón "calcular".
- **CA-01.3** Con los valores por defecto del preset P2 el resultado debe coincidir con el caso de referencia validado (ver §8) con tolerancia < 1%.

### RF-02 — Entradas: tasa de tokens E/S por hora activa

Cuatro controles deslizantes con entrada numérica directa asociada (input + slider sincronizados):

| Parámetro | Unidad | Rango | Default (P2) | Notas |
|---|---|---|---|---|
| Input fresco | k tokens/h | 0 – 500 | 42 | Tokens no cacheados |
| Output | k tokens/h | 0 – 1.000 | 210 | Incluye thinking/razonamiento |
| Cache read | M tokens/h | 0 – 100 | 30 | Partida típicamente dominante |
| Cache write | k tokens/h | 0 – 2.000 | 530 | Escrituras de caché (5 min, 1,25×) |

- **CA-02.1** Junto a cada control se muestra el coste/hora que esa categoría aporta al blend actual y su porcentaje del total, para que el usuario vea qué palanca domina.
- **CA-02.2** Un texto de ayuda contextual (tooltip o popover) explica cada categoría con un ejemplo ("30M de cache read/h ≈ contexto medio de ~150k tokens releído en ~200 llamadas/hora").

### RF-03 — Mezcla de modelos

- Cuatro modelos en v1: Fable 5, Opus 4.8, Sonnet 4.6, Haiku 4.5. Tres sliders (Fable, Opus, Sonnet) y el cuarto (Haiku) calculado como resto; restricción Σ = 100% con clamping bidireccional.
- **CA-03.1** Se muestra la tarifa $/hora activa resultante por modelo y la del blend.
- **CA-03.2** La tabla de precios por modelo es visible y editable en un panel de "Configuración avanzada" (ver RF-08), con botón de restaurar valores oficiales.

Precios por defecto (API estándar, junio 2026, USD/MTok):

| Modelo | Input | Output | Cache read | Cache write (5 min) |
|---|---|---|---|---|
| Claude Fable 5 | 10,00 | 50,00 | 1,00 | 12,50 |
| Claude Opus 4.8 | 5,00 | 25,00 | 0,50 | 6,25 |
| Claude Sonnet 4.6 | 3,00 | 15,00 | 0,30 | 3,75 |
| Claude Haiku 4.5 | 1,00 | 5,00 | 0,10 | 1,25 |

### RF-04 — Régimen y utilización

- Sliders: horas/día (1–24), días/semana (1–7), duty cycle (10–100%), nº de agentes (1–100).
- Botones de preset de régimen: `24x7`, `12x5`, `8x5`.
- **CA-04.1** Se muestra siempre la línea de contexto: "X h/mes programadas por agente · Y h activas con duty Z%".
- **CA-04.2** Guía de duty cycle integrada (texto corto): supervisado con humano en el loop ≈ 30–40%; agente en CI con esperas de build/test ≈ 50–65%; autónomo sin aprobaciones ≈ 75–85%.

### RF-05 — Presets de escenarios

Selector visible en cabecera (cards o dropdown con descripción). Al seleccionar un preset se cargan **todos** los parámetros (tokens, mezcla, régimen, duty, nº agentes) y se muestra su descripción. Cualquier cambio manual posterior marca el estado como "Personalizado (basado en …)". Definición completa en §8.

- **CA-05.1** Cada preset tiene nombre, descripción de 2-3 frases en lenguaje de negocio y valores completos.
- **CA-05.2** Los presets viven en un fichero de datos (`presets.json`) separado del código, para poder añadir o ajustar escenarios sin tocar la lógica.

### RF-06 — Comparativa salarial España

Panel que traduce el coste ponderado del escenario a equivalencias humanas:

- Tabla de perfiles editable (valores por defecto en §9): bruto anual → coste empresa (multiplicador configurable, default 1,30 por cotizaciones a cargo del empleador) → coste mensual y coste por hora efectiva.
- Conversión de divisa: el coste del agente se calcula en USD (precios API) y se convierte a EUR con un tipo de cambio configurable (default editable, mostrado siempre junto al resultado).
- Salidas de la comparativa:
  1. **Equivalencia en FTE**: `coste_agente_mensual_EUR / coste_empresa_mensual(perfil)` para cada perfil (ej.: "este escenario ≈ 1,4× un mid o 0,9× un senior").
  2. **Comparativa de horas**: horas activas mensuales del agente vs. ~143 h efectivas/mes de un FTE (1.720 h/año efectivas, configurable), expresada como ratio.
  3. **Coste por hora de trabajo**: €/h activa del agente vs. €/h efectiva de cada perfil.
- **CA-06.1** Visualización de barras horizontales: coste mensual del escenario de agentes junto a las barras de coste empresa mensual de los 4 perfiles.
- **CA-06.2** Disclaimer permanente y visible: los salarios son orientativos (medias nacionales, sin premium de ciudad ni variable), el multiplicador de coste empresa es una aproximación, y la comparativa no implica equivalencia de capacidades ni sustituibilidad — es una referencia de orden de magnitud para business cases.
- **CA-06.3** Los datos salariales viven en `salaries.json` con campo de fuente y fecha, editables desde la UI (sesión) y desde el fichero (permanente).

### RF-07 — Desglose y visualizaciones

1. **Donut/barras apiladas — desglose por categoría de token** del coste por hora activa (cache read / output / cache write / input). Es la visualización clave para orientar optimización.
2. **Barras — coste mensual techo vs. ponderado**, lado a lado.
3. **Barras horizontales — comparativa con perfiles humanos** (RF-06).
4. **Tarjetas de métricas**: blend $/h, techo mensual, ponderado mensual (destacado), ponderado anual.
- **CA-07.1** Todas las visualizaciones se actualizan reactivamente y respetan modo claro/oscuro.
- **CA-07.2** Cada serie de datos se distingue por color más una señal secundaria (patrón/forma), no solo color (accesibilidad).

### RF-08 — Configuración avanzada y modificadores de precio

Panel colapsable con:

- Tabla de precios editable por modelo y categoría (con "restaurar oficiales").
- Toggle **Batch API (−50%)** con slider de "% del trabajo elegible para batch" (0–100%, aplica el descuento solo a esa fracción del coste).
- Toggle **Recargo regional/Bedrock (+10%)** aplicado a todas las categorías.
- Tipo de cambio **USD→EUR** editable.
- Multiplicador de **coste empresa** (default 1,30) y **horas efectivas anuales** del FTE (default 1.720).
- **CA-08.1** Cuando un modificador está activo, aparece un badge junto a los resultados ("batch 40% aplicado", "Bedrock +10%").

### RF-09 — Compartir y exportar

- **Estado en URL**: todos los parámetros serializados en query params (o hash) de forma compacta; abrir el enlace reproduce el escenario exacto. Sin backend.
- Botón "Copiar enlace del escenario".
- **Exportación**: descarga del escenario como CSV/JSON (parámetros + resultados) y de cada gráfico como PNG.
- **CA-09.1** Un escenario restaurado por URL produce resultados idénticos bit a bit a los del momento de compartir (mismos precios por defecto versionados; si la tabla de precios embebida cambia entre versiones, la URL incluye la versión de precios usada y la app avisa si difiere de la actual).

### RF-10 — Modo presentación

- Vista limpia activable que oculta los controles y muestra solo: nombre y descripción del preset/escenario, tarjetas de métricas y las 3 visualizaciones, con tipografía ampliada. Pensada para proyectar en reuniones.
- **CA-10.1** Conmutable con un clic y vía parámetro de URL (`&present=1`).

---

## 7. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| Arquitectura | 100% estática, sin backend ni base de datos; desplegable en GitHub Pages / S3+CloudFront |
| Rendimiento | First load < 1,5 s en conexión 4G; recálculo < 16 ms; bundle < 250 kB gzip |
| Privacidad | Ningún dato del usuario sale del navegador; sin cookies de terceros; analítica opcional y anónima (v1.1) |
| Accesibilidad | WCAG 2.1 AA: navegación por teclado completa, labels en todos los controles, contraste suficiente, alternativas textuales a los gráficos |
| Responsive | Usable desde 360 px (móvil) hasta escritorio; los sliders deben ser operables en táctil |
| Tema | Modo claro/oscuro automático según preferencia del sistema, con override manual |
| i18n | v1 en español; arquitectura de strings preparada para EN (v1.1) |
| Navegadores | Últimas 2 versiones de Chrome, Edge, Firefox, Safari |
| Mantenibilidad | Precios, presets y salarios en ficheros JSON versionados, separados de la lógica |

---

## 8. Presets de escenarios (especificación de datos)

Caso de referencia para validación (CA-01.3): el preset P2 (régimen 12×5, duty 60%) con los precios por defecto debe producir blend ≈ $13,8/h activa, techo ≈ $3.585/mes y ponderado ≈ $2.151/mes (1 agente). El blend depende solo de la mezcla y los precios; techo y ponderado se derivan del horario (260 h/mes) y el duty.

| # | Preset | Descripción (mostrada al usuario) | In (k/h) | Out (k/h) | CR (M/h) | CW (k/h) | Fable/Opus/Sonnet/Haiku | Régimen | Duty | Agentes |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Pair programming supervisado | Un desarrollador trabaja con un agente tipo Claude Code en sesión interactiva. El humano revisa y aprueba; el agente pasa la mayor parte del tiempo esperando. Perfil de tokens representativo de una sesión interactiva de desarrollo. | 42 | 210 | 30 | 530 | 0/0/80/20 | 8×5 | 30% | 1 |
| P2 | Agente de delivery balanceado | Agente integrado en el flujo de un equipo: Opus planifica la feature y revisa el PR final, Sonnet implementa, Haiku ejecuta el ciclo de tests/lint. Acompaña al equipo en jornada laboral atendiendo una cola de tareas con esperas de build y CI. | 42 | 210 | 30 | 530 | 0/15/65/20 | 12×5 | 60% | 1 |
| P3 | Diseño intensivo / greenfield | Arranque de producto o arquitectura compleja: el modelo frontera (Fable) y Opus llevan el peso del diseño, los ADRs y la revisión profunda; Sonnet prototipa. Output alto por documentos y razonamiento extenso. Jornada laboral con supervisión frecuente. | 50 | 280 | 25 | 600 | 20/40/35/5 | 8×5 | 50% | 1 |
| P4 | Evolutivos sobre código maduro | Mantenimiento y evolutivos sobre código maduro: Sonnet resuelve la mayoría de tareas y Opus solo entra como escalación cuando el agente se atasca. Haiku absorbe el trabajo trivial. Alta autonomía. | 42 | 190 | 28 | 500 | 0/5/55/40 | 24×7 | 70% | 1 |
| P5 | Enjambre QA nocturno | Flota de agentes de testing (personas sintéticas, regresión E2E, evals y análisis de vulnerabilidades) que corre fuera de horario. Mayoría Haiku-heavy en contextos cortos, con una franja del modelo frontera (Fable) para el análisis de seguridad profundo. Candidato ideal a Batch API (−50%) por no requerir latencia. | 25 | 120 | 12 | 300 | 5/0/25/70 | 12×7 | 85% | 5 |
| P6 | Agente autónomo de mantenimiento | Agente sin humano en el loop que triaja issues, actualiza dependencias y abre PRs 24×7. Duty alto al no esperar aprobaciones; contexto grande por repos extensos — el cache read domina el coste. | 45 | 220 | 50 | 600 | 0/10/70/20 | 24×7 | 80% | 1 |

Notas de implementación:

- P5 debe activar por defecto el toggle de Batch con 80% de trabajo elegible.
- Cada preset incluye en `presets.json` un campo `learnings` con 1-2 frases de "qué observar" (ej. en P6: "observa cómo el cache read concentra >70% del coste — la palanca es ingeniería de contexto, no el modelo").

---

## 9. Datos salariales España (valores por defecto, editables)

Brutos anuales medios nacionales 2026 (sin premium de ciudad; Madrid/Barcelona +18-22%). Coste empresa = bruto × multiplicador (default 1,30 por cotizaciones a cargo del empleador). Horas efectivas: 1.720 h/año (default configurable).

| Perfil | Experiencia | Bruto anual (default) | Rango de referencia | Coste empresa/año | Coste empresa/mes | Coste/h efectiva |
|---|---|---|---|---|---|---|
| Junior | 0–2 años | 25.000 € | 18.000–28.000 € | 32.500 € | 2.708 € | ~18,9 €/h |
| Mid | 2–5 años | 40.000 € | 30.000–48.000 € | 52.000 € | 4.333 € | ~30,2 €/h |
| Senior | 5+ años | 60.000 € | 48.000–80.000 € | 78.000 € | 6.500 € | ~45,3 €/h |
| Tech Lead / Arquitecto | 8+ años | 75.000 € | 65.000–90.000 € | 97.500 € | 8.125 € | ~56,7 €/h |

Fuentes orientativas (mostrar en la UI con fecha): Glassdoor España, InfoJobs Informe TIC, LinkedIn Salary Insights, INE Encuesta de Estructura Salarial. Los valores se revisan al menos una vez al año (campo `last_reviewed` en `salaries.json`).

---

## 10. Diseño UX/UI

### Layout (escritorio, una sola página)

1. **Cabecera**: título, selector de presets (cards con nombre + 1 línea), botón "Compartir" y toggle de modo presentación.
2. **Columna de controles (izquierda, ~40%)**: secciones colapsables en este orden — Tasa de tokens E/S, Mezcla de modelos, Régimen y utilización, Configuración avanzada.
3. **Columna de resultados (derecha, ~60%)**: tarjetas de métricas arriba (ponderado mensual destacado), después desglose por categoría, techo vs. ponderado, y comparativa salarial.
4. **Pie**: disclaimers, versión de precios, enlaces a fuentes.

En móvil las columnas se apilan: presets → métricas → controles → gráficos → comparativa.

### Principios

- Tono sobrio y profesional, apto para proyectar a dirección o clientes; estética plana, sin decoración.
- El "ponderado mensual" es el número héroe; el techo aparece siempre como referencia de peor caso.
- Toda cifra mostrada va formateada (separadores de miles, símbolo de divisa, decimales controlados).
- El desglose por categoría de token debe ser imposible de ignorar: es el insight diferencial de la herramienta.

---

## 11. Arquitectura técnica

| Aspecto | Decisión propuesta |
|---|---|
| Stack | SPA con Vite + React + TypeScript (alineado con el stack TS del equipo); estado con hooks/Zustand, sin router complejo |
| Gráficos | Chart.js (ligero, suficiente para barras/donut) o Recharts; decisión en spike técnico de 1 día |
| Estilos | Tailwind CSS con design tokens propios; `prefers-color-scheme` + override |
| Datos | `pricing.json` (con `version` y `effective_date`), `presets.json`, `salaries.json` en `/src/data` |
| Estado compartible | Serialización compacta de parámetros en query string (clave corta por parámetro + versión de precios) |
| Testing | Vitest para el motor de cálculo (tabla de casos dorados, incluido el caso de referencia §8); Playwright para humo E2E (cargar preset, mover slider, verificar resultado, compartir URL) |
| CI/CD | GitHub Actions: lint + test + build + deploy a GitHub Pages en cada push a `main` |
| Estructura | `src/engine/` (cálculo puro, sin DOM), `src/components/`, `src/data/`, `src/i18n/` |

El motor de cálculo se implementa como módulo puro sin dependencias de UI, de modo que pueda reutilizarse después en el dashboard de FinOps de la plataforma (EKS) o en un CLI.

---

## 12. Riesgos, supuestos y disclaimers

| Riesgo / supuesto | Mitigación |
|---|---|
| Los precios de API cambian | `pricing.json` versionado con fecha efectiva; banner si la versión tiene > 90 días; edición manual en UI |
| El perfil de tokens varía mucho entre harnesses | Los presets son puntos de partida descritos, no verdades; la UI empuja a ajustar con datos propios (`/cost` de Claude Code o métricas de LiteLLM) |
| La comparativa salarial puede malinterpretarse como "sustitución de personas" | Disclaimer explícito (CA-06.2); framing de "orden de magnitud para business case", no de equivalencia de capacidades |
| Salarios desactualizados | `salaries.json` con fuente y `last_reviewed`; revisión anual |
| Tipo de cambio USD/EUR | Siempre visible y editable junto al resultado en EUR |
| Recargo Bedrock/regional y batch alteran el resultado de forma no obvia | Badges visibles cuando hay modificadores activos (CA-08.1) |

---

## 13. Roadmap

### Fase 1 — MVP

- Motor de cálculo + tests dorados.
- Controles RF-02/03/04, presets P1, P2, P4 y métricas principales.
- Desglose por categoría de token (visualización 1) y comparativa salarial básica (tabla + barras).
- Estado en URL y deploy en GitHub Pages.

### Fase 2 — v1.0

- Presets restantes (P3, P5, P6) con `learnings`.
- Configuración avanzada completa (precios editables, batch, Bedrock, divisa, multiplicadores).
- Modo presentación, exportación CSV/PNG, accesibilidad AA, pulido responsive.

### Fase 3 — v1.1+

- Modelo personalizado / tier self-hosted con precio editable (Kimi-Dev en Spot).
- Inglés (i18n), analítica anónima opcional.
- Importación de uso real (CSV de LiteLLM o Cost API de Anthropic) para autocompletar la tasa de tokens.
- Multi-proveedor (OpenAI, Google) y comparativa entre proveedores.
- Modo "flota": varios escenarios simultáneos sumados (mezcla de P2 + P5, por ejemplo).

### Criterios de aceptación del MVP

1. El caso de referencia (§8) se reproduce con error < 1%.
2. Un usuario nuevo llega a un resultado con preset en < 60 s sin ayuda.
3. Una URL compartida reproduce el escenario exacto en otro navegador.
4. Lighthouse: Performance ≥ 90, Accessibility ≥ 90 en móvil.
5. Los disclaimers de salarios y de estimación son visibles sin scroll en la vista de comparativa.
