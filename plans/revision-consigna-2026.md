# Revisión de TechStore contra la consigna

Fecha: 20/10/2026. Base: commit `81217e3`, incluyendo los cambios locales presentes al comenzar la revisión. No se modificó código fuente ni la base de datos. Este es un informe de auditoría, no un plan de implementación.

## Dictamen

La implementación cubre en código los principales requisitos funcionales de las cuatro páginas de la consigna. No encontré un módulo obligatorio completamente ausente. Sin embargo, no corresponde considerarla perfecta ni certificar su funcionamiento integral sin probarla contra Atlas, SMTP y un navegador en escritorio y móvil.

La evaluación asigna 40% a funcionalidades/calidad técnica, 40% a diseño/usabilidad y 20% a documentación/presentación. Conviene cerrar errores de sesión y formularios, mejorar las imágenes y actualizar la documentación antes de sumar funcionalidades.

## Cumplimiento observado

- Tecnologías: React, HTML/CSS y TypeScript compilado a JavaScript; Node y Express; MongoDB. Los comandos utilizados fueron exclusivamente Node y npm.
- Arquitectura: frontend y backend separados. Backend con rutas, middleware, controllers, servicios y modelos; frontend con páginas, componentes y servicios. No hace falta introducir otra capa de repositorios para satisfacer la arquitectura en capas.
- Sitio público: información institucional, contacto, catálogo, búsqueda, filtro por categoría, detalle, precio y disponibilidad. El catálogo está ahora en `/catalogo`.
- Administración de cuentas: registro, login, logout local del JWT, recuperación, edición de perfil y cambio de contraseña. El email se normaliza y tiene índice único.
- Información institucional: nombre, descripción, dirección, teléfono, redes y horarios; creación/actualización mediante PUT.
- Productos: alta, edición, eliminación, activación/desactivación, categoría, imágenes, precio y stock. Los inactivos se protegen en listado y detalle públicos.
- Precarga: el catálogo del seed contiene 108 productos en 11 categorías; por su regla de activación, 98 quedan publicados. Se verificó el código del seed, no el contenido de una base desplegada.
- Categorías: alta, edición y eliminación; nombres únicos sin distinguir mayúsculas y control de productos asociados antes de eliminar.
- Consultas: formulario con los campos exigidos; persistencia; listado, eliminación y estados pendiente, leída y respondida.
- Requisitos técnicos: React Router, componentes reutilizables, API REST, persistencia, errores normalizados, validación en ambos lados y middleware de autenticación/autorización. Hay estilos responsive; su resultado visual no fue verificado en dispositivos.
- Documentación: existen descripción funcional, modelo de datos, diagrama de navegación, instalación, fuentes y seed. Parte de la navegación documentada quedó desactualizada.
- Extras presentes: dashboard, varias imágenes, destacados y código para enviar correos. La API ofrece búsqueda avanzada; el catálogo público usa búsqueda local más simple. No hay módulo propio de promociones: es opcional.

## Verificación realizada

- Backend: `npm run typecheck`, `npm run lint` y `npm run build`: correctos.
- Frontend: `npm run build`: correcto. `npm run lint`: correcto con una advertencia `react(set-state-in-effect)` en `src/pages/AdminProductsPage.tsx:77`.
- Ocho comprobaciones HTTP sobre la aplicación compilada, sin conectar MongoDB: ruta inexistente 404; perfil y creación de productos sin token 401; ID inválido, página inválida, consulta vacía, registro vacío y JSON malformado 400. Todas devolvieron el formato esperado.
- `npm audit --json`: frontend sin vulnerabilidades reportadas; backend con tres dependencias transitivas reportadas (una crítica, una alta y una moderada). El primer intento falló por certificados; el reintento usando las CA del sistema funcionó, sin desactivar TLS.
- No hay scripts de pruebas automatizadas en ninguno de los dos package.json. La colección Bruno es útil para probar la API, pero no reemplaza una suite ejecutada automáticamente.

## Hallazgos prioritarios

S = horas; M = aproximadamente un día; L = varios días. El esfuerzo incluye verificación. El riesgo se refiere al cambio propuesto. Salvo donde se aclara, la confianza es alta por lectura directa del código; no implica reproducción integral con servicios externos.

