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
  consultas, la información del comercio y las cuentas de los demás
  administradores. Es el único tipo de cuenta del sistema: el seed crea uno de
  demostración y los demás los da de alta un administrador desde el panel. No
  hay registro público.

## Sitio público

- **Inicio**: presentación del comercio, las categorías principales (con
  cantidad de productos y precio desde) que llevan al catálogo ya filtrado, las
  promociones vigentes y los productos destacados (o los más nuevos, si no hay
  destacados).
- **Catálogo** (`/catalogo`): solo los productos publicados, paginados de a 12.
  El backend filtra, ordena y pagina, así que solo viaja la página visible. Cada tarjeta
  muestra nombre, categoría, imagen, descripción, precio (con el de lista
  tachado y el porcentaje si tiene descuento) y disponibilidad ("En stock",
  "Quedan 2", "Última unidad" o "Sin stock").
- **Búsqueda, filtros y orden**: búsqueda por texto en nombre y descripción y
  orden por más recientes, precio o nombre. Los filtros están en un panel
  lateral: una o varias categorías, rango de precio (desde/hasta, con el
  precio más bajo y más alto como sugerencia), solo con stock y solo ofertas. Los filtros aplicados se muestran como chips que se quitan de a uno,
  y quedan en la URL para compartir la búsqueda. Si no hay resultados, el
  catálogo ofrece pedir el producto por el formulario de contacto.
- **Detalle de producto**: galería con todas las imágenes del producto, precio,
  disponibilidad, descripción y un botón para consultar por ese producto, que
  abre el formulario de contacto con el producto y el asunto completos. Sin
  stock, el botón pasa a "Avisame cuando entre". Abajo se muestran otros
  productos de la misma categoría.
- **Nosotros**: nombre, descripción, dirección, teléfono, horarios y redes
  sociales del comercio.
- **Contacto**: datos del comercio y formulario con nombre, email, teléfono
  opcional, asunto y mensaje. La consulta se guarda como pendiente, se avisa por
  mail a los administradores y el visitante recibe un mail de confirmación.
- **Página no encontrada**: cualquier dirección que no existe muestra una
  página propia con accesos al catálogo, al contacto y al inicio.

## Cuenta del administrador

- **Alta de administradores** desde el panel, por otro administrador: nombre y
  apellido, email y teléfono. No puede haber dos cuentas con el mismo email. La
  persona recibe un correo con un enlace para elegir su contraseña (vence a las
  72 horas); quien la invita nunca la conoce.
- **Inicio y cierre de sesión**. La sesión es un JWT que vence a la hora. Si
  vence o se cierra mientras se usa el panel, la siguiente operación lleva al
  login con un aviso. Los intentos fallidos de login tienen un límite por IP.
- **Recuperación de contraseña**: se pide con el email y llega un correo con un
  enlace de un solo uso que vence a los 15 minutos. La respuesta es la misma
  exista o no la cuenta, para no revelar qué emails están registrados.
- **Perfil**: modificación de los datos personales y cambio de contraseña.
  Cambiar o restablecer la contraseña cierra las sesiones abiertas en otros
  dispositivos y anula los enlaces de recuperación pendientes. Las contraseñas
  tienen entre 8 caracteres y 72 bytes, el máximo que usa bcrypt.

## Área de administración (`/admin`)

- **Resumen**: dashboard con productos publicados, sin stock y destacados,
  consultas pendientes, productos por categoría y consultas por estado.
- **Productos**: listado con búsqueda y filtro por categoría (incluye los
  ocultos), alta, edición, eliminación con confirmación, y publicar u ocultar
  con un clic. Cada producto tiene varias imágenes (subidas desde la
  computadora o por URL, la primera es la principal), puede marcarse como
  destacado para aparecer en el inicio y puede tener un descuento en porcentaje
  (hasta 90 %); el sitio muestra el precio final y el anterior tachado.
- **Promociones**: avisos para el inicio con título, descripción, imagen
  opcional, fechas de vigencia opcionales y una categoría a la que llevan (o,
  sin categoría, a los productos con descuento). Se encienden y apagan con un
  clic, y el listado muestra si cada una se ve hoy, empieza más adelante o venció.
- **Categorías**: alta, edición y eliminación. Los nombres no se repiten (sin
  distinguir mayúsculas) y no se puede eliminar una categoría con productos.
- **Consultas**: bandeja paginada (de a 20) de la más nueva a la más vieja con
  filtro por estado; marcar como pendiente, leída o respondida; eliminar; y
  responder desde el panel, sin abrir un cliente de correo: la respuesta le
  llega por mail al visitante, queda guardada en la consulta con su autor y la
  consulta pasa a respondida. Si el visitante contesta ese mail, le llega a
  quien respondió. También se puede llamar desde el enlace del teléfono.
- **Información del comercio**: crear y modificar nombre, descripción,
  dirección, teléfono, horarios y redes sociales.
- **Administradores**: listado de las cuentas, alta por invitación y
  eliminación (nadie puede eliminar su propia cuenta, así que siempre queda al
  menos uno). Una cuenta eliminada pierde el acceso en el acto.

## Cumplimiento de la consigna

| Requerimiento | Dónde |
| --- | --- |
| Información general del comercio | Páginas Nosotros y Contacto |
| Ver productos con nombre, categoría, imagen, descripción, precio y disponibilidad | Catálogo (`/catalogo`), destacados del inicio y detalle de producto |
| Buscar y filtrar por categoría | Catálogo (`/catalogo`); las categorías del inicio llevan al catálogo filtrado |
| Consultar contacto y enviar consultas | Página Contacto |
| Registro, login, logout, recuperar contraseña, modificar datos | Panel → Administradores (alta por invitación), pantallas de cuenta y Mi perfil |
| Administrar información institucional | Panel → Información del comercio |
| Crear, modificar, eliminar y activar/desactivar publicaciones | Panel → Productos |
| Al menos 20 productos precargados | El seed carga 108 |
| ABM de categorías | Panel → Categorías |
| Gestión de consultas con estados pendiente, leída y respondida | Panel → Consultas (incluye responder desde la web) |
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
