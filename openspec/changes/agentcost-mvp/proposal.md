# AgentCost MVP (Fase 1)

## Why

Hoy las estimaciones de coste de agentes de IA sobre la API de Anthropic se hacen en hojas de cálculo ad hoc, no compartibles ni reproducibles, y ocultan el insight clave: el coste dominante suele ser el volumen de cache read, no el modelo elegido. Necesitamos una herramienta web reproducible que dé un resultado en menos de 60 segundos y sirva tanto para FinOps interno como para business cases con clientes (agente vs. coste empresa de un FTE en España).

## What Changes

Se construye desde cero la Fase 1 (MVP) del PRD de AgentCost (`docs/PRD.md`, §13):

- Nueva SPA estática (Vite + React + TypeScript + Tailwind), sin backend, desplegada en GitHub Pages.
- Motor de cálculo puro (`src/engine/`) que implementa las fórmulas de RF-01, validado con tests dorados incluyendo el caso de referencia §8 (preset P2: blend ≈ $13,8/h, techo ≈ $10.060/mes, ponderado ≈ $6.040/mes con error < 1%).
- Controles interactivos: tasa de tokens E/S por hora activa (RF-02), mezcla de modelos Fable/Opus/Sonnet/Haiku con Σ = 100% (RF-03), régimen horario y duty cycle (RF-04). Recálculo reactivo < 16 ms, sin botón "calcular".
- Presets P1 (Pair programming supervisado), P2 (Agente de delivery balanceado) y P4 (Sonnet-first con escalación) cargados desde `presets.json` (RF-05 parcial).
- Tarjetas de métricas principales (blend $/h, techo mensual, ponderado mensual destacado, ponderado anual) y desglose de coste por categoría de token con visualización (RF-07 parcial).
- Comparativa salarial España básica: tabla de 4 perfiles desde `salaries.json` y barras horizontales agente vs. coste empresa, con conversión USD→EUR y disclaimers (RF-06).
- Estado completo serializado en URL para compartir escenarios, con botón "Copiar enlace" (RF-09 parcial).
- CI/CD con GitHub Actions: lint + test + build + deploy a GitHub Pages.

Fuera de alcance en esta fase (van a Fase 2/3): presets P3/P5/P6, configuración avanzada (precios editables, batch, Bedrock), modo presentación, exportación CSV/PNG, i18n EN, pulido de accesibilidad AA completo.

## Capabilities

### New Capabilities

- `cost-engine`: motor de cálculo puro sin dependencias de UI — tarifa por hora por modelo, blend ponderado por mezcla, horas programadas mensuales, techo y ponderado mensual/anual, desglose por categoría de token y conversión de divisa. Incluye los datos de precios versionados (`pricing.json`).
- `calculator-controls`: controles de entrada reactivos — sliders sincronizados con input numérico para tasa de tokens (RF-02) con coste/hora y % por categoría, mezcla de modelos con clamping Σ = 100% (RF-03), y régimen/utilización con presets 24x7/12x5/8x5, guía de duty cycle y línea de contexto de horas (RF-04).
- `scenario-presets`: selección de escenarios predefinidos (P1, P2, P4) desde `presets.json` que cargan todos los parámetros, muestran su descripción y marcan el estado "Personalizado (basado en …)" al modificar cualquier valor.
- `results-display`: tarjetas de métricas principales con el ponderado mensual como número héroe, y desglose visual del coste por hora por categoría de token (donut/barras apiladas) que se actualiza reactivamente y respeta modo claro/oscuro.
- `salary-comparison`: comparativa con perfiles humanos en España desde `salaries.json` — coste empresa, equivalencia en FTE, ratio de horas y €/h, visualización de barras horizontales y disclaimer permanente.
- `url-sharing`: serialización compacta de todos los parámetros en la URL (con versión de precios), restauración exacta del escenario al abrir el enlace y botón "Copiar enlace del escenario".

### Modified Capabilities

(Ninguna — proyecto nuevo, no existen specs previas.)

## Impact

- **Código**: repositorio nuevo; se crea toda la estructura `src/engine/`, `src/components/`, `src/data/` (`pricing.json`, `presets.json`, `salaries.json`), `src/i18n/` (strings en ES preparados para EN).
- **Dependencias**: Vite, React, TypeScript, Tailwind CSS, Zustand (estado), librería de gráficos (Chart.js o Recharts — decisión en design), Vitest, Playwright (humo E2E), ESLint/Prettier.
- **Sistemas**: GitHub Actions (CI) y GitHub Pages (hosting estático). Sin backend ni persistencia en servidor.
- **Restricciones NFR aplicables al MVP**: bundle < 250 kB gzip, first load < 1,5 s en 4G, responsive desde 360 px, modo claro/oscuro por `prefers-color-scheme` con override.
