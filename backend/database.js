// backend/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',       // Cambia por la IP/host de tu servidor MySQL
  user: 'root',            // Tu usuario de MySQL
  password: 'admin123',            // La contraseña de tu usuario
  database: 'axxis-citas', // La base de datos que creaste (según tus scripts)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
