import { createContext, useContext } from 'react'

export interface BusinessContextValue {
  // Nombre del comercio cargado en "Información del comercio". Vacío mientras carga o si todavía no se cargó.
  businessName: string
  setBusinessName: (name: string) => void
}

export const BusinessContext = createContext<BusinessContextValue | null>(null)

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) throw new Error('useBusiness necesita BusinessProvider')
  return context
}
