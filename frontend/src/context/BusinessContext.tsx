import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchBusinessInfo } from '../services/businessInfo'
import { BusinessContext } from './business-context'

// El nombre de la tienda sale de la base: se pide una vez y lo comparten el sitio y el panel.
export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchBusinessInfo(controller.signal)
      .then((info) => setBusinessName(info.name))
      .catch(() => { /* sin datos cargados, la marca se muestra solo con el logo */ })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (businessName) document.title = businessName
  }, [businessName])

  return <BusinessContext.Provider value={{ businessName, setBusinessName }}>{children}</BusinessContext.Provider>
}
