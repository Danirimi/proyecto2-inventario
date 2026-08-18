-- Carga inicial del catálogo de la tienda (Proyecto 1) como artículos
-- reales de inventario_db, con categoria asignada para que la tienda
-- los muestre en vivo vía GET /api/articulos?catalogo=1.
-- cantidad/ubicacion/estado son valores iniciales razonables,
-- ajustables después desde el panel /inventario/.

INSERT INTO articulos (nombre, cantidad, ubicacion, estado, precio, precio_anterior, categoria, especificaciones, icono, imagen_base) VALUES
('Xiaomi RedmiBook Pro 15 2024', 8, 'Bodega A', 'disponible', 589000, 659000, 'laptops', 'Intel Core i5 · 16GB · 512GB SSD', 'bi-laptop', 'imagenesDeComputadoras/Xiaomi RedmiBook Pro 15 2024'),
('Xiaomi Mi Notebook Ultra', 14, 'Bodega A', 'disponible', 649000, NULL, 'laptops', 'Intel Core i7 · 16GB · 512GB SSD', 'bi-laptop', 'imagenesDeComputadoras/Xiaomi Mi Notebook Ultra'),
('Samsung Galaxy Book4 Pro', 10, 'Bodega A', 'disponible', 899000, NULL, 'laptops', 'Intel Core Ultra 7 · 16GB · 1TB SSD', 'bi-laptop', 'imagenesDeComputadoras/Samsung Galaxy Book4 Pro'),
('Samsung Galaxy Book3 360', 12, 'Bodega A', 'disponible', 729000, NULL, 'laptops', 'Intel Core i5 · pantalla táctil · 16GB', 'bi-laptop', 'imagenesDeComputadoras/Samsung Galaxy Book3 360'),

('Zytrax Build FireLine RTX 4070', 6, 'Bodega A', 'disponible', 989000, NULL, 'armadas', 'Ryzen 7 · RTX 4070 · 32GB · 1TB NVMe', 'bi-pc-display', 'imagenesDEPCs_Armadas_Zytrax_Build/Zytrax Build FireLine RTX 4070'),
('Zytrax Build Starter Office', 20, 'Bodega A', 'disponible', 389000, NULL, 'armadas', 'Intel Core i5 · 16GB · 512GB SSD', 'bi-pc-display', 'imagenesDEPCs_Armadas_Zytrax_Build/Zytrax Build Starter Office'),
('Zytrax Build Titan RTX 4080', 4, 'Bodega A', 'disponible', 1590000, NULL, 'armadas', 'Ryzen 9 · RTX 4080 · 32GB · 2TB NVMe', 'bi-pc-display', 'imagenesDEPCs_Armadas_Zytrax_Build/Zytrax Build Titan RTX 4080'),
('Zytrax Build Mini ITX Compact', 9, 'Bodega A', 'disponible', 579000, NULL, 'armadas', 'Ryzen 5 · RX 7600 · 16GB · 512GB SSD', 'bi-pc-display', 'imagenesDEPCs_Armadas_Zytrax_Build/Zytrax Build Mini ITX Compact'),

('NVIDIA GeForce RTX 4060 Ti 8GB', 25, 'Bodega B', 'disponible', 349000, 389000, 'componentes', 'PCIe 4.0 · Ray Tracing · DLSS 3', 'bi-gpu-card', 'imagenesDeComponentes/NVIDIA GeForce RTX 4060 Ti 8GB'),
('Samsung 32GB DDR5 5600MHz RAM', 40, 'Bodega B', 'disponible', 69000, NULL, 'componentes', 'Kit 2x16GB · Low profile', 'bi-memory', 'imagenesDeComponentes/Samsung 32GB DDR5 5600MHz RAM'),
('Samsung 980 PRO 1TB NVMe SSD', 7, 'Bodega B', 'disponible', 59000, 74000, 'componentes', 'PCIe 4.0 · 7000MB/s lectura', 'bi-hdd', 'imagenesDeComponentes/Samsung 980 PRO 1TB NVMe SSD'),
('AMD Radeon RX 7600 8GB', 18, 'Bodega B', 'disponible', 239000, NULL, 'componentes', 'PCIe 4.0 · FSR 3', 'bi-gpu-card', 'imagenesDeComponentes/AMD Radeon RX 7600 8GB'),

('Redragon K617 Fizz', 35, 'Bodega B', 'disponible', 24900, NULL, 'perifericos', 'Teclado mecánico TKL · RGB', 'bi-keyboard', 'imagenesDePeriféricos/Redragon K617 Fizz'),
('Redragon M711 Cobra', 10, 'Bodega B', 'disponible', 20000, 22900, 'perifericos', 'Mouse gamer · 16K DPI', 'bi-mouse2', 'imagenesDePeriféricos/Redragon M711 Cobra'),
('Redragon H510 Zeus', 22, 'Bodega B', 'disponible', 27900, NULL, 'perifericos', 'Headset · sonido envolvente', 'bi-headset', 'imagenesDePeriféricos/Redragon H510 Zeus'),
('Redragon S101 Combo', 28, 'Bodega B', 'disponible', 15900, NULL, 'perifericos', 'Teclado + mouse · alámbrico', 'bi-keyboard', 'imagenesDePeriféricos/Redragon S101 Combo'),

('Samsung Odyssey G5 27"', 9, 'Bodega A', 'disponible', 189000, 219000, 'monitores', 'QHD · 165Hz · curvo', 'bi-display', 'imagenesDeMonitores/Samsung Odyssey G5 27'),
('Xiaomi Redmi Display 1A 23.8"', 30, 'Bodega A', 'disponible', 89900, NULL, 'monitores', 'Full HD · IPS', 'bi-display', 'imagenesDeMonitores/Xiaomi Redmi Display 1A 23.8'),
('Samsung Odyssey Neo G8 34"', 5, 'Bodega A', 'disponible', 449000, NULL, 'monitores', 'Ultrawide · 165Hz', 'bi-display', 'imagenesDeMonitores/Samsung Odyssey Neo G8 34'),
('Samsung ViewFinity S8 32" 4K', 13, 'Bodega A', 'disponible', 329000, NULL, 'monitores', 'UHD · USB-C 90W', 'bi-display', 'imagenesDeMonitores/Samsung ViewFinity S8 32 4K');
