# Tasks — AgentCost MVP (Fase 1)

## 1. Setup del proyecto

- [x] 1.1 Inicializar repo git y scaffold Vite + React + TypeScript (`npm create vite`), con `base` configurada para GitHub Pages
- [x] 1.2 Añadir Tailwind CSS v4 con design tokens como CSS variables y soporte de clase `dark`
- [x] 1.3 Configurar ESLint + Prettier y scripts npm (`lint`, `typecheck`, `test`, `build`)
- [x] 1.4 Añadir Vitest (entorno Node para engine) y Zustand

## 2. Datos

- [x] 2.1 Crear `src/data/pricing.json` con `version`, `effective_date` y precios de los 4 modelos (PRD RF-03)
- [x] 2.2 Crear `src/data/presets.json` con P1, P2 y P4 completos (valores PRD §8, nombre y descripción)
- [x] 2.3 Crear `src/data/salaries.json` con los 4 perfiles, fuente, rango y `last_reviewed` (PRD §9)
- [x] 2.4 Crear tipos TS y type guards de validación de los tres JSON en arranque

## 3. Motor de cálculo

- [x] 3.1 Implementar `src/engine/types.ts` y `src/engine/engine.ts`: tarifa por hora por modelo, blend, horas programadas (52/12), techo/ponderado mensual y anual, con hooks neutros para batch/recargo (Fase 2)
- [x] 3.2 Implementar desglose por categoría de token (USD/h y % del blend) y desglose por modelo
- [x] 3.3 Implementar `src/engine/salary.ts`: coste empresa por perfil, conversión USD→EUR, equivalencia FTE, ratio de horas y €/h
- [x] 3.4 Tests dorados en Vitest: caso de referencia P2 (blend ≈ 13,8 $/h, techo ≈ 10.060 $, ponderado ≈ 6.040 $, tolerancia < 1%), mix 100% un modelo, categorías a cero, escalado por nº de agentes, suma del desglose = blend, casos P1 y P4
- [x] 3.5 Implementar `src/lib/format.ts` con `Intl.NumberFormat('es-ES')` (enteros mensual/anual, 1 decimal $/h) con tests

## 4. Estado y sincronización con URL

- [x] 4.1 Crear `src/store/useScenarioStore.ts` (Zustand): escenario completo, preset activo, flag personalizado, acciones de carga de preset y mutación de parámetros con clamping de mezcla (Haiku = resto)
- [x] 4.2 Implementar `src/store/urlSync.ts`: serialización compacta con claves cortas + `pv`, solo diffs frente al preset base, escritura con `replaceState`
- [x] 4.3 Implementar deserialización al arranque con prioridad URL > preset por defecto (P2), fallback por parámetro inválido y aviso si `pv` difiere de la versión actual
- [x] 4.4 Tests unitarios de round-trip de serialización (escenario → URL → escenario idéntico)

## 5. Componentes de controles

- [x] 5.1 Componente `SliderInput` reutilizable (slider + input numérico sincronizados, clamping a rango, label accesible)
- [x] 5.2 Sección "Tasa de tokens E/S": 4 controles con coste/h y % por categoría junto a cada uno, y tooltip/popover de ayuda con ejemplo
- [x] 5.3 Sección "Mezcla de modelos": 3 sliders + Haiku como resto con clamping bidireccional, tarifas $/h por modelo y del blend visibles
- [x] 5.4 Sección "Régimen y utilización": sliders (h/día, días/semana, duty, agentes), botones 24x7/12x5/8x5, línea de contexto de horas y guía de duty cycle

## 6. Presets y cabecera

- [x] 6.1 Selector de presets en cabecera (cards con nombre + 1 línea) que carga todos los parámetros y muestra la descripción
- [x] 6.2 Estado "Personalizado (basado en …)" al modificar cualquier parámetro, con restauración al reseleccionar el preset
- [x] 6.3 Botón "Copiar enlace del escenario" con confirmación visual

## 7. Resultados y visualizaciones

- [x] 7.1 Tarjetas de métricas: blend $/h, techo mensual, ponderado mensual (héroe), ponderado anual, formateadas
- [x] 7.2 Integrar Chart.js con registro selectivo de componentes y colores desde CSS variables del tema
- [x] 7.3 Gráfico donut/barras apiladas del desglose por categoría de token con leyenda (valor + %) y alternativa textual accesible
- [x] 7.4 Gráfico de barras techo vs. ponderado mensual

## 8. Comparativa salarial

- [x] 8.1 Tabla de perfiles con brutos editables en sesión, coste empresa, €/mes y €/h efectiva
- [x] 8.2 Control de tipo de cambio USD→EUR siempre visible junto al resultado en EUR
- [x] 8.3 Salidas de comparativa: equivalencia FTE por perfil, ratio de horas (vs. ~143 h/mes) y €/h agente vs. perfiles
- [x] 8.4 Gráfico de barras horizontales (agente + 4 perfiles, EUR) con señal secundaria además del color
- [x] 8.5 Disclaimer permanente visible sin scroll dentro de la sección

## 9. Layout, tema y responsive

- [x] 9.1 Layout de una página: cabecera, columna de controles (~40%) y columna de resultados (~60%); apilado en móvil (presets → métricas → controles → gráficos → comparativa)
- [x] 9.2 Modo claro/oscuro: `prefers-color-scheme` + override manual persistido en `localStorage`, aplicado también a gráficos
- [x] 9.3 Extraer todos los strings a `src/i18n/es.ts` tipado
- [x] 9.4 Pie con disclaimers, versión de precios y enlaces a fuentes
- [x] 9.5 Revisión responsive desde 360 px y operabilidad táctil de sliders

## 10. E2E, CI/CD y verificación

- [x] 10.1 Playwright humo: cargar P2 → verificar métrica de referencia; mover slider → verificar recálculo; copiar URL → abrir en contexto nuevo → resultados idénticos
- [x] 10.2 GitHub Actions `ci.yml`: lint + typecheck + vitest + build + playwright en cada push; deploy a GitHub Pages en push a `main`
- [x] 10.3 Verificar presupuesto de bundle < 250 kB gzip (visualizer) y Lighthouse Performance/Accessibility ≥ 90 en móvil
- [x] 10.4 Pasada final contra los criterios de aceptación del MVP (PRD §13): caso de referencia < 1%, URL reproducible en otro navegador, disclaimers visibles
