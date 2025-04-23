require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Aplica apiKeyMiddleware globalmente
app.use(apiKeyMiddleware);
// Servir archivos estáticos de la carpeta "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'src', 'public', 'uploads')));


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

// Cargar rutas
loadRoute('./src/routes/auth.js', '/api/auth');
loadRoute('./src/routes/doctor.js', '/api/doctores');
loadRoute('./src/routes/citas.routes.js', '/api/citas');
loadRoute('./src/routes/whatsapp.js', '/api/whatsapp');
loadRoute('./src/routes/observacion.general.routes.js', '/api/observaciones');
loadRoute('./src/routes/torre.routes.js', '/api/torres');
loadRoute('./src/routes/historial.js', '/api/historial');


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
