const priceFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const formatPrice = (price: number) => priceFormat.format(price)

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export const formatDate = (value: string) => dateFormat.format(new Date(value))
