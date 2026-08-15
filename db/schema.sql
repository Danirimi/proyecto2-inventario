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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos de prueba 
INSERT INTO articulos (nombre, cantidad, ubicacion, estado) VALUES
('Laptop Dell Latitude 5440', 12, 'Bodega A', 'disponible'),
('Monitor LG 24"', 30, 'Bodega A', 'disponible'),
('Router Cisco RV340', 5, 'Camión 3', 'en_transito'),
('Teclado mecánico Logitech', 0, 'Bodega B', 'agotado');