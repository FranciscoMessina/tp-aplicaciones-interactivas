# Catalog es un modulo, no uno por modelo

`catalog.service.ts` tiene Products y Categories juntos, lectura y escritura.
Es deliberado: las dos reglas que importan cruzan los dos modelos. `createProduct`
necesita `CategoryModel` para verificar que la Category exista, y `deleteCategory`
necesita `ProductModel` para no borrar una Category con Products asociados.

Un modulo por modelo obliga a duplicar esas reglas o a que los dos modulos se
importen entre si. Que sean inseparables es justamente lo que hace que el
Catalog sea la unidad correcta.
