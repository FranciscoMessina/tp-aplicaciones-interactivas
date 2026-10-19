# Diagrama de navegación

Las rutas del frontend están en `frontend/src/App.tsx`. El encabezado (Inicio,
Productos, Nosotros, Contacto) y el pie de página están en todas las pantallas;
el enlace **Administración** del pie lleva al login o, con la sesión iniciada,
al panel.

```mermaid
flowchart TD
    subgraph Publico["Sitio público (visitantes)"]
        Inicio["/ Inicio<br/>destacados + catálogo<br/>búsqueda y filtros"]
        Detalle["/productos/:id<br/>Detalle con galería"]
        Nosotros["/nosotros<br/>Información del comercio"]
        Contacto["/contacto<br/>Formulario de consulta"]
    end

    subgraph Cuenta["Cuenta del administrador"]
        Login["/login<br/>Iniciar sesión"]
        Registro["/registro<br/>Crear cuenta"]
        Recuperar["/recuperar-contrasena"]
        Restablecer["/restablecer-contrasena?token=..."]
    end

    subgraph Panel["Área privada (requiere sesión)"]
        Resumen["/admin/resumen<br/>Dashboard"]
        Productos["/admin/productos"]
        Categorias["/admin/categorias"]
        Consultas["/admin/consultas"]
        Comercio["/admin/comercio"]
        Perfil["/perfil<br/>Datos y contraseña"]
    end

    Inicio -->|tarjeta de producto| Detalle
    Detalle -->|Consultar por este producto| Contacto
    Detalle -->|Volver al catálogo| Inicio
    Nosotros -->|Contactanos| Contacto

    Inicio -.->|pie: Administración| Login
    Login --> Registro
    Registro --> Login
    Login -->|¿Olvidaste tu contraseña?| Recuperar
    Recuperar -.->|enlace del mail| Restablecer
    Restablecer --> Login

    Login -->|sesión iniciada| Resumen
    Registro -->|cuenta creada| Resumen
    Resumen <--> Productos
    Resumen <--> Categorias
    Resumen <--> Consultas
    Resumen <--> Comercio
    Resumen -->|encabezado: Mi perfil| Perfil
    Perfil -->|Volver al panel| Resumen
```

## Pantallas

| Ruta | Acceso | Qué se hace |
| --- | --- | --- |
| `/` | Público | Destacados, catálogo paginado con búsqueda, filtro por categoría y disponibilidad, y orden |
| `/productos/:id` | Público | Detalle del producto con todas sus imágenes y acceso a consultar |
| `/nosotros` | Público | Descripción, dirección, teléfono, horarios y redes del comercio |
| `/contacto` | Público | Formulario de consulta y datos de contacto |
| `/login`, `/registro` | Sin sesión | Ingreso y registro de administradores (con sesión redirigen al panel) |
| `/recuperar-contrasena`, `/restablecer-contrasena` | Público | Pedir el enlace de recuperación y elegir una contraseña nueva |
| `/admin` | Con sesión | Redirige a `/admin/resumen` |
| `/admin/resumen` | Con sesión | Métricas del catálogo y de las consultas |
| `/admin/productos` | Con sesión | ABM de productos, publicar/ocultar, destacar e imágenes |
| `/admin/categorias` | Con sesión | ABM de categorías |
| `/admin/consultas` | Con sesión | Ver, cambiar de estado y eliminar consultas |
| `/admin/comercio` | Con sesión | Editar la información institucional |
| `/perfil` | Con sesión | Modificar datos personales y contraseña |

Sin sesión, las rutas privadas redirigen a `/login`. Cualquier ruta
desconocida redirige al inicio.
