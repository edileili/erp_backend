const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
require('dotenv').config();

const usuariosRoutes = require('./routes/usuarios.routes');
const adminRoutes = require('./routes/admin.routes');
const gruposRoutes = require('./routes/grupos.routes');

const app = express();

// ── Middlewares globales ───────────────────────────────────────────────────
app.use(cors({ origin: process.env.ANGULAR_URL || 'http://localhost:4200' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin/usuarios', adminRoutes);
app.use('/api/grupos', gruposRoutes);

// ── Ruta base (health check) ───────────────────────────────────────────────
app.get('/', (req, res) => res.json({ ok: true, mensaje: 'API corriendo' }));

// ── Manejo de rutas no encontradas ─────────────────────────────────────────
app.use((req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' }));

// ── Manejo global de errores ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

module.exports = app;