# 📦 Aplicación Web de Inventario — Backend & API REST

Esta carpeta contiene el backend (Node.js + Express) y la interfaz web pública de la aplicación de gestión de inventario para la empresa de logística (desplegada en Azure).

---

## 🛠️ Tecnologías y Arquitectura

- **Runtime:** Node.js (v18+)
- **Framework Web:** Express.js 4.x
- **Base de Datos:** MySQL / MariaDB (vía cliente con pool de conexiones `mysql2/promise`)
- **Variables de Entorno:** `dotenv`
- **CORS:** `cors` middleware (permite peticiones multiplataforma/tienda)
- **Frontend Estático:** HTML5, CSS3 vanilla y JavaScript servidos mediante `express.static('public')`.

---

## 📁 Estructura del Directorio `app/`

```text
app/
├── .env.example          # Plantilla de variables de entorno para la base de datos y puerto
├── package.json          # Dependencias y scripts de Node.js
├── package-lock.json     # Bloqueo de versiones de dependencias
├── public/               # Interfaz web cliente (HTML/CSS/JS estático)
│   ├── index.html        # Panel principal de inventario UI
│   ├── css/              # Hojas de estilo
│   └── js/               # Lógica cliente para interacción con la API REST
└── src/
    ├── server.js         # Punto de entrada Express, middleware y endpoint de salud
    ├── db.js             # Pool de conexión a MySQL/MariaDB leyendo variables de entorno
    └── routes/
        └── articulos.js  # Definición y validación de las rutas del CRUD de inventario
```

---

## 🚀 Configuración e Instalación

### 1. Requisitos previos
- Node.js v18 o superior.
- Instancia de MariaDB / MySQL corriendo con la base de datos `inventario_db` cargada (ver scripts en `../db/`).

### 2. Configurar variables de entorno
Copiar la plantilla `.env.example` a un archivo `.env` dentro de la carpeta `app/`:

```bash
cp .env.example .env
```

Editar el archivo `.env` con las credenciales correspondientes a la base de datos:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=inventario_app
DB_PASSWORD=tu_contraseña_segura
DB_NAME=inventario_db

PORT=3000
```

> ⚠️ **Nota:** El archivo `.env` contiene credenciales sensibles y nunca debe subirse al repositorio Git.

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar la aplicación

**Modo Producción:**
```bash
npm start
```

**Modo Desarrollo (con auto-reload):**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000` (o el puerto configurado).

---

## 📑 Documentación de la API REST

Base URL: `/api`

### Resumen de Endpoints

| Método | Endpoint | Descripción | Requiere Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor y prueba de conexión a la BD | No |
| `GET` | `/api/articulos` | Listar todos los artículos (con filtros opcionales) | No |
| `GET` | `/api/articulos/:id` | Consultar detalle de un artículo específico por ID | No |
| `POST` | `/api/articulos` | Registrar un nuevo artículo en inventario | Sí (JSON) |
| `PUT` | `/api/articulos/:id` | Actualizar parcialmente los datos de un artículo | Sí (JSON) |
| `DELETE` | `/api/articulos/:id` | Eliminar un artículo de inventario por ID | No |

---

### 🔍 Detalle de Endpoints

#### 1. Verificar Estado del Sistema (`GET /api/health`)
Confirma que la API se encuentra en ejecución y verifica la conectividad en tiempo real con MariaDB/MySQL.

- **Respuesta 200 OK:**
  ```json
  {
    "status": "ok",
    "db": "conectada"
  }
  ```
- **Respuesta 500 Internal Server Error:**
  ```json
  {
    "status": "error",
    "db": "sin conexion",
    "detalle": "Mensaje detallado del error..."
  }
  ```

---

#### 2. Consultar Artículos (`GET /api/articulos`)
Obtiene el listado de artículos ordenados de forma descendente por la última fecha de actualización (`updated_at`).

- **Query Parameters (Opcionales):**
  - `q` *(string)*: Filtra por nombre o ubicación que contengan el texto indicado.
  - `catalogo` *(flag/1)*: Filtra únicamente artículos que posean categoría asignada (`categoria IS NOT NULL`), utilizado para sincronizar la tienda web (Proyecto 1).

