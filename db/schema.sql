-- ============================================================
-- Proyecto 2 — Sistema de Inventario en la Nube (ITI-522)
-- Esquema de inventario 
-- Motor: MariaDB 10.11 (Ubuntu 24.04 LTS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventario_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE inventario_db;

CREATE TABLE IF NOT EXISTS articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    ubicacion VARCHAR(100) NOT NULL,
    estado ENUM('disponible', 'reservado', 'agotado', 'en_transito') NOT NULL DEFAULT 'disponible',
    -- Campos de catálogo (opcionales). Un artículo con categoria
    -- asignada se muestra automáticamente como producto en la tienda
    -- (Proyecto 1) vía GET /api/articulos?catalogo=1. Los artículos
    -- sin categoria son puramente operativos: solo se ven en el
    -- panel /inventario/.
    precio DECIMAL(10,2) NULL,
    precio_anterior DECIMAL(10,2) NULL,
    categoria VARCHAR(30) NULL,
    especificaciones VARCHAR(150) NULL,
    icono VARCHAR(30) NULL,
    imagen_base VARCHAR(255) NULL,
    -- Link completo a una imagen ya alojada en otro lugar (ej. subida a
    -- un hosting/CDN externo). A diferencia de imagen_base (nombre base
    -- local sin extensión, para archivos servidos por esta misma VM),
    -- imagen_url se usa tal cual como src de la imagen. Si ambos están
    -- presentes, imagen_url tiene prioridad (ver tienda.js).
    imagen_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Migración para bases ya creadas con el esquema anterior (sin campos
-- de catálogo). Requiere un usuario con privilegio ALTER (no
-- inventario_app, que solo tiene lo mínimo) — ej. root vía
-- `sudo mysql inventario_db < db/schema.sql`.
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) NULL AFTER estado;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS precio_anterior DECIMAL(10,2) NULL AFTER precio;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) NULL AFTER precio_anterior;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS especificaciones VARCHAR(150) NULL AFTER categoria;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS icono VARCHAR(30) NULL AFTER especificaciones;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS imagen_base VARCHAR(255) NULL AFTER icono;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500) NULL AFTER imagen_base;

-- Datos de prueba (artículos puramente operativos, sin categoria:
-- no aparecen en la tienda, solo en el panel de inventario)
INSERT INTO articulos (nombre, cantidad, ubicacion, estado) VALUES
('Laptop Dell Latitude 5440', 12, 'Bodega A', 'disponible'),
('Monitor LG 24"', 30, 'Bodega A', 'disponible'),
('Router Cisco RV340', 5, 'Camión 3', 'en_transito'),
('Teclado mecánico Logitech', 0, 'Bodega B', 'agotado');

-- Catálogo de la tienda (Proyecto 1), migrado desde el array PRODUCTS
-- que tenía hardcodeado tienda.js. Vive en un archivo aparte porque es
-- carga de datos, no estructura — correr después de este script:
--   sudo mysql inventario_db < db/seed_catalogo.sql