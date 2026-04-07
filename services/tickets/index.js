require('dotenv').config();
const fastify = require('fastify')({logger: true});

const PORT = process.env.TICKETS_PORT || 3002;

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