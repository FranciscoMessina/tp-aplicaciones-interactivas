import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useRequest } from '../hooks/useRequest'
import { fetchCategorySummaries } from '../services/categories'
import { fetchCollections } from '../services/collections'
import { fetchProducts } from '../services/products'
import { fetchPromotions } from '../services/promotions'
import type { Promotion } from '../types/promotion'
import { formatDay, formatPrice } from '../utils/format'

const FEATURED_LIMIT = 8

// Productos de cada colección que se muestran en el inicio; el resto, en su página.
const COLLECTION_PREVIEW = 4

// Categorías con más productos que se listan en la tabla del inicio.
const MAIN_CATEGORIES = 6

// El inicio se dibuja como un chip DIP de 24 patas visto desde arriba, con la muesca a la izquierda:
// abajo van de la 1 a la 12 y arriba siguen de la 13 a la 24, de derecha a izquierda.
const PINS_PER_SIDE = 12
const BOTTOM_PINS = Array.from({ length: PINS_PER_SIDE }, (_, index) => index + 1)
const TOP_PINS = BOTTOM_PINS.map((pin) => PINS_PER_SIDE * 2 + 1 - pin)

// Los destacados; si no hay ninguno, lo último que entró.
async function fetchShowcase(signal: AbortSignal) {
  const page = { page: 1, pageSize: FEATURED_LIMIT }
  const featured = await fetchProducts({ ...page, isFeatured: true }, signal)
  if (featured.items.length > 0) return { products: featured.items, hasFeatured: true }
  const recent = await fetchProducts(page, signal)
  return { products: recent.items, hasFeatured: false }
}

// El aviso lleva a su colección, a su categoría o, sin ninguna, a los productos con descuento.
function PromotionLink({ promotion }: { promotion: Promotion }) {
  const [to, label] = promotion.linkedCollection
    ? [`/colecciones/${promotion.linkedCollection.id}`, `Ver ${promotion.linkedCollection.title}`]
    : promotion.category
      ? [`/catalogo?categoria=${promotion.category.id}`, `Ver ${promotion.category.name}`]
      : ['/catalogo?ofertas=1', 'Ver las ofertas']
  return <Link className="promotion-link" to={to}>{label}</Link>
}

