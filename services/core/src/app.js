const express = require('express');
require('dotenv').config();

const usuariosRoutes = require('./routes/usuarios.routes');
const adminRoutes = require('./routes/admin.routes');
const gruposRoutes = require('./routes/grupos.routes');

const app = express();
const PORT = process.env.CORE_PORT || 3001;

app.use(express.json());

//Middleware con Gateway
app.use((req, res, next) => {
  req.userId = req.headers['x-user-id'];
  req.userRole =req.headers['x-user-role'];
  next();
});

//Rutas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin/usuarios', adminRoutes);
app.use('/api/grupos', gruposRoutes);

//Ruta check 
app.get('/health', (req, res) => res.json({ service: 'core', status: 'ok'}));

//Ruta no encontrada
app.use((req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' }));

//Errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

module.exports = app;