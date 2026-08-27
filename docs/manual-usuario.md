# Manual de Usuario — App de Inventario (acceso móvil)

Guía rápida para el personal de transporte: cómo registrar, consultar y
actualizar artículos del inventario desde el teléfono, directamente
desde la carretera, sin necesidad de una computadora.

## 1. Acceso

Desde el navegador del celular (datos móviles o WiFi), entrar a:

```
https://52.162.223.117/inventario/
```

El certificado es autofirmado (no hay dominio propio todavía), así que
el navegador va a mostrar una advertencia de seguridad la primera vez.
Es esperado: hay que darle "Avanzado" → "Continuar de todos modos" (el
texto exacto varía según el navegador). No es un sitio falso, es
nuestro propio certificado.

La página está diseñada con diseño responsivo, así que se ve y se usa
igual de bien en un teléfono que en una computadora — no hace falta
instalar ninguna aplicación.

## 2. Consultar artículos

Al entrar, la sección **"Artículos"** muestra automáticamente todo el
inventario actual, con:

- Nombre del artículo
- Cantidad disponible
- Ubicación (bodega, camión, etc.)
- Estado, con una etiqueta de color: **Disponible**, **Reservado**,
  **Agotado** o **En tránsito**

Arriba de todo hay un buscador ("Buscar por nombre o ubicación...")
para filtrar rápido cuando el inventario tiene muchos artículos — por
ejemplo, escribir el nombre de un producto o el nombre de un camión.

## 3. Registrar un artículo nuevo

En la sección **"Registrar artículo"**, llenar:

| Campo | Obligatorio | Ejemplo |
|---|---|---|
| Nombre | Sí | Router Cisco RV340 |
| Cantidad | Sí | 5 |
| Estado | Sí (por defecto "Disponible") | En tránsito |
| Ubicación | Sí | Camión 3 |
| Link de imagen | No | https://... |

Los campos de **Categoría, Precio, Precio anterior, Ícono y
Especificaciones** son opcionales y solo se llenan si ese mismo
artículo también debe aparecer como producto en la tienda en línea
(catálogo de Proyecto 1). Si el artículo es solo para uso interno de
inventario, se dejan en blanco.

Con los campos obligatorios llenos, presionar **"Registrar"**. El
artículo aparece de inmediato en la lista de abajo.

## 4. Actualizar un artículo existente

En la tarjeta del artículo (dentro de la lista), presionar
**"Editar"** (ícono de lápiz). El formulario de arriba se llena
automáticamente con los datos actuales — se corrige lo que haga falta
(por ejemplo, la cantidad después de una entrega, o el estado cuando
el artículo pasa de "En tránsito" a "Disponible") y se presiona el
botón de guardar. Para salir sin guardar cambios, usar
**"Cancelar edición"**.

## 5. Eliminar un artículo

En la tarjeta del artículo, presionar **"Eliminar"** (ícono de
basurero). El sistema pide confirmación antes de borrar — esta acción
no se puede deshacer, así que se recomienda usarla solo cuando un
artículo ya no existe de verdad (no para marcarlo como agotado; para
eso está el campo Estado).

## 6. Notas para el personal en ruta

- No se necesita conexión constante más allá del momento de guardar
  el cambio — cada acción (registrar, editar, eliminar) se envía en el
  momento contra la base de datos real, así que el resto del equipo ve
  el cambio de inmediato.
- Si la página no carga, verificar datos móviles/WiFi antes de
  reportar un problema: el servicio corre 24/7 en la VM.
- Ante cualquier duda sobre el estado correcto a usar, la referencia
  es: **Disponible** (en bodega, listo para salir), **En tránsito**
  (cargado en un camión, en camino), **Reservado** (apartado para un
  cliente/contrato) y **Agotado** (sin unidades).
