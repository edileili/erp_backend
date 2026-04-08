const TicketController = require('../controllers/ticket.controller');

const getAllSchema = {
    query: {
        type: 'object',
        properties: {
            grupo_id: { type: 'integer' }
        }
    }
};

const createSchema = {
    body: {
        type: 'object',
        required: ['titulo', 'descripcion', 'grupo_id', 'estado_id', 'prioridad_id'],
        properties: {
            titulo: {type: 'string', minLength: 3, maxLength: 200},
            descripcion: {type: 'string', minLength: 5},
            grupo_id: {type: 'integer'},
            estado_id: {type: 'integer'},
            prioridad_id: {type: 'integer'},
            asignado_id: {type: 'integer'},
            fecha_cierre: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true}
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
    //Tickets por grupo
    fastify.get('/grupo/:id', {schema: getAllSchema}, TicketController.getAllGrupo);
    //Todos los tickets
    fastify.get('/', TicketController.getAll);

    fastify.get('/sin-asignar/:grupo_id', TicketController.getSinAsignar);
    fastify.get('/:id', TicketController.getById);
    fastify.post('/', {schema: createSchema}, TicketController.create);
    fastify.put('/:id', {schema: updateSchema}, TicketController.update);
    fastify.patch('/:id/estado', {schema: cambiarEstadoSchema}, TicketController.cambiarEstado);
    //fastify.delete('/:id', TicketController.remove);
}

module.exports = ticketRoutes;