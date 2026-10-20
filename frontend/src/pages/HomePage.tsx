import { useMemo, useRef } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { formatPrice } from '../utils/format'

const FEATURED_LIMIT = 8

// Categorías con más productos que se listan en la tabla del inicio.
const MAIN_CATEGORIES = 6

// El inicio se dibuja como un chip DIP de 24 patas visto desde arriba, con la muesca a la izquierda:
// abajo van de la 1 a la 12 y arriba siguen de la 13 a la 24, de derecha a izquierda.
const PINS_PER_SIDE = 12
const BOTTOM_PINS = Array.from({ length: PINS_PER_SIDE }, (_, index) => index + 1)
const TOP_PINS = BOTTOM_PINS.map((pin) => PINS_PER_SIDE * 2 + 1 - pin)

function HomePage() {
  const { products, isLoading, error, retry } = useProducts()
  const probed = useRef(-1)

  // Cantidad, precio más bajo y algunos nombres de ejemplo por categoría.
  const mainCategories = useMemo(() => {
    const stats = new Map<string, { count: number; minPrice: number; examples: string[] }>()
    for (const product of products) {
      const name = product.category?.name
      if (!name) continue
      const stat = stats.get(name) ?? { count: 0, minPrice: product.price, examples: [] }
      stat.count += 1
      stat.minPrice = Math.min(stat.minPrice, product.price)
      if (stat.examples.length < 5) stat.examples.push(product.name)
      stats.set(name, stat)
    }
    return Array.from(stats, ([name, stat]) => ({ name, ...stat })).sort((a, b) => b.count - a.count)
      .slice(0, MAIN_CATEGORIES)
  }, [products])

  // Sin destacados cargados, mostramos lo último que entró.
  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, FEATURED_LIMIT)
  const hasFeatured = featuredProducts.length > 0
  const shownProducts = hasFeatured ? featuredProducts : products.slice(0, FEATURED_LIMIT)

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

      {!error && (
        <nav className="order-table" aria-label="Categorías principales">
          {isLoading
            ? Array.from({ length: MAIN_CATEGORIES + 1 }, (_, index) => <div key={index} className="order-row is-placeholder" aria-hidden="true" />)
            : (
                <>
                  {mainCategories.map((stat, index) => (
                    <Link key={stat.name} className="order-row" to={`/catalogo?categoria=${encodeURIComponent(stat.name)}`}>
                      <span className="order-code" aria-hidden="true">C-{String(index + 1).padStart(2, '0')}</span>
                      <span className="order-name">{stat.name}</span>
                      <span className="order-examples">{stat.examples.join(', ')}</span>
                      <span className="order-count">{stat.count} {stat.count === 1 ? 'producto' : 'productos'}</span>
                      <span className="order-price">desde {formatPrice(stat.minPrice)}</span>
                    </Link>
                  ))}
                  <Link className="order-row is-all" to="/catalogo">
                    <span className="order-code" aria-hidden="true">C-00</span>
                    <span className="order-name">Todo el catálogo</span>
                    <span className="order-examples" />
                    <span className="order-count">{products.length} productos</span>
                    <span className="order-price">Buscar y filtrar</span>
                  </Link>
                </>
              )}
        </nav>
      )}

      <section className="products-section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <h2 id="featured-title">{hasFeatured ? 'Destacados' : 'Recién llegados'}</h2>
            <p>{hasFeatured ? 'Lo que recomendamos esta temporada.' : 'Lo último que sumamos al catálogo.'}</p>
          </div>
          <Link className="section-link" to="/catalogo">Ver todo el catálogo</Link>
        </div>

        {isLoading ? (
          <div className="empty-state" role="status">Cargando productos...</div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <h3>No pudimos cargar los productos</h3>
            <p>{error} Verificá que el backend esté funcionando en el puerto 8080.</p>
            <button type="button" className="primary-button empty-button" onClick={retry}>Reintentar</button>
          </div>
        ) : (
          <div className="products-grid">
            {shownProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

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
