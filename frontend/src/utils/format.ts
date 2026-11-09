const priceFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const formatPrice = (price: number) => priceFormat.format(price)

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export const formatDate = (value: string) => dateFormat.format(new Date(value))

// Número de parte de la hoja de datos, derivado del id del producto.
export const formatPartNumber = (id: string) => `TS-${id.slice(-6).toUpperCase()}`

// Fechas de calendario que guarda la API ("2026-11-30" → "30/11/2026").
export const formatDay = (value: string) => value.split('-').reverse().join('/')
