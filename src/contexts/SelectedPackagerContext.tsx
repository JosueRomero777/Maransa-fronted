import { createContext, useContext, useState, ReactNode } from 'react'

export type SelectedPackager = {
  id: number
  name: string
  location: string
  contact_whatsapp?: string
  contact_email?: string
  contact_phone?: string
  ruc?: string
  active: boolean
} | null

type ContextValue = {
  selected: SelectedPackager
  setSelected: (p: SelectedPackager) => void
}

const SelectedContext = createContext<ContextValue | undefined>(undefined)

export function SelectedPackagerProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<SelectedPackager>(null)
  return <SelectedContext.Provider value={{ selected, setSelected }}>{children}</SelectedContext.Provider>
}

export function useSelectedPackager() {
  const ctx = useContext(SelectedContext)
  if (!ctx) throw new Error('useSelectedPackager must be used within SelectedPackagerProvider')
  return ctx
}

export default SelectedPackagerProvider
