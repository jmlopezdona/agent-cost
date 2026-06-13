import { salaryData } from '../data'
import {
  agentEurPerActiveHour,
  employerCost,
  eurToUsd,
  fteEquivalence,
  usdToEur,
  type EmployerCost,
  type SalaryConfig,
} from '../engine/salary'
import { useResults } from './useResults'
import { useScenarioStore } from '../store/useScenarioStore'

export interface SalaryRow {
  profile: (typeof salaryData.profiles)[number]
  gross: number
  cost: EmployerCost
  fte: number
}

/**
 * Derivación compartida de la comparativa salarial (motor puro + escenario),
 * consumida por la tabla editable (`SalaryComparison`) y por el gráfico de barras
 * (`SalaryChart`) para que ambos partan de los mismos números sin duplicar cálculo.
 */
export function useSalary() {
  const fx = useScenarioStore((s) => s.fx)
  const currency = useScenarioStore((s) => s.currency)
  const profileGross = useScenarioStore((s) => s.profileGross)
  const employerMultiplier = useScenarioStore((s) => s.employerMultiplier)
  const effectiveHours = useScenarioStore((s) => s.effectiveHours)
  const results = useResults()

  const config: SalaryConfig = {
    employerCostMultiplier: employerMultiplier,
    effectiveHoursPerYear: effectiveHours,
  }

  // Coste del agente: USD nativo → moneda activa. Nóminas: EUR nativo → moneda activa (D3).
  const agentToDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)
  const eurToDisplay = (eur: number) => (currency === 'usd' ? eurToUsd(eur, fx) : eur)

  // Base EUR para las equivalencias FTE (ratio independiente de la moneda mostrada)
  const agentMonthlyEUR = usdToEur(results.weightedMonthlyUSD, fx)
  const agentMonthlyDisplay = agentToDisplay(results.weightedMonthlyUSD)
  const agentPerHourDisplay = agentEurPerActiveHour(agentMonthlyDisplay, results.activeHoursMonth)

  const rows: SalaryRow[] = salaryData.profiles.map((profile) => {
    const gross = profileGross[profile.id] ?? profile.grossAnnualEUR
    const cost = employerCost(gross, config)
    return { profile, gross, cost, fte: fteEquivalence(agentMonthlyEUR, cost.monthlyEUR) }
  })

  return {
    rows,
    config,
    currency,
    fx,
    activeHoursMonth: results.activeHoursMonth,
    agentMonthlyDisplay,
    agentPerHourDisplay,
    agentToDisplay,
    eurToDisplay,
  }
}
