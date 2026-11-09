import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard, { ProductImage, ProductPrice, StockStatus } from '../components/ProductCard'
import { useAuth } from '../context/auth-context'
import { useBusiness } from '../context/business-context'
import { useRequest } from '../hooks/useRequest'
import { ApiRequestError, getErrorMessage } from '../services/api'
import { fetchCollections } from '../services/collections'
import { fetchProduct, fetchProducts, recordProductView } from '../services/products'
import type { Product } from '../types/product'
import { formatPartNumber } from '../utils/format'

const RELATED_LIMIT = 4

// Si el producto está en una colección, otros productos de esa colección (la de su promoción, si
// tiene una); si no, de su categoría. Se pide uno de más por si viene el actual.
async function fetchRelated(product: Product, signal: AbortSignal) {
  const collections = await fetchCollections(signal).catch(() => [])
  const withProduct = collections.filter((collection) => collection.products.some((item) => item.id === product.id))
  const collection = withProduct.find((item) => item.id === product.promotion?.collection) ?? withProduct[0]
  const others = collection?.products.filter((item) => item.id !== product.id) ?? []

  if (collection && others.length > 0) {
    return { title: `Más de ${collection.title}`, to: `/colecciones/${collection.id}`, linkLabel: 'Ver la colección', items: others }
  }

  const page = await fetchProducts({ category: product.category.id, page: 1, pageSize: RELATED_LIMIT + 1 }, signal)
  return {
    title: `También en ${product.category.name}`,
    to: `/catalogo?categoria=${product.category.id}`,
    linkLabel: 'Ver todos',
    items: page.items.filter((item) => item.id !== product.id),
  }
}

function RelatedProducts({ product }: { product: Product }) {
  const related = useRequest((signal) => fetchRelated(product, signal), product.id)
  const items = related.data?.items.slice(0, RELATED_LIMIT) ?? []
  if (!related.data || items.length === 0) return null

  return (
    <section className="related-section" aria-labelledby="related-title">
      <div className="section-heading">
        <div>
          <h2 id="related-title">{related.data.title}</h2>
        </div>
        <Link className="section-link" to={related.data.to}>{related.data.linkLabel}</Link>
      </div>
      <div className="products-grid">
        {items.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  )
}

export default function ProductDetailPage() {
  const { businessName } = useBusiness()
  const { user, checkingSession } = useAuth()
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

  // Una visita por producto y por sesión del navegador; las de los administradores no cuentan.
  const viewedId = product?.id
  useEffect(() => {
    if (!viewedId || checkingSession || user) return
    const key = `visita:${viewedId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* sin sessionStorage la visita se cuenta igual */ }
    recordProductView(viewedId).catch(() => { /* es una métrica: si falla, el visitante no se entera */ })
  }, [viewedId, checkingSession, user])

  useEffect(() => {
    if (!product) return
    document.title = businessName ? `${product.name} | ${businessName}` : product.name
    return () => { document.title = businessName }
  }, [product, businessName])

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
            <h2>Este producto ya no está en el catálogo</h2>
            <p>Puede que se haya agotado o que ya no esté publicado. Escribinos y te avisamos si vuelve a entrar.</p>
            <div className="information-actions">
              <Link className="primary-button" to={`/contacto?asunto=${encodeURIComponent('Busco un producto')}`}>Escribinos</Link>
              <Link className="section-link" to="/catalogo">Volver al catálogo</Link>
            </div>
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
                  <ProductPrice product={product} />
                  <StockStatus quantity={product.availableQuantity} />
                  {product.availableQuantity > 0 ? (
                    <Link className="primary-button" to={`/contacto?producto=${product.id}`}>
                      Consultar por este producto
                    </Link>
                  ) : (
                    <>
                      <Link className="primary-button" to={`/contacto?producto=${product.id}&aviso=1`}>
                        Avisame cuando entre
                      </Link>
                      <p className="product-buy-note">Dejanos tu email y te escribimos cuando vuelva a haber stock.</p>
                    </>
                  )}
                </div>
                <p className="product-detail-description">{product.description}</p>
              </div>
            </div>
            <RelatedProducts product={product} />
          </>
        ) : null}
      </div>
    </main>
  )
}
