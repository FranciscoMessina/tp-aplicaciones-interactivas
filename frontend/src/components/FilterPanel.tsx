import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { formatPrice, parsePrice } from '../utils/format'
import Icon from './Icon'

interface FilterPanelProps {
  categories: { id: string; name: string; productCount?: number }[]
  selectedCategories: string[]
  minPrice?: number
  maxPrice?: number
  // Cantidad de resultados con los filtros actuales; null mientras carga.
  total: number | null
  // Precio más bajo y más alto disponibles, como sugerencia en los campos.
  priceRange: { min: number; max: number } | null
  onChange: (changes: { categoria?: string; desde?: string; hasta?: string }) => void
  onClear: () => void
  onClose: () => void
  // Los grupos propios de cada pantalla (stock, ofertas, estado...), debajo del precio.
  children: ReactNode
}

// Panel lateral con los filtros de productos, compartido por el catálogo y el panel de
// administración: categorías y precio son comunes y cada pantalla suma sus grupos. Cada cambio
// se aplica en el momento y el pie muestra cuántos productos quedan; el <dialog> nativo bloquea
// el foco y cierra con Escape.
export default function FilterPanel({
  categories,
  selectedCategories,
  minPrice,
  maxPrice,
  total,
  priceRange,
  onChange,
  onClear,
  onClose,
  children,
}: FilterPanelProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [from, setFrom] = useState(minPrice === undefined ? '' : String(minPrice))
  const [to, setTo] = useState(maxPrice === undefined ? '' : String(maxPrice))
  // Los campos guardan solo dígitos y los muestran con formato de precio ("$ 200.000").
  const showPrice = (digits: string) => (digits === '' ? '' : formatPrice(Number(digits)))
  const onlyDigits = (text: string) => text.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  const priceError =
    from !== '' && to !== '' && Number(from) > Number(to)
      ? 'El “desde” es mayor que el “hasta”.'
      : ''

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Los precios se aplican cuando se deja de escribir y el rango es válido.
  useEffect(() => {
    if (priceError || (parsePrice(from) === minPrice && parsePrice(to) === maxPrice)) return
    const timer = window.setTimeout(() => onChange({ desde: from.trim(), hasta: to.trim() }), 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, priceError])

  function toggleCategory(id: string) {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((item) => item !== id)
      : [...selectedCategories, id]
    onChange({ categoria: next.join(',') })
  }

  function clearAll() {
    setFrom('')
    setTo('')
    onClear()
  }

  return (
    <dialog
      ref={ref}
      className="filter-panel"
      aria-labelledby="filter-panel-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="filter-panel-header">
        <h2 id="filter-panel-title">Filtros</h2>
        <button
          type="button"
          className="filter-panel-close"
          aria-label="Cerrar filtros"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="filter-panel-body">
        <fieldset className="filter-group">
          <legend>Categorías</legend>
          {/* Casillas ocultas con forma de chip: se pueden marcar varias. "Todas" las desmarca. */}
          <div className="filter-chip-list">
            <label className="filter-chip">
              <input
                className="visually-hidden"
                type="checkbox"
                checked={selectedCategories.length === 0}
                onChange={() => onChange({ categoria: '' })}
              />
              Todas
            </label>
            {categories.map((item) => (
              <label key={item.id} className="filter-chip">
                <input
                  className="visually-hidden"
                  type="checkbox"
                  checked={selectedCategories.includes(item.id)}
                  onChange={() => toggleCategory(item.id)}
                />
                {item.name}
                {item.productCount !== undefined && (
                  <span className="filter-chip-count">{item.productCount}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Un grupo sin <fieldset>: el <legend> no deja poner el botón en su misma fila. */}
        <div className="filter-group" role="group" aria-labelledby="filter-price-title">
          <div className="filter-group-header">
            <span id="filter-price-title" className="filter-group-title">
              Precio
            </span>
            {(from !== '' || to !== '') && (
              <button
                type="button"
                className="clear-button"
                onClick={() => {
                  setFrom('')
                  setTo('')
                  document.getElementById('filter-from')?.focus()
                }}
              >
                Borrar precios
              </button>
            )}
          </div>
          <div className="filter-price">
            <div className="field">
              <label htmlFor="filter-from">Desde</label>
              <input
                id="filter-from"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={priceRange ? formatPrice(priceRange.min) : '$ 0'}
                value={showPrice(from)}
                onChange={(event) => setFrom(onlyDigits(event.target.value))}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? 'filter-price-error' : undefined}
              />
            </div>
            <div className="field">
              <label htmlFor="filter-to">Hasta</label>
              <input
                id="filter-to"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={priceRange ? formatPrice(priceRange.max) : 'Sin tope'}
                value={showPrice(to)}
                onChange={(event) => setTo(onlyDigits(event.target.value))}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? 'filter-price-error' : undefined}
              />
            </div>
          </div>
          {priceError && (
            <p id="filter-price-error" className="filter-error" role="alert">
              {priceError}
            </p>
          )}
        </div>

        {children}
      </div>

      <div className="filter-panel-footer">
        <button type="button" className="clear-button" onClick={clearAll}>
          Limpiar
        </button>
        <button type="button" className="primary-button" onClick={onClose}>
          {total === null
            ? 'Ver productos'
            : total === 1
              ? 'Ver 1 producto'
              : `Ver ${total} productos`}
        </button>
      </div>
    </dialog>
  )
}
