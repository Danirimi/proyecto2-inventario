const express = require('express');
const router = express.Router();
const pool = require('../db');

const ESTADOS_VALIDOS = ['disponible', 'reservado', 'agotado', 'en_transito'];

function validarArticulo(body, { parcial = false } = {}) {
  const errores = [];
  const { nombre, cantidad, ubicacion, estado } = body;

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

  return errores;
}

// GET /api/articulos — consultar todos (con búsqueda opcional ?q=)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM articulos';
    const params = [];

    if (q) {
      sql += ' WHERE nombre LIKE ? OR ubicacion LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
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
  try {
    const [result] = await pool.query(
      'INSERT INTO articulos (nombre, cantidad, ubicacion, estado) VALUES (?, ?, ?, ?)',
      [nombre.trim(), cantidad, ubicacion.trim(), estado || 'disponible']
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
  for (const campo of ['nombre', 'cantidad', 'ubicacion', 'estado']) {
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