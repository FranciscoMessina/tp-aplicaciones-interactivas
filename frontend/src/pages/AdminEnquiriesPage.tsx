import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import AdminEmpty from '../components/AdminEmpty'
import type { AdminOutletContext } from '../components/AdminLayout'
import AdminNotice from '../components/AdminNotice'
import type { Notice } from '../components/AdminNotice'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useAuth } from '../context/auth-context'
import { getErrorMessage } from '../services/api'
import { deleteEnquiry, fetchEnquiries, replyToEnquiry, updateEnquiryStatus } from '../services/enquiries'
import type { Enquiry, EnquiryStatus } from '../types/business'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 20
const MAX_REPLY = 5000

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

// `param` es el valor en la URL (?estado=pendiente).
const filters: { value: EnquiryStatus | ''; param: string; label: string }[] = [
  { value: '', param: '', label: 'Todas' },
  { value: 'PENDING', param: 'pendiente', label: 'Pendientes' },
  { value: 'READ', param: 'leida', label: 'Leídas' },
  { value: 'RESOLVED', param: 'respondida', label: 'Respondidas' },
]

// Responde desde el panel: el backend le manda el correo al visitante y guarda la respuesta.
function ReplyForm({ token, enquiry, onReplied }: { token: string; enquiry: Enquiry; onReplied: (updated: Enquiry) => void }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Escribí la respuesta.')
      input.current?.focus()
      return
    }

    setError('')
    setSending(true)
    try {
      onReplied(await replyToEnquiry(token, enquiry.id, trimmed))
      setMessage('')
    } catch (caught) {
      setError(getErrorMessage(caught))
      input.current?.focus()
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="admin-form admin-inbox-reply" onSubmit={(event) => void submit(event)} noValidate>
      <div className={error ? 'admin-field has-error' : 'admin-field'}>
        <label htmlFor="enquiry-reply">Responder a {enquiry.name}</label>
        <textarea
          ref={input}
          id="enquiry-reply"
          rows={5}
          maxLength={MAX_REPLY}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'enquiry-reply-error' : 'enquiry-reply-hint'}
        />
        {error
          ? <span id="enquiry-reply-error" className="admin-error">{error}</span>
          : <span id="enquiry-reply-hint" className="admin-hint">Le llega por correo a {enquiry.email}; si contesta, el mail te llega a vos. La consulta queda como respondida.</span>}
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-primary" disabled={sending}>
          <Icon name="mail" /> {sending ? 'Enviando...' : 'Enviar respuesta'}
        </button>
      </div>
    </form>
  )
}

