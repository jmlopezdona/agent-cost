import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { StaleVersionBanner } from './components/layout/StaleVersionBanner'
import { PresentationScenario } from './components/layout/PresentationScenario'
import { ConfigAccordion } from './components/layout/ConfigAccordion'
import { MetricCards } from './components/results/MetricCards'
import { ModifierBadges } from './components/results/ModifierBadges'
import { PresetLearnings } from './components/results/PresetLearnings'
import { ChartTabs } from './components/charts/ChartTabs'
import { SalaryChart } from './components/charts/SalaryChart'
import { SalaryComparison } from './components/salary/SalaryComparison'
import { useScenarioStore } from './store/useScenarioStore'

/**
 * Layout (§10): escritorio = controles (~40%) | resultados (~60%);
 * móvil apilado: presets → métricas → controles → gráficos → comparativa.
 * Modo presentación (RF-10): oculta los controles y amplía métricas y gráficos.
 */
function App() {
  const presentation = useScenarioStore((s) => s.presentation)

  if (presentation) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <StaleVersionBanner />
        <Header />
        <main className="mt-6 flex flex-col gap-6">
          <PresentationScenario />
          <ModifierBadges />
          <MetricCards large />
          <SalaryComparison />
          <SalaryChart />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <StaleVersionBanner />
      <Header />
      <main className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:items-start">
        <div className="order-1 flex flex-col gap-3 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <PresetLearnings />
          <ModifierBadges />
          <MetricCards />
        </div>
        <div className="order-2 lg:col-span-2 lg:col-start-1 lg:row-start-2">
          <ConfigAccordion />
        </div>
        <div className="order-3 flex flex-col gap-6 lg:col-span-3 lg:col-start-3 lg:row-start-2">
          <SalaryChart />
          <ChartTabs />
        </div>
        <div className="order-4 lg:col-span-5 lg:col-start-1 lg:row-start-3">
          <SalaryComparison />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
