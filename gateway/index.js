require('dotenv').config();

const Fastify = require('fastify');
const fastifyRateLimit = require('@fastify/rate-limit');
const fastifyCors = require('@fastify/cors');
const fastifyHelmet = require('@fastify/helmet');
const http = require('http');

const authMiddleware = require('./middlewares/auth.middleware');
const internalAuthMiddleware = require('./middlewares/internalAuth.middleware');
const dbProxy = require('./proxy/db.proxy');

const PORT = process.env.PORT || 3000;

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
    },
});

fastify.addHook('onRequest', async (request, reply) => {
    console.log('[onRequest]', request.method, request.url);
    console.log('[onRequest] Auth header:', request.headers['authorization'] || '(vacío)');
});

fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    done(null, body);
});

fastify.addHook('preHandler', async (request, reply) => {
    const url = request.url;
    
    if (!url.startsWith('/api/') || url.startsWith('/api/auth/')) return;
    if (url.startsWith('/internal/')) return; // ← esta es la nueva línea clave
    if (reply.sent) return;

    console.log('[preHandler] LLAMANDO authMiddleware');
    const jwt = require('jsonwebtoken');
    const header = request.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    console.log('[preHandler] token:', token ? 'presente' : 'ausente');
    
    if (!token) {
        return reply.code(401).send({ error: 'Token requerido' });
    }
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[preHandler] JWT_SECRET length:', process.env.JWT_SECRET?.length);
        console.log('[preHandler] user:', user.id);
        request.headers['x-user-id'] = String(user.id);
        request.headers['x-user-role'] = String(user.rol);
        request.user = user;
    } catch (err) {
        console.log('[preHandler] jwt.verify falló:', err.name, err.message);
        return reply.code(401).send({ error: 'Token inválido o expirado' });
    }
});

function proxyTo(target) {
    const targetUrl = new URL(target);

    return async (request, reply) => {
        return new Promise((resolve) => {
            const options = {
                hostname: targetUrl.hostname,
                port: targetUrl.port,
                path: request.url,
                method: request.method,
                headers: {
                    ...request.headers,
                    host: `${targetUrl.hostname}:${targetUrl.port}`,
                },
                timeout: 8000,
            };

            const proxyReq = http.request(options, (proxyRes) => {
                const origin = request.headers['origin'] ||
                    process.env.FRONTEND_URL || 'http://localhost:4200';

                const mergedHeaders = {
                    ...proxyRes.headers,
                    'access-control-allow-origin': origin,
                    'access-control-allow-credentials': 'true',
                    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'access-control-allow-headers': 'Content-Type, Authorization',
                };
                reply.raw.writeHead(proxyRes.statusCode, mergedHeaders);
                proxyRes.pipe(reply.raw);
                proxyRes.on('end', resolve);
                proxyRes.on('error', resolve);
            });

            proxyReq.on('error', (err) => {
                fastify.log.error(`Proxy error -> ${request.url}: ${err.message}`);
                if (!reply.raw.headersSent) {
                    reply.raw.writeHead(502, {
                        'Content-Type': 'application/json',
                        'access-control-allow-origin': request.headers['origin'] || '*',
                        'access-control-allow-credentials': 'true',
                    });
                    reply.raw.end(JSON.stringify({
                        error: 'Servicio no disponible',
                        detail: err.message,
                    }));
                }
                resolve();
            });

            proxyReq.on('timeout', () => {
                console.log('[proxy] TIMEOUT en:', request.url);
                proxyReq.destroy();
            });

            if (request.body && Buffer.isBuffer(request.body)) {
                proxyReq.write(request.body);
            }

            proxyReq.end();
        });
    };
}

const start = async () => {
    await fastify.register(fastifyHelmet, { contentSecurityPolicy: false });
    await fastify.register(fastifyCors, {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    await fastify.register(fastifyRateLimit, {
        max: 300,
        timeWindow: '15 minutes',
        errorResponseBuilder: () => ({
            error: 'Demasiadas peticiones, intenta más tarde',
        }),
    });

    fastify.get('/health', async () => ({ status: 'ok', ts: new Date() }));

    fastify.post('/internal/db', { preHandler: internalAuthMiddleware }, dbProxy);

    const CORE    = `http://localhost:${process.env.CORE_PORT    || 3001}`;
    const TICKETS = `http://localhost:${process.env.TICKETS_PORT || 3002}`;
    const GRUPOS  = `http://localhost:${process.env.GROUPS_PORT  || 3003}`;

    fastify.all('/api/auth/*', proxyTo(CORE));

    fastify.all('/api/usuarios',   proxyTo(CORE));
    fastify.all('/api/usuarios/*', proxyTo(CORE));
    fastify.all('/api/grupos',     proxyTo(GRUPOS));
    fastify.all('/api/grupos/*',   proxyTo(GRUPOS));
    fastify.all('/api/admin',      proxyTo(CORE));
    fastify.all('/api/admin/*',    proxyTo(CORE));
    fastify.all('/api/tickets',    proxyTo(TICKETS));
    fastify.all('/api/tickets/*',  proxyTo(TICKETS));

    fastify.setNotFoundHandler((_req, reply) => {
        reply.code(404).send({ error: 'Ruta no encontrada' });
    });

    fastify.setErrorHandler((error, _req, reply) => {
        fastify.log.error(error);
        reply.code(error.statusCode || 500).send({
            error: error.message || 'Error interno del servidor',
            detail: error.code || '',
        });
    });

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
};

start().catch(err => {
    console.error('Error al iniciar el Gateway:', err);
    process.exit(1);
});