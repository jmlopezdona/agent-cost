# AgentCost

Calculadora web estática e interactiva para estimar el coste de operar agentes de IA sobre la API de Anthropic: tasa de tokens E/S por hora activa, mezcla de modelos, régimen horario y duty cycle → techo y coste ponderado mensual/anual, desglose por categoría de token y comparativa con coste empresa de perfiles humanos en España.

Documentación de producto en [`docs/PRD.md`](docs/PRD.md). Cambios gestionados con [OpenSpec](openspec/). Registro de costes reales de sesiones de agentes (para calibrar presets) en [`docs/cost-log.md`](docs/cost-log.md).

## Stack

- Vite + React 19 + TypeScript + Tailwind CSS v4
- Zustand (estado) · Chart.js (gráficos) · motor de cálculo puro en `src/engine/`
- Datos versionados en `src/data/` (`pricing.json`, `presets.json`, `salaries.json`)
- Estado completo serializado en la URL para compartir escenarios

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests unitarios (Vitest, incluye casos dorados del motor)
npm run test:e2e   # humo E2E (Playwright; requiere npx playwright install chromium)
npm run lint       # ESLint
npm run typecheck  # tsc
npm run build      # build de producción (dist/)
npm run size       # presupuesto de bundle (< 250 kB gzip)
```

## Despliegue

CI/CD con GitHub Actions (`.github/workflows/ci.yml`): lint + typecheck + tests + build + E2E en cada push; deploy automático a GitHub Pages en push a `main`. La `base` de Vite está configurada para servirse bajo `/agent-cost/`.
