# Modelo de datos

La base es MongoDB. Cada entidad es una colección; todas tienen `createdAt` y
`updatedAt`, y la API expone el `_id` como `id`. Los modelos están en
`backend/src/models`.

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : "agrupa"
    CATEGORY |o--o{ PROMOTION : "destino del aviso"
    COLLECTION |o--o{ PROMOTION : "destino y descuento"
    COLLECTION }o--o{ PRODUCT : "reune, en orden"
    PRODUCT ||--o{ PRODUCT_VIEW : "visitas por dia"
    CATEGORY {
        ObjectId _id
        string name "unico, sin distinguir mayusculas"
    }
    PRODUCT {
        ObjectId _id
        string name
        ObjectId category FK
        string description
        string[] images "URLs"
        number price "precio de lista"
        number discountPercent "0 a 90"
        number finalPrice "calculado: price con el descuento"
        number availableQuantity "0 = sin stock"
        boolean isActive "publicado o no"
        boolean isFeatured "destacado en el inicio"
    }
    PROMOTION {
        ObjectId _id
        string title
        string description
        string image "URL, opcional"
        ObjectId category FK "opcional"
        ObjectId linkedCollection FK "opcional, nunca junto con category"
        number discountPercent "1 a 90, solo con collection"
        string startDate "AAAA-MM-DD, opcional"
        string endDate "AAAA-MM-DD, opcional"
        boolean isActive
    }
    COLLECTION {
        ObjectId _id
        string title
        string description "opcional"
        ObjectId[] products FK "en el orden en que se muestran"
        boolean isActive
    }
    PRODUCT_VIEW {
        ObjectId _id
        ObjectId product FK
        string day "AAAA-MM-DD"
        number count
    }
    USER {
        ObjectId _id
        string fullName
        string email "unico"
        string phone
        string role "admin"
        string passwordHash "bcrypt, vacio hasta aceptar la invitacion"
        number sessionVersion "invalida tokens viejos"
        string passwordResetTokenHash "opcional"
        date passwordResetExpiresAt "opcional"
    }
    ENQUIRY {
        ObjectId _id
        string name
        string email
        string phone "opcional"
        string subject
        string message
        string status "PENDING | READ | RESOLVED"
        object[] replies "message, authorName, createdAt"
    }
    BUSINESS_INFO {
        ObjectId _id
        string name
        string description
        string address
        string phone
        string[] socialNetworks "URLs"
        string[] openingHours
    }
```

## Colecciones

**categories**: las categorías del catálogo. Tienen un índice único sobre
`name` con collation `es` de fuerza 2, así que "Consolas" y "consolas" cuentan
como el mismo nombre.

**products**: las publicaciones. `category` referencia a una categoría que
tiene que existir, y una categoría no se puede borrar mientras tenga productos.
Tienen un índice de Atlas Search (`productSearch`) para la búsqueda por texto,
con los filtros por categoría, precio, descuento y estado. Con un MongoDB que
no es Atlas el índice no existe y la búsqueda usa un respaldo con expresiones
regulares (ver la [API](api.md#búsqueda-por-texto)).
Al borrar un producto se borran sus visitas y se lo saca de las colecciones.
`finalPrice` se recalcula en un hook del modelo antes de cada validación, así
que vale para `create` y `save`; por eso los cambios de un producto se guardan
con `save` y no con un update directo. Se guarda para poder filtrar y ordenar
por el precio que se paga, también desde Atlas Search.

**promotions**: los avisos del inicio. `category` y `linkedCollection` son
opcionales (el campo no se llama `collection` porque Mongoose reserva ese nombre),
no pueden estar las dos y, si están, tienen que existir. `discountPercent` solo
vale con `linkedCollection`: mientras la promoción está vigente, los productos de esa
colección se muestran con ese descuento. No se copia a los productos: se aplica
al consultar, porque depende de la fecha (ver la [API](api.md#promociones)).
Una colección vinculada a una promoción no se puede borrar. Las fechas se guardan como texto `AAAA-MM-DD` para compararlas
con el día de hoy en Argentina sin problemas de zona horaria.

**collections**: selecciones de productos armadas a mano. `products` es una
lista de referencias en el orden en que se muestran, sin repetidos y con
productos que tienen que existir. Al público solo le llegan los productos
publicados.

**productviews**: cuántas veces se abrió la ficha de cada producto cada día. Es
un contador por producto y por día (índice único sobre `product` + `day`) que
se incrementa con `$inc` y se crea con la primera visita del día (`upsert`).
Así la colección crece a lo sumo un documento por producto por día y alcanza
para las métricas del panel. Tiene además un índice sobre `day`, el filtro de
esas métricas.

**users**: las cuentas de los administradores (no hay cuentas de clientes). `email` se guarda en minúsculas y tiene índice único.
Las crea otro administrador: la cuenta nace sin `passwordHash` y con un token de
invitación, que se usa igual que uno de recuperación. `sessionVersion` viaja en
cada JWT y aumenta al cambiar o restablecer la contraseña, lo que invalida los
tokens emitidos antes.
La contraseña y el token de recuperación se guardan hasheados y nunca salen en
las respuestas.

**enquiries**: las consultas del formulario de contacto. Arrancan en
`PENDING`; pueden pasar a `READ` o `RESOLVED` y siempre volver a `PENDING`,
pero una `RESOLVED` no pasa a `READ`. Las respuestas enviadas desde el panel
quedan dentro de la consulta en `replies`, con el nombre de quien respondió (no
una referencia, para que se conserve aunque esa cuenta se elimine). Tienen
índices sobre `createdAt` y `status` + `createdAt`, el orden y el filtro de la
bandeja paginada.

**businessinfos**: la información institucional. Hay un único documento, que se
crea o reemplaza con `PUT /api/business-info`.

## Creación de la base

MongoDB crea las colecciones al insertar el primer documento, y los índices
salen de los modelos. El script de creación de la base es
`backend/src/scripts/seed.ts`: `npm run seed` borra los datos, carga los de
demostración (el catálogo está en `backend/src/scripts/seed-catalog.ts`) y, si
la base es Atlas, crea el índice de Atlas Search (ver el
[README](../README.md#base-de-datos)).
