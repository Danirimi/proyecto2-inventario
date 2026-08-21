const express = require('express');
const router = express.Router();
const pool = require('../db');

const ESTADOS_VALIDOS = ['disponible', 'reservado', 'agotado', 'en_transito'];

// Un artículo con categoria asignada se muestra como producto en la
// tienda (Proyecto 1) — ver GET /?catalogo=1 más abajo. Todos estos
// campos son opcionales: un artículo puramente operativo (sin
// categoria) simplemente no aparece ahí, solo en /inventario/.
const CAMPOS_CATALOGO = ['precio', 'precio_anterior', 'categoria', 'especificaciones', 'icono', 'imagen_base', 'imagen_url'];

function validarArticulo(body, { parcial = false } = {}) {
  const errores = [];
  const { nombre, cantidad, ubicacion, estado, precio, precio_anterior, categoria, especificaciones, icono, imagen_base, imagen_url } = body;

  if (!parcial || nombre !== undefined) {
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      errores.push('nombre es obligatorio y debe ser texto no vacío');
    } else if (nombre.length > 150) {
      errores.push('nombre no puede superar 150 caracteres');
    }
  }

  if (!parcial || cantidad !== undefined) {
    if (cantidad === undefined || !Number.isInteger(cantidad) || cantidad < 0) {
      errores.push('cantidad es obligatoria y debe ser un entero >= 0');
    }
  }

  if (!parcial || ubicacion !== undefined) {
    if (!ubicacion || typeof ubicacion !== 'string' || !ubicacion.trim()) {
      errores.push('ubicacion es obligatoria y debe ser texto no vacío');
    } else if (ubicacion.length > 100) {
      errores.push('ubicacion no puede superar 100 caracteres');
    }
  }

  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  for (const campo of ['precio', 'precio_anterior']) {
    const valor = body[campo];
    if (valor !== undefined && valor !== null && (typeof valor !== 'number' || valor < 0)) {
      errores.push(`${campo} debe ser un número >= 0`);
    }
  }

  if (categoria !== undefined && categoria !== null && (typeof categoria !== 'string' || categoria.length > 30)) {
    errores.push('categoria debe ser texto de máximo 30 caracteres');
  }
  // Un artículo con categoria aparece en la tienda (ver GET ?catalogo=1):
  // si no tiene precio, la tienda mostraría "₡NaN". Se exige que ambos
  // vengan juntos en la misma petición para evitar ese estado inválido.
  if (categoria !== undefined && categoria !== null && (precio === undefined || precio === null)) {
    errores.push('para mostrar el artículo en la tienda (categoria) se requiere precio');
  }
  if (especificaciones !== undefined && especificaciones !== null && (typeof especificaciones !== 'string' || especificaciones.length > 150)) {
    errores.push('especificaciones debe ser texto de máximo 150 caracteres');
  }
  if (icono !== undefined && icono !== null && (typeof icono !== 'string' || icono.length > 30)) {
    errores.push('icono debe ser texto de máximo 30 caracteres');
  }
  if (imagen_base !== undefined && imagen_base !== null && (typeof imagen_base !== 'string' || imagen_base.length > 255)) {
    errores.push('imagen_base debe ser texto de máximo 255 caracteres');
  }

  if (imagen_url !== undefined && imagen_url !== null && imagen_url !== '') {
    if (typeof imagen_url !== 'string' || imagen_url.length > 500) {
      errores.push('imagen_url debe ser texto de máximo 500 caracteres');
    } else if (!/^https?:\/\/.+/i.test(imagen_url.trim())) {
      errores.push('imagen_url debe ser un link http:// o https:// válido');
    }
  }

  return errores;
}

// GET /api/articulos — consultar todos (con búsqueda opcional ?q= y,
// para la tienda (Proyecto 1), ?catalogo=1 que filtra solo los
// artículos con categoria asignada, ocultando cantidad/ubicacion
// operativos de cara al público)
router.get('/', async (req, res) => {
  try {
    const { q, catalogo } = req.query;
    const condiciones = [];
    const params = [];

    if (catalogo) {
      condiciones.push('categoria IS NOT NULL');
    }
    if (q) {
      condiciones.push('(nombre LIKE ? OR ubicacion LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    let sql = 'SELECT * FROM articulos';
    if (condiciones.length > 0) {
      sql += ' WHERE ' + condiciones.join(' AND ');
    }
    sql += ' ORDER BY updated_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/articulos]', err.message);
    res.status(500).json({ error: 'Error al consultar los artículos' });
  }
});

// GET /api/articulos/:id — consultar uno
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articulos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET /api/articulos/:id]', err.message);
    res.status(500).json({ error: 'Error al consultar el artículo' });
  }
});

// POST /api/articulos — registrar uno nuevo
router.post('/', async (req, res) => {
  const errores = validarArticulo(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  const { nombre, cantidad, ubicacion, estado } = req.body;
  const valoresCatalogo = CAMPOS_CATALOGO.map((campo) => {
    const v = req.body[campo];
    return typeof v === 'string' ? v.trim() : (v ?? null);
  });
  try {
    const [result] = await pool.query(
      `INSERT INTO articulos (nombre, cantidad, ubicacion, estado, ${CAMPOS_CATALOGO.join(', ')})
       VALUES (?, ?, ?, ?, ${CAMPOS_CATALOGO.map(() => '?').join(', ')})`,
      [nombre.trim(), cantidad, ubicacion.trim(), estado || 'disponible', ...valoresCatalogo]
    );
    const [rows] = await pool.query('SELECT * FROM articulos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/articulos]', err.message);
    res.status(500).json({ error: 'Error al registrar el artículo' });
  }
});

// PUT /api/articulos/:id — actualizar (parcial: solo los campos enviados)
router.put('/:id', async (req, res) => {
  const errores = validarArticulo(req.body, { parcial: true });
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  const campos = [];
  const valores = [];
  for (const campo of ['nombre', 'cantidad', 'ubicacion', 'estado', ...CAMPOS_CATALOGO]) {
    if (req.body[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(typeof req.body[campo] === 'string' ? req.body[campo].trim() : req.body[campo]);
    }
  }

  if (campos.length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  valores.push(req.params.id);

  try {
    const [result] = await pool.query(
      `UPDATE articulos SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    const [rows] = await pool.query('SELECT * FROM articulos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/articulos/:id]', err.message);
    res.status(500).json({ error: 'Error al actualizar el artículo' });
  }
});

// DELETE /api/articulos/:id — eliminar
// (el usuario inventario_app tiene privilegio DELETE desde la Fase 1,
// así que la app puede exponer esta operación con seguridad)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM articulos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('[DELETE /api/articulos/:id]', err.message);
    res.status(500).json({ error: 'Error al eliminar el artículo' });
  }
});

module.exports = router;