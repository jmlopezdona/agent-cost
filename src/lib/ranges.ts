export interface Range {
  min: number
  max: number
}

/** Rangos de los controles (RF-02, RF-04); también validan parámetros de URL */
export const RANGES = {
  inputK: { min: 0, max: 500 },
  outputK: { min: 0, max: 1000 },
  cacheReadM: { min: 0, max: 100 },
  cacheWriteK: { min: 0, max: 2000 },
  hoursPerDay: { min: 1, max: 24 },
  daysPerWeek: { min: 1, max: 7 },
  /** Fracción */
  dutyCycle: { min: 0.1, max: 1 },
  agents: { min: 1, max: 100 },
  mix: { min: 0, max: 1 },
  fx: { min: 0.1, max: 10 },
} as const satisfies Record<string, Range>

export function clamp(value: number, range: Range): number {
  return Math.min(range.max, Math.max(range.min, value))
}
