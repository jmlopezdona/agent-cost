interface HelpTipProps {
  label: string
  text: string
}

/** Popover de ayuda accesible por teclado (CA-02.2) */
export function HelpTip({ label, text }: HelpTipProps) {
  return (
    <details className="relative inline-block">
      <summary
        aria-label={label}
        className="flex h-4 w-4 cursor-pointer list-none items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent select-none [&::-webkit-details-marker]:hidden"
      >
        ?
      </summary>
      <div className="absolute left-1/2 z-10 mt-1 w-64 -translate-x-1/2 rounded-md border border-line bg-raised p-3 text-xs leading-relaxed text-ink shadow-lg">
        {text}
      </div>
    </details>
  )
}