### 1. Recuperar correctamente una sesión vencida

- Evidencia: `frontend/src/context/AuthContext.tsx:30`, `frontend/src/services/api.ts:71`, `frontend/src/App.tsx:83`.
- Impacto: el perfil se verifica al cambiar el token; un 401 posterior no limpia la sesión. El usuario sigue siendo redirigido del login al panel y debe cerrar sesión manualmente para ingresar otra vez.
- Recomendación: invalidar la sesión ante 401 de una petición autenticada y mostrar el motivo al regresar al login. Distinguir ese caso de credenciales incorrectas en un login.
- Esfuerzo S; riesgo bajo; confianza alta.

### 2. Hacer visible y recuperable el error de carga de categorías

- Evidencia: `frontend/src/pages/AdminProductsPage.tsx:68` y `:70`; `frontend/src/components/ProductFormModal.tsx:54`.
- Impacto: una falla temporal deja el selector sin opciones e impide crear productos; el error se descarta y reintentar el listado no recarga categorías.
- Recomendación: manejar carga, error y reintento de categorías. Diferenciar una falla de una lista realmente vacía y ofrecer acceso a crear categorías cuando corresponda.
- Esfuerzo S; riesgo bajo; confianza alta.

### 3. Completar y demostrar la entrega real de correos

- Evidencia: `backend/src/config/env.ts:61`, `backend/src/services/mail.service.ts:30` y `:47`.
- Impacto: sin SMTP se imprime el correo en consola; el usuario no recibe el enlace de recuperación ni la confirmación. Es una modalidad de desarrollo documentada, no una funcionalidad eliminada. No se verificó un despliegue con SMTP.
- Recomendación: configurar un transporte real para la demostración y verificar recuperación y notificaciones. Restringir el fallback de consola a desarrollo: imprime datos personales y el enlace de recuperación.
- Esfuerzo S más configuración; riesgo bajo; confianza alta sobre el comportamiento, entrega externa pendiente de probar.

### 4. Reemplazar las fotos genéricas de la precarga

- Evidencia: `backend/src/scripts/seed.ts:74` utiliza URLs de Picsum sin vinculación con el producto.
- Impacto: las imágenes no garantizan representar la consola, notebook o accesorio publicado. Esto reduce la claridad del catálogo y la calidad de la presentación, especialmente relevante al 40% dedicado a diseño y experiencia.
- Recomendación: usar imágenes correspondientes a los productos y comprobar disponibilidad de sus archivos. No ejecutar el seed sobre datos que se quieran conservar: su borrado está explícitamente documentado.
- Esfuerzo M; riesgo bajo; confianza alta.

### 5. Actualizar el diagrama y la descripción funcional

- Evidencia: `docs/diagrama-de-navegacion.md:11` y `:59` ubican búsqueda y catálogo paginado en `/`; `frontend/src/App.tsx:79` define `/catalogo`. `docs/descripcion-funcional.md:20` y su matriz también conservan referencias al catálogo del inicio.
- Impacto: un documento obligatorio describe una navegación diferente a la implementación actual.
- Recomendación: incorporar `/catalogo`, sus entradas desde el inicio y el retorno desde el detalle; corregir la descripción y matriz de cumplimiento.
- Esfuerzo S; riesgo bajo; confianza alta.

### 6. Proteger la recuperación después de cambiar la contraseña

- Evidencia: `backend/src/services/user.service.ts:165` cambia el hash sin limpiar recuperaciones pendientes; `:207` cambia el hash al recuperar; `backend/src/middleware/auth.ts:56` valida solo el JWT.
- Impacto: los JWT anteriores siguen vigentes hasta expirar después de cambiar o recuperar la contraseña. Un enlace de recuperación anterior también sigue vigente si el cambio se hizo desde el perfil.
- Recomendación: limpiar los tokens de recuperación pendientes al cambiar contraseña; para invalidar sesiones anteriores, incorporar una versión o fecha de sesión comprobada al autenticar.
- Esfuerzo S para limpiar recuperaciones, M para sesiones; riesgo bajo/medio; confianza alta. Es una mejora de seguridad, no un requisito explícito de revocación en el PDF. El logout local está documentado y no se considera por sí solo un incumplimiento.

