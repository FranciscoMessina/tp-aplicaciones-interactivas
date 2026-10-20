import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductImage, StockStatus } from '../components/ProductCard'
import { ApiRequestError, getErrorMessage } from '../services/api'
import { fetchProduct } from '../services/products'
import type { Product } from '../types/product'
import { formatPartNumber, formatPrice } from '../utils/format'

export default function ProductDetailPage() {
  const { id = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [selected, setSelected] = useState(0)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const data = await fetchProduct(id, controller.signal)
        if (!controller.signal.aborted) {
          setProduct(data)
          setSelected(0)
          setError(null)
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [id, reload])

  useEffect(() => {
    if (!product) return
    document.title = `${product.name} | TechStore`
    return () => { document.title = 'TechStore' }
  }, [product])

  function reloadProduct() {
    setLoading(true)
    setError(null)
    setReload((previous) => previous + 1)
  }

  const notFound = error instanceof ApiRequestError && error.status === 404

  return (
    <main className="information-page">
      <div className="information-container">
        {loading ? (
          <div className="information-message" role="status">Cargando producto...</div>
        ) : notFound ? (
          <div className="information-message" role="alert">
            <h2>Producto no disponible</h2>
            <p>Este producto no existe o ya no está publicado.</p>
            <Link className="auth-back" to="/catalogo">← Volver al catálogo</Link>
          </div>
        ) : error ? (
          <div className="information-message" role="alert">
            <h2>No pudimos cargar el producto</h2>
            <p>{getErrorMessage(error)}</p>
            <button type="button" className="primary-button information-retry" onClick={reloadProduct}>Reintentar</button>
          </div>
        ) : product ? (
          <>
            <Link className="auth-back" to="/catalogo">← Volver al catálogo</Link>
            <div className="product-detail">
              <div className="product-gallery">
                <ProductImage src={product.images[selected]} alt={product.name} />
                {product.images.length > 1 && (
                  <div className="product-thumbs">
                    {product.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        aria-label={`Ver imagen ${index + 1}`}
                        aria-pressed={index === selected}
                        onClick={() => setSelected(index)}
                      >
                        <img src={image} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="product-detail-info">
                <span className="part-number">{formatPartNumber(product.id)}</span>
                <span className="product-category">{product.category.name}</span>
                <h1>{product.name}</h1>
                {product.isFeatured && <span className="product-featured-badge is-inline">Destacado</span>}
                <div className="product-buy">
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <StockStatus quantity={product.availableQuantity} />
                  <Link className="primary-button" to={`/contacto?asunto=${encodeURIComponent(`Consulta por ${product.name}`)}`}>
                    Consultar por este producto
                  </Link>
                </div>
                <p className="product-detail-description">{product.description}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
