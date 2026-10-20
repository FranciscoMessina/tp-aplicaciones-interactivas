import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Icon from './Icon'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

// Usa el <dialog> nativo: trae el bloqueo del foco y el cierre con Escape.
export default function Modal({ title, onClose, children, wide = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' modal-wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onMouseDown={(event) => { if (event.target === ref.current) onClose() }}
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="admin-icon-button" aria-label="Cerrar" onClick={onClose}><Icon name="close" /></button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  )
}
