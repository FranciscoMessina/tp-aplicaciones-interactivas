import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types/product'
import { formatPartNumber, formatPrice } from '../utils/format'

// Imagen con un reemplazo si falta o no carga. También la usa el detalle.
export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  return (
    <div className="product-image">
      {src && failedSrc !== src ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="image-placeholder">Sin imagen</span>
      )}
    </div>
  )
}

export function StockStatus({ quantity }: { quantity: number }) {
  return (
    <span className={quantity > 0 ? 'product-available' : 'product-unavailable'}>
      {quantity > 0 ? 'En stock' : 'Sin stock'}
    </span>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="product-card-head">
        <span className="part-number">{formatPartNumber(product.id)}</span>
        {product.isFeatured && <span className="product-featured-badge">Destacado</span>}
      </div>
      <Link className="product-card-link" to={`/productos/${product.id}`} tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.images[0]} alt="" />
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category?.name ?? 'Sin categoría'}</span>
        <h3><Link to={`/productos/${product.id}`}>{product.name}</Link></h3>
        <p className="product-description">{product.description}</p>
        <div className="product-card-footer">
          <p className="product-price">{formatPrice(product.price)}</p>
          <StockStatus quantity={product.availableQuantity} />
        </div>
      </div>
    </article>
  )
}
