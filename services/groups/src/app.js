require('dotenv').config();
const express      = require('express');
const gruposRoutes = require('./routes/grupos.routes');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app  = express();
const PORT = process.env.GROUPS_PORT || 3003;

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
        await msLogger('servicio-grupos', pool)(fakeRequest, fakeReply, '{}');
    });
    next();
});

app.use(express.json());

app.use((req, _res, next) => {
    req.userId   = req.headers['x-user-id'];
    req.userRole = req.headers['x-user-role'];
    next();
});

//Rutas
app.use('/api/grupos', gruposRoutes);

//Health check
app.get('/health', (_req, res) => res.json({ service: 'grupos', status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`[Grupos Service] corriendo en puerto ${PORT}`));