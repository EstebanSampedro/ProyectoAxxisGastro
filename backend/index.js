// backend/index.js
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bienvenido al backend de AxxisGastroV1');
});

// Rutas de autenticación
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Ruta para doctores
const doctorRouter = require('./routes/doctor');
app.use('/api/doctores', doctorRouter);

// Ruta para doctores
const citaRouter = require('./routes/citas');
app.use('/api/citas', citaRouter);

// Ruta para Whatsapp
const whatsappRouter = require('./routes/whatsapp');
app.use('/api/whatsapp', whatsappRouter);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
