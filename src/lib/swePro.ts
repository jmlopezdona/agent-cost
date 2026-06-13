import type { ModelMix, ProviderData, SwePro } from '../engine/types'

/**
 * Un score SWE-Pro es "aproximado" si su base no es la del proveedor (`vendor`) o su confianza
 * no es alta (D5): se marca con `≈` en la UI por mezclar bases o no estar publicado.
 */
export function isApproxScore(swePro: SwePro): boolean {
  return swePro.basis !== 'vendor' || swePro.confidence !== 'high'
}

/**
 * true si algún modelo con fracción > 0 en la mezcla tiene un score aproximado o carece de él:
 * el desempeño ponderado se marca entonces como aproximado en la tarjeta (D5, task 3.2).
 */
export function mixHasApproxScore(mix: ModelMix, provider: ProviderData): boolean {
  return Object.keys(provider.models).some((key) => {
    if ((mix[key] ?? 0) <= 0) return false
    const swePro = provider.models[key].swePro
    return swePro === undefined || isApproxScore(swePro)
  })
}
