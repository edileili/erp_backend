require('dotenv').config();
const express = require('express');

// Rutas (igual que antes, sin cambios en las rutas mismas)
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const adminRoutes    = require('./routes/admin.routes');

const app  = express();
const PORT = process.env.CORE_PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
    req.userId   = req.headers['x-user-id'];
    req.userRole = req.headers['x-user-role'];
    next();
});

//Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin',    adminRoutes);

// Health check interno
app.get('/health', (_req, res) => res.json({ service: 'core', status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`[Core Service] corriendo en puerto ${PORT}`));