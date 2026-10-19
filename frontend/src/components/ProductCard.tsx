import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../types/product'
import { formatPrice } from '../utils/format'

// Imagen con un ícono de reemplazo si falta o no carga. También la usa el detalle.
export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  return (
    <div className="product-image">
      {src && failedSrc !== src ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="image-placeholder" role="img" aria-label="Sin imagen disponible">💻</span>
      )}
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link className="product-card-link" to={`/productos/${product.id}`} aria-label={`Ver ${product.name}`}>
        <ProductImage src={product.images[0]} alt={product.name} />
        {product.isFeatured && <span className="product-featured-badge">★ Destacado</span>}
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category?.name ?? 'Sin categoría'}</span>
        <h3><Link to={`/productos/${product.id}`}>{product.name}</Link></h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{formatPrice(product.price)}</p>
        <span className={product.availableQuantity > 0 ? 'product-available' : 'product-unavailable'}>
          {product.availableQuantity > 0 ? 'Disponible' : 'Sin stock'}
        </span>
      </div>
    </article>
  )
}
