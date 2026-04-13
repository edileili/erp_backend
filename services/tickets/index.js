require('dotenv').config();
const fastify = require('fastify')({logger: true});
const msLogger = require('./src/middlewares/msLogger.middleware');
const {Pool} = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PORT = process.env.TICKETS_PORT || 3002;

fastify.addHook('onSend', msLogger('servicio-tickets', pool));

fastify.addHook('preHandler', async (request) => {
    request.userId = request.headers['x-user-id'];
    request.userRole = request.headers['x-user-role'];
});

fastify.register(require('./src/routes/ticket.routes'), { prefix: '/api/tickets'});

fastify.get('/health', async () => ({service: 'tickets', status: 'ok'}));

fastify.listen({port: PORT, host: '0.0.0.0'}, (err) => {
    if(err) {
        fastify.log.error(err);
        process.exit(1);
    }
});