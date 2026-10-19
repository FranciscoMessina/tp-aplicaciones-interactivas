import { useCallback, useEffect, useState } from 'react'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { getErrorMessage } from '../services/api'
import { deleteEnquiry, fetchEnquiries, updateEnquiryStatus } from '../services/enquiries'
import type { Enquiry, EnquiryStatus } from '../types/business'
import { formatDate } from '../utils/format'

const statusLabels: Record<EnquiryStatus, string> = { PENDING: 'Pendiente', READ: 'Leída', RESOLVED: 'Respondida' }

// Mismas transiciones que permite el backend: una consulta respondida solo puede volver a pendiente.
const nextStatuses: Record<EnquiryStatus, EnquiryStatus[]> = {
  PENDING: ['READ', 'RESOLVED'],
  READ: ['RESOLVED', 'PENDING'],
  RESOLVED: ['PENDING'],
}

const actionLabels: Record<EnquiryStatus, string> = {
  PENDING: 'Marcar como pendiente',
  READ: 'Marcar como leída',
  RESOLVED: 'Marcar como respondida',
}

const filters: { value: EnquiryStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'READ', label: 'Leídas' },
  { value: 'RESOLVED', label: 'Respondidas' },
]

export default function AdminEnquiriesPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [status, setStatus] = useState<EnquiryStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Enquiry | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    fetchEnquiries(token, status || undefined, controller.signal)
      .then(setEnquiries)
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(getErrorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, status, reload])

  function reloadWith(nextStatus: EnquiryStatus | '') {
    setLoading(true)
    setLoadError('')
    setStatus(nextStatus)
    setReload((value) => value + 1)
  }

  async function changeStatus(enquiry: Enquiry, next: EnquiryStatus) {
    setBusyId(enquiry.id)
    try {
      const updated = await updateEnquiryStatus(token, enquiry.id, next)
      // Con un filtro activo, la consulta deja de pertenecer al listado.
      setEnquiries((current) => status && status !== updated.status
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => item.id === updated.id ? updated : item))
      setNotice({ kind: 'success', text: `La consulta de ${enquiry.name} quedó como ${statusLabels[updated.status].toLowerCase()}.` })
    } catch (error) {
      setNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteEnquiry(token, deleting.id)
      setEnquiries((current) => current.filter((item) => item.id !== deleting.id))
      setNotice({ kind: 'success', text: `Se eliminó la consulta de ${deleting.name}.` })
    } catch (error) {
      setNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setDeleting(null)
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="section-kicker">ADMINISTRACIÓN</span>
          <h1>Consultas</h1>
          <p>Mensajes que los visitantes enviaron desde el formulario de contacto.</p>
        </div>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <div className="admin-filter-chips" role="group" aria-label="Filtrar por estado">
        {filters.map((filter) => (
          <button key={filter.label} type="button" aria-pressed={status === filter.value} onClick={() => reloadWith(filter.value)}>
            {filter.label}
          </button>
        ))}
      </div>

      <p className="admin-count" aria-live="polite">
        {loading ? 'Cargando…' : `${enquiries.length} ${enquiries.length === 1 ? 'consulta' : 'consultas'}`}
      </p>

      {loadError ? (
        <div className="empty-state" role="alert">
          <span aria-hidden="true">⚠️</span>
          <h3>No pudimos cargar las consultas</h3>
          <p>{loadError}</p>
          <button type="button" className="primary-button empty-button" onClick={() => reloadWith(status)}>Reintentar</button>
        </div>
      ) : loading && enquiries.length === 0 ? (
        <div className="admin-skeleton" role="status" aria-label="Cargando consultas">
          {Array.from({ length: 4 }, (_, index) => <div key={index} />)}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">✉</span>
          <h3>No hay consultas{status ? ` ${filters.find((filter) => filter.value === status)?.label.toLowerCase()}` : ''}</h3>
          <p>Las consultas que lleguen desde la página de contacto van a aparecer acá.</p>
        </div>
      ) : (
        <ul className={`admin-enquiries${loading ? ' is-loading' : ''}`}>
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className={`admin-enquiry status-${enquiry.status.toLowerCase()}`}>
              <div className="admin-enquiry-header">
                <div>
                  <h2>{enquiry.subject}</h2>
                  <p className="admin-enquiry-meta">
                    <strong>{enquiry.name}</strong>
                    <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}>{enquiry.email}</a>
                    {enquiry.phone && <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`}>{enquiry.phone}</a>}
                    <time dateTime={enquiry.createdAt}>{formatDate(enquiry.createdAt)}</time>
                  </p>
                </div>
                <span className={`admin-enquiry-status status-${enquiry.status.toLowerCase()}`}>{statusLabels[enquiry.status]}</span>
              </div>
              <p className="admin-enquiry-message">{enquiry.message}</p>
              <div className="admin-row-actions">
                {nextStatuses[enquiry.status].map((next) => (
                  <button key={next} type="button" disabled={busyId === enquiry.id} onClick={() => void changeStatus(enquiry, next)}>
                    {actionLabels[next]}
                  </button>
                ))}
                <button type="button" className="danger" onClick={() => setDeleting(enquiry)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <Modal title="Eliminar consulta" onClose={() => { if (!deleteBusy) setDeleting(null) }}>
          <p className="admin-confirm-text">
            ¿Seguro que querés eliminar la consulta <strong>{deleting.subject}</strong> de {deleting.name}? Esta acción no se puede deshacer.
          </p>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancelar</button>
            <button type="button" className="admin-danger" disabled={deleteBusy} onClick={() => void confirmDelete()}>
              {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
