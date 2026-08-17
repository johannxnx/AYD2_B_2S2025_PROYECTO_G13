// Instala primero las dependencias con:
// npm install express cors

const express = require('express');
const cors = require('cors');

require("dotenv").config();

const app = express();
const PORT = 3001;

// Importar rutas principales
const indexRoutes = require('./src/routes/index_routes');

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta básica
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    mensaje: 'API funcionando'
  });
});

// Todas las rutas iniciarán con /api
app.use('/api', indexRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});