function HomePage() {
  const showcase = useRequest(fetchShowcase, 'showcase')
  const categories = useRequest(fetchCategorySummaries, 'categories')
  const promotions = useRequest(fetchPromotions, 'promotions')
  const collections = useRequest(fetchCollections, 'collections')
  const probed = useRef(-1)

  const mainCategories = categories.data?.slice(0, MAIN_CATEGORIES) ?? []
  const productCount = categories.data?.reduce((sum, item) => sum + item.productCount, 0) ?? 0
  const hasFeatured = showcase.data?.hasFeatured ?? false

  // La punta de prueba: resalta el par de patas bajo el puntero, sin re-renderizar.
  function probe(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return
    const chip = event.currentTarget
    const pins = chip.querySelectorAll<HTMLElement>('.chip-pins.is-bottom > span')
    const visible = Array.from(pins).filter((pin) => pin.offsetParent !== null)
    if (visible.length === 0) return
    const nearest = visible.reduce((best, pin) => {
      const distance = Math.abs(pin.getBoundingClientRect().left + pin.offsetWidth / 2 - event.clientX)
      return distance < best.distance ? { pin, distance } : best
    }, { pin: visible[0], distance: Infinity }).pin
    const column = Array.from(pins).indexOf(nearest)
    if (column === probed.current) return
    probed.current = column
    chip.querySelectorAll('.is-probed').forEach((pin) => pin.classList.remove('is-probed'))
    nearest.classList.add('is-probed')
    chip.querySelectorAll<HTMLElement>('.chip-pins.is-top > span')[column]?.classList.add('is-probed')
  }

  function unprobe(event: PointerEvent<HTMLElement>) {
    probed.current = -1
    event.currentTarget.querySelectorAll('.is-probed').forEach((pin) => pin.classList.remove('is-probed'))
  }

  return (
    <main>
      <section className="welcome" aria-labelledby="welcome-title" onPointerMove={probe} onPointerLeave={unprobe}>
        <div className="chip-pins is-top" aria-hidden="true">
          {TOP_PINS.map((pin) => <span key={pin}>{pin}</span>)}
        </div>
        <div className="chip-pins is-bottom" aria-hidden="true">
          {BOTTOM_PINS.map((pin) => <span key={pin}>{pin}</span>)}
        </div>

        <div className="welcome-content">
          <h1 id="welcome-title">Consolas, PCs y todo lo que <span className="welcome-accent">se enchufa.</span></h1>
          <p>Consolas, computadoras, celulares, juegos y accesorios, con precio en pesos y stock al día.</p>
        </div>
      </section>

      {!categories.error && (
        <nav className="order-table" aria-label="Categorías principales">
          {categories.isLoading
            ? Array.from({ length: MAIN_CATEGORIES + 1 }, (_, index) => <div key={index} className="order-row is-placeholder" aria-hidden="true" />)
            : (
                <>
                  {mainCategories.map((stat, index) => (
                    <Link key={stat.id} className="order-row" to={`/catalogo?categoria=${stat.id}`}>
                      <span className="order-code" aria-hidden="true">C-{String(index + 1).padStart(2, '0')}</span>
                      <span className="order-name">{stat.name}</span>
                      <span className="order-examples">{stat.examples.join(', ')}</span>
                      <span className="order-count">{stat.productCount} {stat.productCount === 1 ? 'producto' : 'productos'}</span>
                      <span className="order-price">desde {formatPrice(stat.minPrice)}</span>
                    </Link>
                  ))}
                  <Link className="order-row is-all" to="/catalogo">
                    <span className="order-code" aria-hidden="true">C-00</span>
                    <span className="order-name">Todo el catálogo</span>
                    <span className="order-examples" />
                    <span className="order-count">{productCount} productos</span>
                    <span className="order-price">Buscar y filtrar</span>
                  </Link>
                </>
              )}
        </nav>
      )}

      {/* Las promociones son un extra: si fallan o no hay, la sección no aparece. */}
      {promotions.data && promotions.data.length > 0 && (
        <section className="promotions" aria-label="Promociones vigentes">
          {promotions.data.map((promotion, index) => (
            <article key={promotion.id} className={`promotion${promotion.image ? ' has-image' : ''}`}>
              {promotion.image && <img className="promotion-image" src={promotion.image} alt="" loading="lazy" />}
              <div className="promotion-content">
                <span className="promotion-code">
                  P-{String(index + 1).padStart(2, '0')}
                  {promotion.discountPercent && ` · -${promotion.discountPercent}% en la colección`}
                  {promotion.endDate && ` · Hasta el ${formatDay(promotion.endDate)}`}
                </span>
                <h2>{promotion.title}</h2>
                <p>{promotion.description}</p>
                <PromotionLink promotion={promotion} />
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="products-section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <h2 id="featured-title">{hasFeatured ? 'Destacados' : 'Recién llegados'}</h2>
            <p>{hasFeatured ? 'Lo que recomendamos esta temporada.' : 'Lo último que sumamos al catálogo.'}</p>
          </div>
          <Link className="section-link" to="/catalogo">Ver todo el catálogo</Link>
        </div>

        {showcase.isLoading ? (
          <div className="empty-state" role="status">Cargando productos...</div>
        ) : showcase.error ? (
          <div className="empty-state" role="alert">
            <h3>No pudimos cargar los productos</h3>
            <p>{showcase.error} Verificá que el backend esté funcionando en el puerto 8080.</p>
            <button type="button" className="primary-button empty-button" onClick={showcase.retry}>Reintentar</button>
          </div>
        ) : (
          <div className="products-grid">
            {showcase.data?.products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      {/* Como las promociones: si fallan o no hay, no aparecen. */}
      {collections.data?.map((collection) => (
        <section key={collection.id} className="products-section is-collection" aria-labelledby={`coleccion-${collection.id}`}>
          <div className="section-heading">
            <div>
              <h2 id={`coleccion-${collection.id}`}>{collection.title}</h2>
              {collection.description && <p>{collection.description}</p>}
            </div>
            <Link className="section-link" to={`/colecciones/${collection.id}`}>
              {collection.products.length > COLLECTION_PREVIEW ? `Ver los ${collection.products.length}` : 'Ver la colección'}
            </Link>
          </div>
          <div className="products-grid">
            {collection.products.slice(0, COLLECTION_PREVIEW).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ))}

      <section className="contact-section" aria-labelledby="contact-title">
        <div>
          <h2 id="contact-title">¿No encontrás lo que buscás?</h2>
          <p>Contanos qué equipo necesitás y te respondemos con disponibilidad y precio. No hace falta crear una cuenta.</p>
        </div>
        <Link className="primary-button" to="/contacto">Enviar una consulta</Link>
      </section>
    </main>
  )
}

export default HomePage