### 7. Establecer pruebas de los recorridos importantes

- Evidencia: `backend/package.json:6`, `frontend/package.json:6`; no hay suite de tests en los árboles auditados.
- Impacto: build y lint no detectan regresiones de sesión, formularios, permisos, estados ni persistencia.
- Recomendación: un comando npm reproducible con casos de login/401, error de categorías, productos activos/inactivos, validación, email duplicado, contacto y recuperación. Las integraciones deben usar una base de prueba aislada.
- Esfuerzo M para una cobertura inicial; riesgo bajo; confianza alta. La consigna no exige un framework de testing específico.

## Mejoras posteriores

### 8. Actualizar dependencias con avisos, verificando su alcance

- Evidencia: `backend/package-lock.json:829` (`brace-expansion` 5.0.9), `:2397` (`proxy-addr` 2.0.7), `:2435` (`qs` 6.15.3); salida actual de npm audit y árbol obtenido con npm ls.
- Impacto: npm reporta severidad alta para brace-expansion, crítica para proxy-addr y moderada para qs. Brace-expansion llega por ESLint y es tooling. Proxy-addr llega por Express, pero el proyecto no habilita trust proxy; no se demostró explotabilidad del aviso en la configuración actual. No corresponde afirmar una vulnerabilidad crítica explotable de la aplicación solo por el conteo.
- Recomendación: actualizar las transitivas afectadas de forma compatible, revisar el diff del lockfile y repetir build/lint/audit. No usar actualizaciones forzadas sin revisión.
- Esfuerzo S; riesgo bajo/medio; confianza alta en el reporte, alcance de explotación no verificado.

### 9. Evitar descargar todo el catálogo antes de mostrar productos

- Evidencia: `frontend/src/services/products.ts:14`, `frontend/src/hooks/useProducts.ts:19`, `frontend/src/pages/CatalogPage.tsx:47`.
- Impacto: recorre páginas de 100 secuencialmente y recién después pagina en el cliente. El inicio también descarga todo para mostrar hasta ocho productos. Con los 98 activos del seed alcanza una solicitud; el problema aparece al crecer y se repite al montar cada pantalla.
- Recomendación: aprovechar la paginación y filtros del backend conservando los filtros de stock y orden que hoy ofrece el frontend. No agregar infraestructura de caché compleja para el volumen actual.
- Esfuerzo M; riesgo medio; confianza alta. No bloquea la entrega actual.

### 10. Limitar intentos y comprobar el contenido de archivos

- Evidencia: `backend/src/routes/user.routes.ts:20`, `backend/src/routes/enquiry.routes.ts:14`, `backend/src/middleware/upload.ts:36`.
- Impacto: login, recuperación y contacto no tienen límites de frecuencia; las imágenes se aceptan según el MIME declarado, sin comprobar que su contenido sea una imagen. La autenticación y el máximo de 5 MB sí existen.
- Recomendación: límites específicos en endpoints públicos y validación del contenido antes de publicar imágenes.
- Esfuerzo S/M; riesgo medio para límites, bajo para archivos; confianza alta. Priorizar antes de una exposición pública real.

### 11. Resolver las escrituras concurrentes de estados

- Evidencia: `backend/src/services/enquiry.service.ts:44`, `:57` y `:65`.
- Impacto: dos administradores pueden validar sobre el mismo estado anterior y sobrescribir cambios; las transiciones permitidas no quedan protegidas de forma atómica.
- Recomendación: actualización condicional por estado anterior o concurrencia optimista, devolviendo conflicto cuando corresponda.
- Esfuerzo S; riesgo bajo; confianza alta.

### 12. Rechazar contraseñas que bcrypt truncaría

- Evidencia: `backend/src/schemas/user.schema.ts:8`, `:28`, `:35`; `backend/src/services/auth.service.ts:21`.
- Impacto: se admite cualquier longitud superior al mínimo, pero bcrypt trunca a 72 bytes. Se corroboró con `bcrypt.truncates` de la dependencia instalada; el límite es en bytes, no caracteres.
- Recomendación: validar el límite en registro, cambio y recuperación y mostrar el mismo contrato en el frontend; contemplar contraseñas existentes.
- Esfuerzo S; riesgo bajo/medio; confianza alta.

