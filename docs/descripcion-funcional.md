# Descripción funcional

Sitio web de un comercio de tecnología. Tiene un sitio público donde cualquiera
mira el catálogo y deja consultas, y un área privada donde el administrador
mantiene el contenido. No hay carrito ni ventas online.

## Roles

- **Visitante**: cualquier persona, sin cuenta. Navega y busca en el catálogo,
  ve la información del comercio y envía consultas.
- **Administrador**: gestiona su perfil, el catálogo, las consultas y la
  información del comercio. Nadie se registra como administrador: el primero lo
  crea el script de la base y a los demás los crea otro administrador.

También existe el registro público de cuentas de cliente, que por ahora solo
pueden ver y editar su propio perfil.

## Sitio público

- **Información del comercio**: nombre, descripción, dirección, teléfono, redes
  sociales y horarios de atención.
- **Catálogo**: solo los productos activos, paginados. Cada uno muestra nombre,
  categoría, imágenes, descripción, precio y disponibilidad (con o sin stock).
  Cada producto tiene su página de detalle.
- **Búsqueda**: por texto sobre el nombre y la descripción, tolerando errores de
  tipeo, con autocompletado sobre el nombre.
- **Filtros y orden**: por categoría y rango de precio; orden por
  fecha de publicación, precio o relevancia de la búsqueda.
- **Contacto**: formulario con nombre, email, teléfono opcional, asunto y
  mensaje. La consulta queda guardada como pendiente.

## Cuenta

- Registro con nombre y apellido, email, teléfono y contraseña. No puede haber
  dos cuentas con el mismo email.
- Inicio y cierre de sesión.
- Modificación de los datos personales y cambio de contraseña.
- Recuperación de contraseña: se pide con el email y se recibe un token de un
  solo uso que vence a los 15 minutos. Todavía no se envía por mail, el token se
  escribe en la consola del servidor.

## Área de administración

- **Productos**: crear, modificar, eliminar, y activar o desactivar. Un
  producto desactivado desaparece del sitio público pero el administrador lo
  sigue viendo.
- **Categorías**: crear, modificar y eliminar. Una categoría con productos no se
  puede eliminar.
- **Consultas**: listar, filtrar por estado, marcar como pendiente, leída o
  respondida, y eliminar.
- **Información del comercio**: crear y modificar.
- **Administradores**: crear nuevas cuentas de administrador.
