# Descripción funcional

TechStore es el sitio web de un comercio de tecnología. Tiene un sitio público
donde cualquiera mira el catálogo y deja consultas, y un área privada donde los
administradores mantienen el contenido. No hay carrito ni ventas online: el
objetivo es promocionar los productos y recibir consultas.

## Roles

- **Visitante**: cualquier persona, sin cuenta. Navega y busca en el catálogo,
  ve el detalle de cada producto, conoce la información del comercio y envía
  consultas.
- **Administrador**: gestiona su perfil, los productos, las categorías, las
  consultas y la información del comercio. Es el único tipo de cuenta del
  sistema: el seed crea uno de demostración y cualquier otro se registra desde
  la pantalla de registro.

## Sitio público

- **Inicio**: presentación del comercio, productos destacados y catálogo.
- **Catálogo**: solo los productos publicados, paginados de a 12. Cada tarjeta
  muestra nombre, categoría, imagen, descripción, precio y disponibilidad
  ("Disponible" o "Sin stock").
- **Búsqueda, filtros y orden**: búsqueda por texto en nombre y descripción,
  filtro por categoría y por disponibilidad, y orden por más recientes, precio
  o nombre.
- **Detalle de producto**: galería con todas las imágenes del producto, precio,
  disponibilidad, descripción y un botón para consultar por ese producto, que
  abre el formulario de contacto con el asunto completo.
- **Nosotros**: nombre, descripción, dirección, teléfono, horarios y redes
  sociales del comercio.
- **Contacto**: datos del comercio y formulario con nombre, email, teléfono
  opcional, asunto y mensaje. La consulta se guarda como pendiente, se avisa por
  mail a los administradores y el visitante recibe un mail de confirmación.

## Cuenta del administrador

- **Registro** con nombre y apellido, email, teléfono y contraseña (mínimo 8
  caracteres). No puede haber dos cuentas con el mismo email.
- **Inicio y cierre de sesión**. La sesión es un JWT que vence a la hora.
- **Recuperación de contraseña**: se pide con el email y llega un correo con un
  enlace de un solo uso que vence a los 15 minutos. La respuesta es la misma
  exista o no la cuenta, para no revelar qué emails están registrados.
- **Perfil**: modificación de los datos personales y cambio de contraseña.

## Área de administración (`/admin`)

- **Resumen**: dashboard con productos publicados, sin stock y destacados,
  consultas pendientes, productos por categoría y consultas por estado.
- **Productos**: listado con búsqueda y filtro por categoría (incluye los
  ocultos), alta, edición, eliminación con confirmación, y publicar u ocultar
  con un clic. Cada producto tiene varias imágenes (subidas desde la
  computadora o por URL, la primera es la principal) y puede marcarse como
  destacado para aparecer en el inicio.
- **Categorías**: alta, edición y eliminación. Los nombres no se repiten (sin
  distinguir mayúsculas) y no se puede eliminar una categoría con productos.
- **Consultas**: listado de la más nueva a la más vieja con filtro por estado;
  marcar como pendiente, leída o respondida; eliminar; y responder por mail o
  llamar desde los enlaces de cada consulta.
- **Información del comercio**: crear y modificar nombre, descripción,
  dirección, teléfono, horarios y redes sociales.

## Cumplimiento de la consigna

| Requerimiento | Dónde |
| --- | --- |
| Información general del comercio | Páginas Nosotros y Contacto |
| Ver productos con nombre, categoría, imagen, descripción, precio y disponibilidad | Catálogo del inicio y detalle de producto |
| Buscar y filtrar por categoría | Catálogo del inicio |
| Consultar contacto y enviar consultas | Página Contacto |
| Registro, login, logout, recuperar contraseña, modificar datos | Pantallas de cuenta y Mi perfil |
| Administrar información institucional | Panel → Información del comercio |
| Crear, modificar, eliminar y activar/desactivar publicaciones | Panel → Productos |
| Al menos 20 productos precargados | El seed carga 108 |
| ABM de categorías | Panel → Categorías |
| Gestión de consultas con estados pendiente, leída y respondida | Panel → Consultas |
| React Router, componentes reutilizables, API REST, persistencia | `frontend/src/App.tsx`, `frontend/src/components`, `backend/` |
| Manejo de errores | Formato único de errores en la API y mensajes en cada pantalla |
| Validaciones en frontend y backend | Formularios del front y schemas de Zod del back |
| Autenticación y autorización | JWT y middlewares `authenticate` / `requireAdmin` |
| Diseño responsive | Todas las pantallas se adaptan a celulares |

### Funcionalidades adicionales

- **Envío de correos desde el formulario de contacto**: aviso a los
  administradores y confirmación al visitante (además del correo de
  recuperación de contraseña).
- **Dashboard con métricas**: pestaña Resumen del panel.
- **Múltiples imágenes por publicación**: carga y orden en el panel, galería en
  el detalle.
- **Publicación destacada**: marca en el panel y sección de destacados en el
  inicio.
