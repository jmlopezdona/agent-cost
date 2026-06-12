import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { StaleVersionBanner } from './components/layout/StaleVersionBanner'
import { TokenRatesSection } from './components/controls/TokenRatesSection'
import { ModelMixSection } from './components/controls/ModelMixSection'
import { ScheduleSection } from './components/controls/ScheduleSection'
import { MetricCards } from './components/results/MetricCards'
import { CategoryDonut } from './components/charts/CategoryDonut'
import { CeilingVsWeightedChart } from './components/charts/CeilingVsWeightedChart'
import { SalaryComparison } from './components/salary/SalaryComparison'

/**
 * Layout (§10): escritorio = controles (~40%) | resultados (~60%);
 * móvil apilado: presets → métricas → controles → gráficos → comparativa.
 */
function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <StaleVersionBanner />
      <Header />
      <main className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:items-start">
        <div className="order-1 lg:col-span-3 lg:col-start-3 lg:row-start-1">
          <MetricCards />
        </div>
        <div className="order-2 flex flex-col gap-6 lg:col-span-2 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <TokenRatesSection />
          <ModelMixSection />
          <ScheduleSection />
        </div>
        <div className="order-3 flex flex-col gap-6 lg:col-span-3 lg:col-start-3 lg:row-start-2">
          <CategoryDonut />
          <CeilingVsWeightedChart />
        </div>
        <div className="order-4 lg:col-span-3 lg:col-start-3 lg:row-start-3">
          <SalaryComparison />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
