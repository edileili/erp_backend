require('dotenv').config();
const express = require('express');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const adminRoutes    = require('./routes/admin.routes');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app  = express();
const PORT = process.env.CORE_PORT || 3001;

const loggerMiddleware = require('./middlewares/logger.middleware');
const msLogger = require('./middlewares/msLogger.middleware');
app.use(loggerMiddleware); 

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
        // Simula el contrato que espera msLogger
        const fakeRequest = {
            url: req.url,
            method: req.method,
            headers: req.headers,
            ip: req.ip,
        };
        const fakeReply = {
            statusCode: res.statusCode,
            elapsedTime: Date.now() - start,
        };
        await msLogger('servicio-usuarios', pool)(fakeRequest, fakeReply, '{}');
    });
    next();
});

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