# Comercio

El sitio de un comercio unico: publica su catalogo y su informacion
institucional, y recibe consultas de visitantes. No hay carrito ni ventas — el
visitante mira y consulta, el administrador publica.

## Catalogo

**Catalog**:
El conjunto de Products y Categories que el comercio publica. Es una sola cosa,
no dos: una Category no se puede borrar mientras un Product la referencie, y un
Product no puede existir en una Category inexistente.
_Avoid_: Inventory, Store, Products (para referirse al conjunto entero)

**Product**:
Algo que el comercio publica para mostrar. Pertenece a exactamente una Category
y esta activo o inactivo; solo los activos aparecen en el catalogo publico.
_Avoid_: Publicacion, Item, Articulo, Listing

**Category**:
Una agrupacion de Products. Su nombre es unico en todo el Catalog.
_Avoid_: Rubro, Tipo, Seccion

## Visitantes y consultas

**Contact Form**:
Una consulta que un visitante deja para el comercio. Avanza de `PENDING` a
`READ` o `RESOLVED`, y de `READ` solo a `RESOLVED`; nunca retrocede.
_Avoid_: Mensaje, Consulta, Inquiry

**Business Info**:
La informacion institucional del comercio: quien es, donde esta, como se lo
contacta y cuando abre. Hay exactamente una en todo el sistema.
_Avoid_: Settings, Profile, Configuracion

## Personas

**Customer**:
Alguien con cuenta en el sitio. Puede ver el catalogo publico y administrar su
propio perfil, nada mas.
_Avoid_: User, Cliente, Usuario

**Administrator**:
Quien publica y mantiene el Catalog, la Business Info y las Contact Forms. El
rol se otorga a mano en la base de datos; nadie se registra como Administrator.
_Avoid_: Admin (en prosa), Owner, Dueño
