import { useId, type ReactNode } from 'react'

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  /** Contenido extra junto al label (p. ej. HelpTip) */
  labelExtra?: ReactNode
  /** Línea de detalle bajo el control (p. ej. coste/h y % de la categoría) */
  detail?: ReactNode
}

/** Slider + input numérico sincronizados con clamping a rango (RF-02, 5.1) */
export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  labelExtra,
  detail,
}: SliderInputProps) {
  const id = useId()

  const commit = (raw: string) => {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    onChange(Math.min(max, Math.max(min, parsed)))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm">
          {label}
          {labelExtra}
        </label>
        <span className="flex items-center gap-1 text-sm">
          <input
            type="number"
            aria-label={label}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => commit(e.target.value)}
            className="w-20 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
          />
          {unit && <span className="text-xs whitespace-nowrap text-muted">{unit}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => commit(e.target.value)}
        className="mt-2 h-6 w-full cursor-pointer accent-(--accent)"
      />
      {detail && <p className="text-xs text-muted tabular-nums">{detail}</p>}
    </div>
  )
}
