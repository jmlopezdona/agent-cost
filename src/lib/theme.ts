import { create } from 'zustand'

const STORAGE_KEY = 'agentcost-theme'

interface ThemeStore {
  /** El index.html aplica la clase `dark` antes del primer paint */
  dark: boolean
  toggle: () => void
}

export const useTheme = create<ThemeStore>((set, get) => ({
  dark: typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  toggle: () => {
    const dark = !get().dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    set({ dark })
  },
}))

/** Lee un design token CSS; las series de Chart.js salen de aquí (D8) */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