export default function AdminEnquiriesPage() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''
  const { refreshPending } = useOutletContext<AdminOutletContext>()

  // El filtro, la página y la consulta abierta viven en la URL (?estado=pendiente&pagina=2&consulta=<id>).
  const [params, setParams] = useSearchParams()
  const status = filters.find((filter) => filter.param === params.get('estado'))?.value ?? ''
  const page = Math.max(1, Number(params.get('pagina')) || 1)
  const selectedId = params.get('consulta')

  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Enquiry | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const clearNotice = useCallback(() => setNotice(null), [])
  const detailHeading = useRef<HTMLHeadingElement>(null)

  // Si la consulta elegida sale del listado (filtro, página o eliminación), el detalle vuelve a quedar vacío.
  const selected = enquiries.find((item) => item.id === selectedId) ?? null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const setPage = useCallback((next: number) => {
    setParams((current) => {
      const nextParams = new URLSearchParams(current)
      if (next > 1) nextParams.set('pagina', String(next))
      else nextParams.delete('pagina')
      nextParams.delete('consulta')
      return nextParams
    })
  }, [setParams])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    fetchEnquiries(token, { status: status || undefined, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((result) => {
        // La página quedó vacía (se eliminó o cambió de estado lo último que tenía): vamos a la anterior.
        if (result.items.length === 0 && page > 1) return setPage(page - 1)
        setEnquiries(result.items)
        setTotal(result.total)
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(getErrorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, status, page, reload, setPage])

  useEffect(() => { detailHeading.current?.focus() }, [selectedId])

  function reloadWith(nextStatus: EnquiryStatus | '') {
    setLoading(true)
    setLoadError('')
    const param = filters.find((filter) => filter.value === nextStatus)?.param
    setParams(param ? { estado: param } : {})
    setReload((value) => value + 1)
  }

  // Abrir una consulta suma una entrada al historial: en el celular, Atrás vuelve a la lista.
  function setSelectedId(id: string | null) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (id) next.set('consulta', id)
      else next.delete('consulta')
      return next
    })
  }

  // Reemplaza la consulta en la página. Si con el filtro activo ya no corresponde,
  // se vuelve a pedir la página para completarla con la siguiente.
  function applyUpdate(updated: Enquiry) {
    if (status && status !== updated.status) setReload((value) => value + 1)
    else setEnquiries((current) => current.map((item) => item.id === updated.id ? updated : item))
    refreshPending()
  }

  async function changeStatus(enquiry: Enquiry, next: EnquiryStatus) {
    setBusyId(enquiry.id)
    try {
      const updated = await updateEnquiryStatus(token, enquiry.id, next)
      applyUpdate(updated)
      setNotice({ kind: 'success', text: `La consulta de ${enquiry.name} quedó como ${statusLabels[updated.status].toLowerCase()}.` })
    } catch (error) {
      setNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  function handleReplied(updated: Enquiry) {
    applyUpdate(updated)
    setNotice({ kind: 'success', text: `Le enviamos la respuesta a ${updated.email}.` })
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteEnquiry(token, deleting.id)
      setNotice({ kind: 'success', text: `Se eliminó la consulta de ${deleting.name}.` })
      setReload((value) => value + 1)
      refreshPending()
    } catch (error) {
      setNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setDeleting(null)
      setDeleteBusy(false)
    }
  }

  const filterLabel = filters.find((filter) => filter.value === status)?.label.toLowerCase()

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Consultas</h1>
          <p>Mensajes que los visitantes enviaron desde el formulario de contacto.</p>
        </div>
      </div>

      <AdminNotice notice={notice} onClose={clearNotice} />

      <div className={`admin-inbox${selected ? ' has-selection' : ''}`}>
        <section className="admin-panel admin-inbox-list" aria-label="Listado de consultas">
          <div className="admin-inbox-toolbar">
            <div className="admin-segmented" role="group" aria-label="Filtrar por estado">
              {filters.map((filter) => (
                <button key={filter.label} type="button" aria-pressed={status === filter.value} onClick={() => reloadWith(filter.value)}>
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="admin-count" aria-live="polite">
              {loading ? 'Cargando…' : `${total} ${total === 1 ? 'consulta' : 'consultas'}`}
            </p>
          </div>

          {loadError ? (
            <AdminEmpty icon="alert" title="No pudimos cargar las consultas" isError action={<button type="button" className="admin-secondary" onClick={() => reloadWith(status)}>Reintentar</button>}>
              {loadError}
            </AdminEmpty>
          ) : loading && enquiries.length === 0 ? (
            <div className="admin-skeleton is-rows" role="status" aria-label="Cargando consultas">
              {Array.from({ length: 5 }, (_, index) => <div key={index} />)}
            </div>
          ) : enquiries.length === 0 ? (
            <AdminEmpty icon="enquiries" title={`No hay consultas${status ? ` ${filterLabel}` : ''}`}>
              Las consultas que lleguen desde la página de contacto van a aparecer acá.
            </AdminEmpty>
          ) : (
            <ul className={`admin-inbox-items${loading ? ' is-loading' : ''}`}>
              {enquiries.map((enquiry) => (
                <li key={enquiry.id}>
                  <button
                    type="button"
                    className={`admin-inbox-item${enquiry.status === 'PENDING' ? ' is-pending' : ''}`}
                    aria-current={enquiry.id === selectedId ? 'true' : undefined}
                    onClick={() => setSelectedId(enquiry.id)}
                  >
                    <span className="admin-inbox-item-top">
                      <strong>{enquiry.name}</strong>
                      <time dateTime={enquiry.createdAt}>{formatDate(enquiry.createdAt)}</time>
                    </span>
                    <span className="admin-inbox-item-subject">{enquiry.subject}</span>
                    <span className="admin-inbox-item-preview">{enquiry.message}</span>
                    <span className={`admin-enquiry-status is-${enquiry.status.toLowerCase()}`}>{statusLabels[enquiry.status]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loadError && totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Paginación de consultas">
              <span>Página {page} de {totalPages}</span>
              <button type="button" className="admin-secondary" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Anterior</button>
              <button type="button" className="admin-secondary" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>Siguiente</button>
            </nav>
          )}
        </section>

        <section className="admin-panel admin-inbox-detail" aria-label="Consulta seleccionada">
          {selected ? (
            <article>
              <button type="button" className="admin-text-link admin-inbox-back" onClick={() => setSelectedId(null)}>
                <Icon name="back" /> Volver a la lista
              </button>
              <header className="admin-inbox-detail-header">
                <h2 ref={detailHeading} tabIndex={-1}>{selected.subject}</h2>
                <span className={`admin-enquiry-status is-${selected.status.toLowerCase()}`}>{statusLabels[selected.status]}</span>
              </header>
              <dl className="admin-inbox-meta">
                <div><dt>De</dt><dd>{selected.name}</dd></div>
                <div><dt>Correo</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
                {selected.phone && <div><dt>Teléfono</dt><dd><a href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}>{selected.phone}</a></dd></div>}
                <div><dt>Recibida</dt><dd><time dateTime={selected.createdAt}>{formatDate(selected.createdAt)}</time></dd></div>
              </dl>
              <p className="admin-inbox-message">{selected.message}</p>

              {selected.replies.length > 0 && (
                <ol className="admin-inbox-replies" aria-label="Respuestas enviadas">
                  {selected.replies.map((reply) => (
                    <li key={reply.id}>
                      <p className="admin-inbox-reply-meta">
                        <strong>{reply.authorName}</strong> respondió el <time dateTime={reply.createdAt}>{formatDate(reply.createdAt)}</time>
                      </p>
                      <p className="admin-inbox-message">{reply.message}</p>
                    </li>
                  ))}
                </ol>
              )}

              {/* La key reinicia el borrador al cambiar de consulta. */}
              <ReplyForm key={selected.id} token={token} enquiry={selected} onReplied={handleReplied} />

              <div className="admin-inbox-actions">
                {nextStatuses[selected.status].map((next) => (
                  <button key={next} type="button" className="admin-secondary" disabled={busyId === selected.id} onClick={() => void changeStatus(selected, next)}>
                    {actionLabels[next]}
                  </button>
                ))}
                <button type="button" className="admin-icon-button is-danger" aria-label="Eliminar consulta" title="Eliminar" onClick={() => setDeleting(selected)}>
                  <Icon name="delete" />
                </button>
              </div>
            </article>
          ) : (
            <div className="admin-inbox-placeholder">
              <Icon name="mail" />
              <p>Elegí una consulta de la lista para leerla completa.</p>
            </div>
          )}
        </section>
      </div>

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