### 13. Asociar mensajes de error a los campos

- Evidencia: `frontend/src/components/ProductFormModal.tsx:171`, `:172`, `:178`, `:186`; `frontend/src/pages/AdminCategoriesPage.tsx:56`.
- Impacto: se marca aria-invalid, pero los errores no están vinculados por aria-describedby; un lector de pantalla puede no anunciar la explicación al enfocar el campo.
- Recomendación: identificar y asociar mensajes y enfocar el primer campo inválido al rechazar el formulario.
- Esfuerzo S; riesgo bajo; confianza alta.

### 14. Crecimiento de la bandeja y consultas sin texto

- Evidencia: `backend/src/services/enquiry.service.ts:25` devuelve todas las consultas; `backend/src/models/product.model.ts:39` declara Atlas Search pero no índices normales para los filtros/órdenes usados por `backend/src/services/catalog.service.ts:135`.
- Impacto: crecimiento del payload de consultas y posible costo de lectura/ordenamiento del catálogo. No se midieron tiempos ni se inspeccionaron índices creados por fuera del modelo.
- Recomendación: paginar consultas cuando el volumen lo justifique y estudiar índices con explain antes de agregarlos. No es necesario optimizar esto para 108 productos sin evidencia de lentitud.
- Esfuerzo M para paginación, S para investigación; riesgo medio/bajo; confianza alta en ausencia de paginación y media en rendimiento/índices.

## Decisiones y extras: no confundir con faltantes

- Registro de administradores: el PDF exige que el administrador pueda registrarse; no exige cuentas de clientes. El diseño actual hace administrador a cualquier persona que se registre y le permite administrar el mismo comercio, incluida la lectura de consultas. Es coherente con la decisión documentada, pero requiere una política de altas autorizadas antes de abrirlo a Internet, por ejemplo invitación o aprobación. No hace falta inventar un rol cliente ni un sistema multicomercio para resolverlo.
- Atlas Search: su uso es una decisión documentada. El buscador del panel depende de Atlas y del índice; el público usa filtrado local. Hay que demostrar ambos con el entorno previsto y no presentar esa dependencia como un módulo ausente.
- Promociones/novedades: no hay módulo propio, pero es extra. Se podría agregar una novedad destacada si aporta valor; requiere datos y mantenimiento adicionales. No lo priorizaría sobre errores y presentación.
- Buscador avanzado: la API ya tiene precio y relevancia; exponer un rango de precio en el catálogo sería una ampliación acotada. No es un filtro obligatorio según el PDF y requiere alinear la búsqueda pública con la API.
- No se propone carrito, checkout, microservicios, otra base ni una capa nueva por sí misma: no aportan al alcance exigido.
- No se encontró una necesidad de reescribir la arquitectura. Tampoco se considera que falte autorización solo por existir un único rol de cuenta: las rutas de escritura tienen controles en backend.

## Límites y próximos pasos

No se ejecutaron el seed ni operaciones de escritura contra la base. No se verificaron datos reales, índices reales, funcionamiento de Atlas Search, entrega SMTP, despliegue, imágenes remotas ni navegación/responsive/accesibilidad visual en navegador. Tampoco se realizó una prueba de carga o auditoría de seguridad dinámica. La composición del grupo y la presentación oral no son verificables desde el repositorio.

Orden sugerido: categorías y sesión; correo e imágenes; documentación; pruebas de los recorridos críticos; luego seguridad y crecimiento según el destino del proyecto. La invalidación de sesiones debe coordinarse con el manejo de 401 del frontend. La paginación del catálogo requiere acordar filtros de backend y frontend. Cualquier refactor de autenticación o concurrencia debería incorporar sus pruebas en el mismo cambio.

Antes de entregar: recorrer el sitio en móvil y escritorio, demostrar persistencia tras recargar, buscar y filtrar, ocultar un producto y verificarlo como visitante, probar email duplicado, recibir un correo de recuperación y consumir el enlace una sola vez, gestionar los tres estados de consultas y seguir el manual de instalación en un entorno limpio.
