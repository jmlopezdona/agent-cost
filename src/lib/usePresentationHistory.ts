import { useEffect } from 'react'
import { useScenarioStore } from '../store/useScenarioStore'

/**
 * En modo presentación captura el botón "atrás" del navegador para volver a la
 * calculadora en vez de abandonar la página. Al entrar empuja una entrada de
 * historial (misma URL); "atrás" dispara `popstate` y sale del modo. Si se sale
 * con el botón de la cabecera, la limpieza retira la entrada empujada con
 * `history.back()` para no dejar una entrada colgando en el historial.
 */
export function usePresentationHistory() {
  const presentation = useScenarioStore((s) => s.presentation)

  useEffect(() => {
    if (typeof window === 'undefined' || !presentation) return

    window.history.pushState({ acPresentation: true }, '')

    const onPop = () => {
      // "Atrás" estando en presentación: vuelve a la calculadora
      if (useScenarioStore.getState().presentation) {
        useScenarioStore.getState().togglePresentation()
      }
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      // Salida por el botón (no por "atrás"): la entrada empujada sigue siendo la
      // actual, así que la retiramos; si se salió con "atrás" ya no lo es y se omite.
      if (window.history.state?.acPresentation) {
        window.history.back()
      }
    }
  }, [presentation])
}
