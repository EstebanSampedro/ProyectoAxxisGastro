require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Función para cargar rutas de manera segura
const loadRoute = (routePath, routeUrl) => {
  try {
    const route = require(routePath);
    app.use(routeUrl, route);
    console.log(`Ruta cargada: ${routeUrl}`);
  } catch (error) {
    console.error(`Error cargando la ruta ${routeUrl}:`, error.message);
  }
};

// Ruta principal
app.get('/', (req, res) => {
  res.send('Bienvenido al backend de AxxisGastroV1');
});

// Corrige las rutas para que coincidan con la estructura de archivos
loadRoute('./src/routes/auth.js', '/api/auth');
loadRoute('./src/routes/doctor.js', '/api/doctores');
loadRoute('./src/routes/citas.routes.js', '/api/citas');
loadRoute('./src/routes/whatsapp.js', '/api/whatsapp');

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});