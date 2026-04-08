const TicketModel = require('../models/ticket.model');

const buildResponse = ({ statusCode, inOpCode, message, data = [] }) => {
    const generalData = data.length > 0
        ? data.map(item => ({ message, ...item}))
        : [{message}];
    
    return {
        statusCode,
        inOpCode,
        data: generalData,
        total: generalData.length,
        timestamp: new Date().toISOString(),
    };
};

const TicketController = {
    //Todos los tickets
    async getAll(request, reply) {
        try {
            const tickets = await TicketModel.findAllTickets();
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'OK',
                message:    'Todos los tickets obtenidos exitosamente',
                data:       tickets,
            }));
        } catch (err) {
            request.log.error('Error en getAll tickets:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    //Tickets de un grupo
    async getAllGrupo(request, reply) {
        try {
            const filtros = {
                grupo_id:     request.query.grupo_id     ? Number(request.query.grupo_id)     : undefined,
                /*estado_id:    request.query.estado_id    ? Number(request.query.estado_id)    : undefined,
                prioridad_id: request.query.prioridad_id ? Number(request.query.prioridad_id) : undefined,
                asignado_id:  request.query.asignado_id  ? Number(request.query.asignado_id)  : undefined,*/
            };
            const tickets = await TicketModel.findAll(filtros);
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'OK',
                message:    'Tickets obtenidos exitosamente',
                data:       tickets,
            }));
        } catch (err) {
            request.log.error('Error en getAll tickets:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    async getSinAsignar(request, reply) {
        try {
            const { grupo_id } = request.params;
            const tickets  = await TicketModel.findSinAsignar(grupo_id);
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'OK',
                message:    'Tickets sin asignar obtenidos exitosamente',
                data:       tickets,
            }));
        } catch (err) {
            request.log.error('Error en getSinAsignar:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    async getById(request, reply) {
        try {
            const ticket = await TicketModel.findById(Number(request.params.id));
            if (!ticket) {
                return reply.code(404).send(buildResponse({
                    statusCode: 404,
                    inOpCode:   'NOT_FOUND',
                    message:    'Ticket no encontrado',
                }));
            }
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'OK',
                message:    'Ticket obtenido exitosamente',
                data:       [ticket],
            }));
        } catch (err) {
            request.log.error('Error en getById ticket:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    // POST /api/tickets
    async create(request, reply) {
        try {
            const creador_id = Number(request.headers['x-user-id']);
            if (!creador_id) {
                return reply.code(401).send(buildResponse({
                    statusCode: 401,
                    inOpCode:   'UNAUTHORIZED',
                    message:    'Usuario no identificado',
                }));
            }

            const { titulo, descripcion, grupo_id, estado_id, prioridad_id, asignado_id, fecha_cierre } = request.body;
            const ticket = await TicketModel.create({
                titulo, descripcion, grupo_id, creador_id,
                estado_id, prioridad_id,
                asignado_id: asignado_id || null, fecha_cierre
            });
            reply.code(201).send(buildResponse({
                statusCode: 201,
                inOpCode:   'CREATED',
                message:    'Ticket creado exitosamente',
                data:       [ticket],
            }));
        } catch (err) {
            request.log.error('Error en create ticket:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    // PUT /api/tickets/:id
    async update(request, reply) {
        try {
            const ticket = await TicketModel.update(Number(request.params.id), request.body);
            if (!ticket) {
                return reply.code(404).send(buildResponse({
                    statusCode: 404,
                    inOpCode:   'NOT_FOUND',
                    message:    'Ticket no encontrado o sin campos válidos para actualizar',
                }));
            }
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'UPDATED',
                message:    'Ticket actualizado exitosamente',
                data:       [ticket],
            }));
        } catch (err) {
            request.log.error('Error en update ticket:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },

    // PATCH /api/tickets/:id/estado
    async cambiarEstado(request, reply) {
        try {
            const { id } = request.params;
            const { estado_id } = request.body;

            if (!estado_id) {
                return reply.code(400).send(buildResponse({
                    statusCode: 400,
                    message: 'El campo estado_id es requerido'
                }));
            }

            const ticket = await TicketModel.cambiarEstado(Number(id), Number(estado_id));

            if (!ticket) {
                return reply.code(404).send(buildResponse({
                    statusCode: 404,
                    inOpCode: 'NOT_FOUND',
                    message: 'Ticket no encontrado',
                }));
            }

            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode: 'UPDATED',
                message: 'Estado del ticket actualizado exitosamente',
                data: [ticket],
            }));
        } catch (err) {
            request.log.error('Error en cambiarEstado:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode: 'INTERNAL_ERROR',
                message: 'Error interno del servidor',
            }));
        }
    },

    // DELETE /api/tickets/:id  (soft delete)
    async remove(request, reply) {
        try {
            const ticket = await TicketModel.softDelete(Number(request.params.id));
            if (!ticket) {
                return reply.code(404).send(buildResponse({
                    statusCode: 404,
                    inOpCode:   'NOT_FOUND',
                    message:    'Ticket no encontrado o ya eliminado',
                }));
            }
            reply.code(200).send(buildResponse({
                statusCode: 200,
                inOpCode:   'DELETED',
                message:    'Ticket eliminado exitosamente',
                data:       [ticket],
            }));
        } catch (err) {
            request.log.error('Error en remove ticket:', err);
            reply.code(500).send(buildResponse({
                statusCode: 500,
                inOpCode:   'INTERNAL_ERROR',
                message:    'Error interno del servidor',
            }));
        }
    },
};

module.exports = TicketController;