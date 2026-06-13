interface HelpTipProps {
  label: string
  text: string
}

/** Tooltip de ayuda: se muestra al pasar el ratón o enfocar con teclado (CA-02.2) */
export function HelpTip({ label, text }: HelpTipProps) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-label={label}
        className="flex h-4 w-4 cursor-help list-none items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent select-none"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 z-10 mt-1 w-64 -translate-x-1/2 rounded-md border border-line bg-raised p-3 text-xs leading-relaxed text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
