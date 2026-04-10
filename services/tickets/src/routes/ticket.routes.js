const TicketController = require('../controllers/ticket.controller');
const permiso = require('../middlewares/permiso.middlware');
const authMiddleware = require('../middlewares/auth.middleware');

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
    fastify.get('/grupo/:id', {schema: getAllSchema, preHandler: [authMiddleware, permiso('tickets_view')]}, TicketController.getAllGrupo);
    //Todos los tickets
    fastify.get('/', {preHandler: [authMiddleware, permiso('tickets_view')]}, TicketController.getAll);

    fastify.get('/sin-asignar/:grupo_id', {preHandler: [authMiddleware, permiso('tickets_view')]}, TicketController.getSinAsignar);
    
    fastify.get('/:id', {preHandler: [authMiddleware, permiso('ticket_view')]}, TicketController.getById);
    fastify.post('/', {schema: createSchema, preHandler: [authMiddleware, permiso('ticket_add')]}, TicketController.create);
    fastify.put('/:id', {schema: updateSchema, preHandler: [authMiddleware, permiso('ticket_edit')]}, TicketController.update);
    fastify.patch('/:id/estado', {schema: cambiarEstadoSchema, preHandler: [authMiddleware, permiso('tickets_edit_state')]}, TicketController.cambiarEstado);
    //fastify.delete('/:id', TicketController.remove);
}

module.exports = ticketRoutes;