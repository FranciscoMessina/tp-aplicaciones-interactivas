export type Product = {
  id: number
  name: string
  category: string
  description: string
  price: number
  available: boolean
  icon: string
  featured?: boolean
}

// Datos temporales para construir y probar el frontend sin MongoDB.
// Se reemplazarán por las respuestas de la API REST en otro PR.
export const products: Product[] = [
  {
    id: 1,
    name: 'Notebook Lenovo IdeaPad',
    category: 'Notebooks',
    description: 'Notebook para estudiar, trabajar y disfrutar de tus contenidos.',
    price: 850000,
    available: true,
    icon: '💻',
    featured: true,
  },
  {
    id: 2,
    name: 'Mouse Logitech G203',
    category: 'Periféricos',
    description: 'Mouse preciso y cómodo para uso diario o gaming.',
    price: 35000,
    available: true,
    icon: '🖱️',
  },
  {
    id: 3,
    name: 'Teclado Redragon Kumara',
    category: 'Periféricos',
    description: 'Teclado mecánico compacto para tu escritorio.',
    price: 65000,
    available: true,
    icon: '⌨️',
  },
  {
    id: 4,
    name: 'Monitor Samsung 24 pulgadas',
    category: 'Monitores',
    description: 'Pantalla de 24 pulgadas para trabajar o jugar.',
    price: 220000,
    available: false,
    icon: '🖥️',
  },
  {
    id: 5,
    name: 'Auriculares HyperX Cloud II',
    category: 'Audio',
    description: 'Sonido envolvente y comodidad durante horas.',
    price: 120000,
    available: true,
    icon: '🎧',
    featured: true,
  },
  {
    id: 6,
    name: 'SSD Kingston 1 TB',
    category: 'Almacenamiento',
    description: 'Más velocidad y espacio para tus archivos.',
    price: 95000,
    available: true,
    icon: '💾',
  },
  {
    id: 7,
    name: 'Parlante JBL Go',
    category: 'Audio',
    description: 'Música portátil en un tamaño compacto.',
    price: 79000,
    available: true,
    icon: '🔊',
  },
  {
    id: 8,
    name: 'Monitor LG UltraGear 27 pulgadas',
    category: 'Monitores',
    description: 'Pantalla de 27 pulgadas para una experiencia inmersiva.',
    price: 410000,
    available: true,
    icon: '🖥️',
    featured: true,
  },
]
