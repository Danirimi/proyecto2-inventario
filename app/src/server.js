require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const articulosRouter = require('./routes/articulos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Frontend estático (index.html, css, js)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Endpoint de salud: confirma que la app está viva y que puede
// hablar con la base de datos (útil para probar la Fase 1 <-> Fase 2).
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 ? 'conectada' : 'desconocida' });
  } catch (err) {
    console.error('[health] Error de conexión a la base de datos:', err.message);
    res.status(500).json({ status: 'error', db: 'sin conexion', detalle: err.message });
  }
});

// Rutas del CRUD de inventario
app.use('/api/articulos', articulosRouter);

app.listen(PORT, () => {
  console.log(`Inventario app escuchando en http://localhost:${PORT}`);
});