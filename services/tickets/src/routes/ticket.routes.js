const TicketController = require('../controllers/ticket.controller');

const createSchema = {
    body: {
        type: 'object',
        required: ['titulo', 'descripcion', 'group_id', 'estado_id', 'prioridad_id'],
        properties: {
            titulo: {type: 'string', minLength: 3, maxLength: 200},
            descripcion: {type: 'string', minLength: 5},
            grupo_id: {type: 'integer'},
            estado_id: {type: 'integer'},
            prioridad_id: {type: 'integer'},
            asignado_id: {type: 'integer'},
        },
    },
};

const updateSchema = {
    body: {
        type: 'object',
        properties: {
            titulo: {type: 'string', minLength: 3, maxLength: 200},
            descripcion: {type: 'string', minLength: 5},
            grupo_id: {type: 'integer'},
            estado_id: {type: 'integer'},
            prioridad_id: {type: 'integer'},
            asignado_id: {type: 'integer'},
        },
    },
}

const cambiarEstadoSchema = {
    body: {
        type: 'object',
        required: ['estado_id'],
        properties: {
            estado_id: {type: 'integer'},
        },
    },
}

async function ticketRoutes(fastify) {
    fastify.get('/', TicketController.getAll);
    fastify.get('/sin-asingar', TicketController.getSinAsignar);
    fastify.get('/:id', TicketController.getById);
    fastify.post('/', {schema: createSchema}, TicketController.create);
    fastify.put('/:id', {schema: updateSchema}, TicketController.update);
    fastify.patch('/:id/estado', {schema: cambiarEstadoSchema}, TicketController.cambiarEstado);
    //fastify.delete('/:id', TicketController.remove);
}

module.exports = ticketRoutes;