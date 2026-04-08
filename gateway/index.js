require('dotenv').config();

const Fastify = require('fastify');
const fastifyRateLimit = require('@fastify/rate-limit');
const fastifyCors = require('@fastify/cors');
const fastifyHelmet = require('@fastify/helmet');
const httpProxy = require('http-proxy');

const authMiddleware = require('./middlewares/auth.middleware');
const internalAuthMiddleware = require('./middlewares/internalAuth.middleware');
const dbProxy = require('./proxy/db.proxy');

const PORT = process.env.PORT || 3000;

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname'},
        },
    },
});

const proxy = httpProxy.createProxyServer({ proxyTimeout: 8000});

proxy.on('error', (err, req, res) => {
    fastify.log.error(`Proxy ${err.code} -> ${req.url}`);
    if(!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            error: 'Servicio no disponible',
            detail: err.core || err.message,
        }));
    }
});

function proxyTo(target) {
    return (request, reply) => {
        proxy.web(request.raw, reply.raw, { target });
    };
}

const start = async () => {
    await fastify.register(fastifyHelmet, {contentSecurityPolicy: false });
    await fastify.register(fastifyCors, {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    });
    await fastify.register(fastifyRateLimit, {
        max: 100,
        timeWindow: '15 minutes',
        errorResponseBuilder: () => ({
            error: 'Demasiadas peticiones, intenta más tarde',
        }),
    });

    //Health check
    fastify.get('/health', async () => ({ status: 'ok', ts: new Date() }));

    //Proxy interno de la base de datos
    fastify.post('/internal/db', {
        preHandler: internalAuthMiddleware,
    }, dbProxy);

    const CORE = `http://localhost:${process.env.CORE_PORT || 3001}`;
    const TICKETS = `http://localhost:${process.env.TICKETS_PORT || 3002}`;

    //Rutas públicas
    fastify.all('/api/auth/*', proxyTo(CORE));

    //JWT
    fastify.addHook('preHandler', async (request, reply) => {
        if(!request.url.startsWith('/api/') || request.url.startsWith('/api/auth/')) return;
        await authMiddleware(request, reply);
    });

    //Rutas protegidas
    fastify.all('/api/usuarios', proxyTo(CORE));
    fastify.all('/api/usuarios/*', proxyTo(CORE));
    fastify.all('/api/grupos', proxyTo(CORE));
    fastify.all('/api/grupos/*', proxyTo(CORE));
    fastify.all('/api/admin', proxyTo(CORE));
    fastify.all('/api/admin/*', proxyTo(CORE));
    fastify.all('/api/tickets', proxyTo(TICKETS));
    fastify.all('/api/tickets/*', proxyTo(TICKETS));

    //404
    fastify.setNotFoundHandler((_req, reply) => {
        reply.code(404).send({ error: 'Ruta no encontrada' });
    });

    //Error global
    fastify.setErrorHandler((error, _req, reply) => {
        fastify.log.error(error);
        reply.code(error.statusCode || 500).send({
            error: error.message || 'Error interno del servidor',
            detail: error.code || '',
        });
    });

    await fastify.listen({ port: PORT, host: '0.0.0.0'});
};

start().catch(err => {
    console.error('Error al iniciar el Gateway:', err);
    process.exit(1);
});