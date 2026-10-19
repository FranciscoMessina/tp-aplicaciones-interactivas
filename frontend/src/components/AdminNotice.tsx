import { useEffect } from 'react'

export type Notice = { kind: 'success' | 'error'; text: string }

// Aviso del resultado de la última acción del panel. Se cierra solo a los 5 segundos.
export default function AdminNotice({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(timer)
  }, [notice, onClose])

  return (
    <div className="admin-notice-slot" aria-live="polite">
      {notice && (
        <div className={`admin-notice ${notice.kind === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          {notice.text}
          <button type="button" aria-label="Cerrar aviso" onClick={onClose}>×</button>
        </div>
      )}
    </div>
  )
}
