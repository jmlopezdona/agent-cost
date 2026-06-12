export interface SalaryProfile {
  id: string
  name: string
  experience: string
  grossAnnualEUR: number
  rangeEUR: [number, number]
}

export interface SalaryConfig {
  /** Coste empresa = bruto × multiplicador (default 1,30) */
  employerCostMultiplier: number
  /** Horas efectivas de un FTE (default 1.720 h/año) */
  effectiveHoursPerYear: number
}

export interface EmployerCost {
  annualEUR: number
  monthlyEUR: number
  perEffectiveHourEUR: number
}

export function usdToEur(usd: number, fxEurPerUsd: number): number {
  return usd * fxEurPerUsd
}

export function eurToUsd(eur: number, fxEurPerUsd: number): number {
  return fxEurPerUsd > 0 ? eur / fxEurPerUsd : 0
}

/** Coste empresa de un perfil a partir del bruto anual (RF-06) */
export function employerCost(grossAnnualEUR: number, config: SalaryConfig): EmployerCost {
  const annualEUR = grossAnnualEUR * config.employerCostMultiplier
  return {
    annualEUR,
    monthlyEUR: annualEUR / 12,
    perEffectiveHourEUR: annualEUR / config.effectiveHoursPerYear,
  }
}

/** Equivalencia en FTE: coste_agente_mensual_EUR / coste_empresa_mensual */
export function fteEquivalence(agentMonthlyEUR: number, employerMonthlyEUR: number): number {
  return employerMonthlyEUR > 0 ? agentMonthlyEUR / employerMonthlyEUR : 0
}

/** Horas efectivas mensuales de un FTE (~143 h/mes con 1.720 h/año) */
export function fteEffectiveHoursPerMonth(config: SalaryConfig): number {
  return config.effectiveHoursPerYear / 12
}

/** Ratio de horas activas mensuales del agente frente a las efectivas de un FTE */
export function hoursRatio(agentActiveHoursMonth: number, config: SalaryConfig): number {
  const fteHours = fteEffectiveHoursPerMonth(config)
  return fteHours > 0 ? agentActiveHoursMonth / fteHours : 0
}

/** €/h activa del agente */
export function agentEurPerActiveHour(
  weightedMonthlyEUR: number,
  activeHoursMonth: number,
): number {
  return activeHoursMonth > 0 ? weightedMonthlyEUR / activeHoursMonth : 0
}
