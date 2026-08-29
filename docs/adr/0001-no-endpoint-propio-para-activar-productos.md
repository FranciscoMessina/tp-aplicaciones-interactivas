# Activar y desactivar un Product no tiene endpoint propio

Un Product tiene `isActive`, y durante un tiempo se cambiaba con
`PATCH /api/products/:id/status`. Ese endpoint hacia un `$set` de un solo campo
y repetia la guarda de "no existe" que `PATCH /api/products/:id` ya tenia: era
una interfaz entera para nada. `isActive` es ahora un campo mas de la
actualizacion.

Que el front muestre "activar" y "desactivar" como acciones separadas es una
decision de presentacion, no una razon para partir la interfaz del backend.

## Consequences

Desactivar un Product lo saca del listado publico, asi que el listado acepta
`includeInactive` para que un Administrator autenticado pueda volver a
encontrarlo. Sin eso, desactivar seria un camino de ida.
