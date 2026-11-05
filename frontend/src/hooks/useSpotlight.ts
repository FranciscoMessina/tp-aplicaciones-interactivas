import { useEffect } from 'react'

// Bloques con fondo negro que muestran el cuadriculado y el foco de luz amarillo (ver motion.css).
const SPOTLIGHT_SELECTOR = '.welcome, .section-heading, .contact-section, .information-bottom-cta, .contact-aside, .admin-sidebar, .auth-aside'

// Un único listener global: guarda la posición del mouse en --mx y --my del bloque que está bajo el puntero.
export function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let active: HTMLElement | null = null

    function clear() {
      active?.style.removeProperty('--mx')
      active?.style.removeProperty('--my')
      active = null
    }

    function move(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return
      const block = (event.target as Element).closest<HTMLElement>(SPOTLIGHT_SELECTOR)
      if (block !== active) clear()
      if (!block) return
      active = block
      const bounds = block.getBoundingClientRect()
      block.style.setProperty('--mx', `${event.clientX - bounds.left}px`)
      block.style.setProperty('--my', `${event.clientY - bounds.top}px`)
    }

    document.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', clear)
    return () => {
      document.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', clear)
      clear()
    }
  }, [])
}
