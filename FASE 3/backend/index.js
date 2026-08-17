// Instala primero las dependencias con:
// npm install express cors

const express = require('express');
const cors = require('cors');
const http       = require("http");         
const { Server } = require("socket.io"); 

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = 3001;


const io = new Server(server, {
  cors: {
    origin: "*",          // en producción pon la URL del frontend
    methods: ["GET", "POST"],
  },
});

// Exportar io ANTES de cargar las rutas, para que los servicios lo puedan importar
// La forma más limpia sin crear dependencias circulares es adjuntarlo a app
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);

  // El frontend puede unirse a una sala por rol
  socket.on("join_room", (sala) => {
    socket.join(sala);
    // Confirmar al cliente que entró a la sala
    socket.emit("join_confirmado", { sala });
    console.log(`[WS] ${socket.id} → sala "${sala}" | total en sala: ${io.sockets.adapter.rooms.get(sala)?.size ?? 0}`);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});





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
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = { app, io }