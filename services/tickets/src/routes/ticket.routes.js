const TicketController = require('../controllers/ticket.controller');
const permiso = require('../middlewares/permiso.middlware');
const authMiddleware = require('../middlewares/auth.middleware');

const getByGrupoSchema = {
    params: {
        type: 'object',
        required: ['grupo_id'],
        properties: {
            grupo_id: { type: 'integer' },
        },
    },
};

const getAllSchema = {
    query: {
        type: 'object',
        properties: {
            grupo_id:           { type: 'integer' },
            incluir_bloqueados: { type: 'string', enum: ['true', 'false'] },
        },
    },
};

const sinAsignarSchema = {
    params: {
        type: 'object',
        required: ['grupo_id'],
        properties: {
            grupo_id: { type: 'integer' },
        },
    },
};

const createSchema = {
    body: {
        type: 'object',
        required: ['titulo', 'descripcion', 'grupo_id', 'prioridad_id', 'fecha_cierre'],
        properties: {
            titulo:       { type: 'string',  minLength: 3, maxLength: 200 },
            descripcion:  { type: 'string',  minLength: 5 },
            grupo_id:     { type: 'integer' },
            prioridad_id: { type: 'integer', enum: [1, 2, 3] },
            asignado_id:  { type: 'integer', nullable: true },
            fecha_cierre: { type: 'string',  pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        },
    },
};

const updateSchema = {
    body: {
        type: 'object',
        properties: {
            titulo:       { type: 'string',  minLength: 3, maxLength: 200 },
            descripcion:  { type: 'string',  minLength: 5 },
            grupo_id:     { type: 'integer' },
            prioridad_id: { type: 'integer', enum: [1, 2, 3] },
            asignado_id:  { type: 'integer', nullable: true },
        },
    },
};

const cambiarEstadoSchema = {
    body: {
        type: 'object',
        required: ['estado_id'],
        properties: {
            estado_id: { type: 'integer', enum: [1, 2, 3, 4, 5] },
        },
    },
};

const asignarSchema = {
    body: {
        type: 'object',
        properties: {
            asignado_id: { type: 'integer', nullable: true },
        },
    },
};

const comentarioSchema = {
    body: {
        type: 'object',
        required: ['comentario'],
        properties: {
            comentario: { type: 'string', minLength: 1 },
        },
    },
};

async function ticketRoutes(fastify) {
    // Listar todos los tickets
    fastify.get('/', {
        schema:     getAllSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getAll);

    // Listar tickets de un grupo específico
    fastify.get('/grupo/:grupo_id', {
        schema:     getByGrupoSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getByGrupo);

    // Tickets sin asignar de un grupo
    fastify.get('/sin-asignar/:grupo_id', {
        schema:     sinAsignarSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getSinAsignar);

    fastify.get('/alta-prioridad/:grupo_id', {
        schema:     sinAsignarSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getAltaPrioridad);

    fastify.get('/creados/:grupo_id', {
        schema:     sinAsignarSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getTicketsCreados);

    fastify.get('/asignados/:grupo_id', {
        schema:     sinAsignarSchema,
        preHandler: [authMiddleware, permiso('tickets_view')],
    }, TicketController.getTicketsAsignados);

    // Detalle de un ticket (incluye comentarios e historial)
    fastify.get('/:id', {
        preHandler: [authMiddleware, permiso('ticket_view')],
    }, TicketController.getById);

    // Crear ticket
    fastify.post('/', {
        schema:     createSchema,
        preHandler: [authMiddleware, permiso('ticket_add')],
    }, TicketController.create);

    // Actualizar campos del ticket
    fastify.put('/:id', {
        schema:     updateSchema,
        preHandler: [authMiddleware, permiso('ticket_edit')],
    }, TicketController.update);

    // Cambiar estado del ticket
    fastify.patch('/:id/estado', {
        schema:     cambiarEstadoSchema,
        preHandler: [authMiddleware, permiso('ticket_edit_state')],
    }, TicketController.cambiarEstado);

    // Asignar / desasignar usuario al ticket
    fastify.patch('/:id/asignar', {
        schema:     asignarSchema,
        preHandler: [authMiddleware, permiso('ticket_edit')],
    }, TicketController.asignar);

    // Agregar comentario a un ticket
    fastify.post('/:id/comentarios', {
        schema:     comentarioSchema,
        preHandler: [authMiddleware, permiso('ticket_comment')],
    }, TicketController.agregarComentario);

    // Obtener historial de un ticket
    fastify.get('/:id/historial', {
        preHandler: [authMiddleware, permiso('ticket_view')],
    }, TicketController.getHistorial);

    // Eliminar ticket (soft delete → estado BLOQUEADO)
    fastify.delete('/:id', {
        preHandler: [authMiddleware, permiso('ticket_delete')],
    }, TicketController.remove);
}

module.exports = ticketRoutes;