import { useEffect } from 'react'
import Icon from './Icon'

export type Notice = { kind: 'success' | 'error'; text: string }

// Aviso flotante con el resultado de la última acción del panel. Se cierra solo a los 5 segundos.
export default function AdminNotice({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(timer)
  }, [notice, onClose])

  return (
    <div className="admin-notice-slot" aria-live="polite">
      {notice && (
        <div className={`admin-notice is-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          <span className="admin-notice-mark" aria-hidden="true" />
          <p>{notice.text}</p>
          <button type="button" aria-label="Cerrar aviso" onClick={onClose}><Icon name="close" /></button>
        </div>
      )}
    </div>
  )
}
