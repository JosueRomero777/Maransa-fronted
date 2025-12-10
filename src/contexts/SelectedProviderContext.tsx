import { createContext, useContext, useState, ReactNode } from 'react'

export type SelectedProvider = {
  id: number
  name: string
  type?: string
  location?: string
  capacity?: number
  contact_whatsapp?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  active?: boolean
} | null

type ContextValue = {
  selected: SelectedProvider
  setSelected: (p: SelectedProvider) => void
}

const SelectedContext = createContext<ContextValue | undefined>(undefined)

export function SelectedProviderProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<SelectedProvider>(null)
  return <SelectedContext.Provider value={{ selected, setSelected }}>{children}</SelectedContext.Provider>
}

export function useSelectedProvider() {
  const ctx = useContext(SelectedContext)
  if (!ctx) throw new Error('useSelectedProvider must be used within SelectedProviderProvider')
  return ctx
}

export default SelectedProviderProvider
