import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useBusiness } from '../context/business-context'
import { useRequest } from '../hooks/useRequest'
import { fetchCollection } from '../services/collections'

// Una colección armada por el comercio, con sus productos en el orden elegido.
export default function CollectionPage() {
  const { businessName } = useBusiness()
  const { id = '' } = useParams()
  const collection = useRequest((signal) => fetchCollection(id, signal), id)
  const title = collection.data?.title
  // La promoción vigente de esta colección, si alguno de sus productos la tiene aplicada.
  const promotion = collection.data?.products.find((product) => product.promotion?.collection === id)?.promotion

  useEffect(() => {
    if (!title) return
    document.title = businessName ? `${title} | ${businessName}` : title
    return () => { document.title = businessName }
  }, [title, businessName])

  return (
    <main className="information-page">
      <div className="information-container">
        {collection.isLoading ? (
          <div className="information-message" role="status">Cargando colección...</div>
        ) : collection.error ? (
          <div className="information-message" role="alert">
            <h2>No pudimos mostrar la colección</h2>
            <p>{collection.error} Puede que ya no esté publicada; los productos siguen en el catálogo.</p>
            <div className="information-actions">
              <Link className="primary-button" to="/catalogo">Ir al catálogo</Link>
              <button type="button" className="section-link clear-button" onClick={collection.retry}>Reintentar</button>
            </div>
          </div>
        ) : !collection.data || collection.data.products.length === 0 ? (
          <div className="information-message" role="status">
            <h2>Esta colección no tiene productos disponibles</h2>
            <p>Sus productos ya no están publicados. Mirá el resto del catálogo.</p>
            <div className="information-actions">
              <Link className="primary-button" to="/catalogo">Ir al catálogo</Link>
            </div>
          </div>
        ) : (
          <>
            <Link className="auth-back" to="/">← Volver al inicio</Link>
            <div className="section-heading collection-heading">
              <div>
                <h1>{collection.data.title}</h1>
                {collection.data.description && <p>{collection.data.description}</p>}
                {promotion && <p className="collection-promotion">-{promotion.discountPercent}% en esta colección por la promoción {promotion.title}</p>}
              </div>
              <Link className="section-link" to="/catalogo">Ver todo el catálogo</Link>
            </div>
            <div className="products-grid">
              {collection.data.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
