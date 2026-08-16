// Conexión a MySQL/MariaDB usando variables de entorno.
// Ninguna credencial se hardcodea acá: todo viene de process.env,
// cargado desde el archivo .env (que NO se sube al repo, ver .gitignore).

const mysql = require('mysql2/promise');

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of requiredVars) {
  if (!process.env[key]) {
    console.warn(`[db] Aviso: falta la variable de entorno ${key}. Revisá tu archivo .env`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;