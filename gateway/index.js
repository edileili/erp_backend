require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const authMiddleware = require('./middlewares/auth.middleware');
const internalAuthMiddleware = require('./middlewares/internalAuth.middleware');
const dbProxy = require('./proxy/db.proxy');
const logger = require('./middlewares/logger.middleware');
const { error } = require('ajv/dist/vocabularies/applicator/dependencies');

const app = express();
const PORT = process.env.PORT || 3000;

//Seguridad global
app.use(helmet());
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:4200'}));
app.use(express.json());
app.use(logger);

//Rate limit global
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutos
    max: 100,
    message: { error: 'Demasiadas peticiones, intenta más tarde.'},
}));

//Health check
app.get('/health', (_req, res) => res.json({status: 'ok', ts: new Date() }));

//Proxy interno
app.use('/internal/db', internalAuthMiddleware, dbProxy);

//Rutas públicas
app.use('/api/auth', createProxyMiddleware({
    target: `http://localhost:${process.env.CORE_PORT || 3001}`,
    changeOrigin: true,
    on: {error: proxyError},
}));

//Rutas protegidas
app.use(authMiddleware);

app.use('/api/usuarios', createProxyMiddleware({
    target: `http://localhost:${process.env.CORE_PORT || 3001}`,
    changeOrigin: true,
    on: {error: proxyError},
}));

app.use('/api/grupos', createProxyMiddleware({
    target: `http://localhost:${process.env.CORE_PORT || 3001}`,
    changeOrigin: true,
    on: {error: proxyError},
}));

app.use('/api/admin', createProxyMiddleware({
    target: `http://localhost:${process.env.CORE_PORT || 3001}`,
    changeOrigin: true,
    on: {error: proxyError},
}));

app.use('/api/tickets', createProxyMiddleware({
    target: `http://localhost:${process.env.CORE_PORT || 3002}`,
    changeOrigin: true,
    on: {error: proxyError},
}));

//Error
function proxyError(err, _req, res) {
    console.error('Gateway Proxy error:', err.message); 
    
    res.status(502).json({
        error: 'Servicio no disponible', 
        detail: err.message 
    });
}

app.use((_req, res) => res.status(404).json({error: 'Ruta no encontrada'}));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});