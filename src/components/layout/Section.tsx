import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  hint?: string
  children: ReactNode
}

export function Section({ title, hint, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-line bg-raised p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}