- **Ejemplo de Request:** `GET /api/articulos?q=Dell`
- **Respuesta 200 OK:**
  ```json
  [
    {
      "id": 1,
      "nombre": "Laptop Dell Latitude 5440",
      "cantidad": 12,
      "ubicacion": "Bodega A",
      "estado": "disponible",
      "precio": "450000.00",
      "precio_anterior": null,
      "categoria": "Computadores",
      "especificaciones": "Core i5 13a Gen, 16GB RAM, 512GB SSD",
      "icono": "laptop",
      "imagen_base": "dell-latitude",
      "imagen_url": "https://cdn.ejemplo.com/dell-5440.jpg",
      "created_at": "2026-08-26T20:00:00.000Z",
      "updated_at": "2026-08-26T20:00:00.000Z"
    }
  ]
  ```

---

#### 3. Consultar Artículo por ID (`GET /api/articulos/:id`)
Obtiene la información completa de un único artículo registrado.

- **Respuesta 200 OK:** Objeto JSON con los atributos del artículo.
- **Respuesta 404 Not Found:**
  ```json
  {
    "error": "Artículo no encontrado"
  }
  ```

---

#### 4. Crear Nuevo Artículo (`POST /api/articulos`)
Registra un nuevo artículo en la base de datos.

- **Headers:** `Content-Type: application/json`
- **Estructura del Body (JSON):**

| Campo | Tipo | Requerido | Restricciones / Reglas |
| :--- | :--- | :--- | :--- |
| `nombre` | string | **Sí** | No vacío, máximo 150 caracteres. |
| `cantidad` | integer | **Sí** | Entero mayor o igual a 0. |
| `ubicacion` | string | **Sí** | No vacío, máximo 100 caracteres. |
| `estado` | string | No | Uno de: `'disponible'`, `'reservado'`, `'agotado'`, `'en_transito'` (Default: `'disponible'`). |
| `precio` | number | Condicional | Número >= 0. Requerido si se asigna `categoria`. |
| `precio_anterior` | number | No | Número >= 0. |
| `categoria` | string | No | Máximo 30 caracteres. |
| `especificaciones`| string | No | Máximo 150 caracteres. |
| `icono` | string | No | Máximo 30 caracteres. |
| `imagen_base` | string | No | Máximo 255 caracteres. |
| `imagen_url` | string | No | Máximo 500 caracteres, debe ser URL válida `http://` o `https://`. |

- **Ejemplo de Payload Payload JSON:**
  ```json
  {
    "nombre": "Teclado Inalámbrico Logitech",
    "cantidad": 25,
    "ubicacion": "Bodega B",
    "estado": "disponible",
    "precio": 25000,
    "categoria": "Accesorios"
  }
  ```

- **Respuesta 201 Created:** Objeto JSON del artículo recién registrado.
- **Respuesta 400 Bad Request (Errores de validación):**
  ```json
  {
    "errores": [
      "nombre es obligatorio y debe ser texto no vacío",
      "cantidad es obligatoria y debe ser un entero >= 0"
    ]
  }
  ```

---

#### 5. Actualizar Artículo (`PUT /api/articulos/:id`)
Actualiza parcialmente los campos del artículo. Solo se deben enviar las propiedades que se desean modificar.

- **Headers:** `Content-Type: application/json`
- **Ejemplo de Payload JSON:**
  ```json
  {
    "cantidad": 18,
    "estado": "reservado"
  }
  ```

- **Respuesta 200 OK:** Objeto JSON con el artículo actualizado.
- **Respuesta 400 Bad Request:** En caso de fallas de validación o envío de body vacío (`{ "error": "No se enviaron campos para actualizar" }`).
- **Respuesta 404 Not Found:** `{ "error": "Artículo no encontrado" }`

---

#### 6. Eliminar Artículo (`DELETE /api/articulos/:id`)
Elimina el artículo especificado por el parámetro `:id`.

- **Respuesta 204 No Content:** Eliminación exitosa (sin contenido de retorno).
- **Respuesta 404 Not Found:** `{ "error": "Artículo no encontrado" }`

---

## 🧪 Ejemplos de Prueba con `curl`

### Probar salud de la API
```bash
curl -X GET http://localhost:3000/api/health
```

### Consultar todos los artículos
```bash
curl -X GET http://localhost:3000/api/articulos
```

### Crear un artículo
```bash
curl -X POST http://localhost:3000/api/articulos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Switch Gigabit TP-Link 8 Puertos",
    "cantidad": 10,
    "ubicacion": "Bodega C",
    "estado": "disponible"
  }'
```

### Actualizar cantidad y estado
```bash
curl -X PUT http://localhost:3000/api/articulos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad": 15,
    "estado": "disponible"
  }'
```

### Eliminar artículo
```bash
curl -X DELETE http://localhost:3000/api/articulos/1
```
