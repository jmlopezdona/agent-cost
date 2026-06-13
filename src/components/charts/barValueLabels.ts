import type { Plugin } from 'chart.js'
import { cssVar } from '../../lib/theme'

/**
 * Plugin inline (sin dependencias) que dibuja el valor sobre cada barra,
 * para que la exportación PNG y la lectura directa no dependan del tooltip (D7).
 * El color sale del token `--ink` del tema activo (regla de colores por tokens).
 */
export function barValueLabels(format: (value: number) => string): Plugin<'bar'> {
  return {
    id: 'barValueLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart
      const horizontal = chart.options.indexAxis === 'y'
      const ink = cssVar('--ink') || '#000'
      ctx.save()
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillStyle = ink
      chart.data.datasets.forEach((dataset, di) => {
        const meta = chart.getDatasetMeta(di)
        meta.data.forEach((element, i) => {
          const raw = dataset.data[i]
          if (typeof raw !== 'number') return
          const text = format(raw)
          const { x, y } = element as unknown as { x: number; y: number }
          if (horizontal) {
            const pad = 6
            const width = ctx.measureText(text).width
            ctx.textBaseline = 'middle'
            // Etiqueta a la derecha del fin de la barra; si no cabe, dentro
            if (x + pad + width <= chartArea.right) {
              ctx.textAlign = 'left'
              ctx.fillText(text, x + pad, y)
            } else {
              ctx.textAlign = 'right'
              ctx.fillText(text, x - pad, y)
            }
          } else {
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'
            ctx.fillText(text, x, y - 6)
          }
        })
      })
      ctx.restore()
    },
  }
}
