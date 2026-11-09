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
        <img key={src} src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="image-placeholder">Sin imagen</span>
      )}
    </div>
  )
}

// Con pocas unidades se avisa cuántas quedan.
const LOW_STOCK = 3

export function StockStatus({ quantity }: { quantity: number }) {
  if (quantity <= 0) return <span className="product-unavailable">Sin stock</span>
  if (quantity === 1) return <span className="product-low">Última unidad</span>
  if (quantity <= LOW_STOCK) return <span className="product-low">Quedan {quantity}</span>
  return <span className="product-available">En stock</span>
}

// Precio final y, si tiene descuento, el de lista tachado y el porcentaje. Si el descuento
// viene de una promoción, se la nombra y lleva a su colección.
export function ProductPrice({ product }: { product: Product }) {
  const { promotion } = product
  const percent = promotion?.discountPercent ?? product.discountPercent
  if (percent <= 0) return <p className="product-price">{formatPrice(product.finalPrice)}</p>
  return (
    <p className="product-price has-discount">
      <span className="product-price-final"><span className="visually-hidden">Precio con descuento: </span>{formatPrice(product.finalPrice)}</span>
      <del><span className="visually-hidden">Precio anterior: </span>{formatPrice(product.price)}</del>
      <span className="product-discount">-{percent}%</span>
      {promotion && (
        <Link className="product-promotion" to={`/colecciones/${promotion.collection}`} aria-label={`Descuento por la promoción ${promotion.title}: ver la colección`}>
          Promoción {promotion.title}
        </Link>
      )}
    </p>
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
          <ProductPrice product={product} />
          <StockStatus quantity={product.availableQuantity} />
        </div>
      </div>
    </article>
  )
}
