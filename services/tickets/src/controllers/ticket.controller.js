const TicketModel = require('./../models/ticket.model');
const db = require('../../../shared/db-client'); 

const buildResponse = ({ statusCode, inOpCode, message, data = [] }) => {
    const generalData = data.length > 0
        ? data.map(item => ({ message, ...item }))
        : [{ message }];

    return {
        statusCode,
        inOpCode,
        data: generalData,
        total: generalData.length,
        timestamp: new Date().toISOString(),
    };
};

const ESTADO = {
    PENDIENTE:   1,
    EN_PROCESO:  2,
    EN_REVISION: 3,
    HECHO:       4,
    BLOQUEADO:   5,
};

const PRIORIDAD = {
    ALTA:  1,
    MEDIA: 2,
    BAJA:  3,
};

function esBloqueado(ticket) {
    return ticket?.estado_actual?.toLowerCase() === 'bloqueado';
}

async function getAll(req, reply) {
    try {
        const { grupo_id, incluir_bloqueados } = req.query;

        let tickets = await TicketModel.findAll({
            grupo_id: grupo_id ? Number(grupo_id) : undefined,
        });

        if (incluir_bloqueados !== 'true') {
            tickets = tickets.filter(t => !esBloqueado(t));
        }

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets obtenidos exitosamente',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[getAll]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function getByGrupo(req, reply) {
    try {
        const { grupo_id } = req.params;

        let tickets = await TicketModel.findByGrupo(Number(grupo_id));
        tickets = tickets.filter(t => !esBloqueado(t));

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets del grupo obtenidos exitosamente',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[getByGrupo]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

const getMisTickets = async (req, reply) => {
    const { grupo_id } = req.params;
    const usuario_id = req.user?.id || req.usuario?.id || req.userId;

    if (!usuario_id) {
        return reply.code(401).send({ error: 'No se pudo identificar al usuario' });
    }

    const { rows: permisosRows } = await db.query(
        `SELECT p.nombre FROM public.grupo_usuario_permisos gup
        JOIN public.permisos p ON p.id = gup.permiso_id
        WHERE gup.usuario_id = $1
            AND gup.grupo_id = $2
            AND p.nombre = ANY($3::text[])`,
        [usuario_id, grupo_id, ['ticket_view_owner', 'ticket_view_created']]
    );

    const permisos = permisosRows.map(r => r.nombre);
    const tieneViewOwner   = permisos.includes('ticket_view_owner');
    const tieneViewCreated = permisos.includes('ticket_view_created');

    try {
        const resultados = await Promise.all([
            tieneViewOwner   ? TicketModel.findTicketsAsignados(usuario_id, grupo_id) : [],
            tieneViewCreated ? TicketModel.findTicketsCreados(usuario_id, grupo_id)   : [],
        ]);
        const mapa = new Map();
        resultados.flat().forEach(t => mapa.set(t.id, t));
        const tickets = [...mapa.values()];

        return reply.code(201).send(buildResponse({
            statusCode: 201,
            inOpCode:   'OK',
            message:    'Tickets obtenidos exitosamente',
            data:       tickets,
        }));

    } catch (error) {
        req.log.error('Error al obtener mis tickets:', error);
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
};

async function getSinAsignar(req, reply) {
    try {
        const { grupo_id } = req.params;
        const tickets = await TicketModel.findSinAsignar(Number(grupo_id));

        return reply.code(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets sin asignar obtenidos exitosamente',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[getSinAsignar]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function getAltaPrioridad(req, reply) {
    try {
        const { grupo_id } = req.params;
        const tickets = await TicketModel.findAltaPrioridad(Number(grupo_id));

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets de alta prioridad obtenidos',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[AltaPrioridad]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function getTicketsCreados(req, reply) {
    try {
        const { grupo_id } = req.params;
        const creador_id = req.userId;

        const tickets = await TicketModel.findTicketsCreados(creador_id, grupo_id);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets creados obtenidos',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[TicketsCreados]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function getTicketsAsignados(req, reply) {
    try {
        const { grupo_id } = req.params;
        const asignado_id = req.userId;

        const tickets = await TicketModel.findTicketsAsignados(asignado_id, grupo_id);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Tickets asignados obtenidos',
            data:       tickets,
        }));
    } catch (error) {
        req.log.error(error, '[TicketsAsignados]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

// Devuelve el ticket con comentarios e historial incluidos
async function getById(req, reply) {
    try {
        const { id } = req.params;

        const ticket = await TicketModel.findById(Number(id));

        if (!ticket || esBloqueado(ticket)) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        const [comentarios, historial] = await Promise.all([
            TicketModel.findComentariosByTicket(id),
            TicketModel.findHistorialByTicket(id),
        ]);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Ticket obtenido exitosamente',
            data:       [{ ...ticket, comentarios, historial }],
        }));
    } catch (error) {
        req.log.error(error, '[getById]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function create(req, reply) {
    try {
        const { titulo, descripcion, grupo_id, prioridad_id, asignado_id, fecha_cierre } = req.body;
        console.log("body:", req.body);
        const creador_id = req.userId;

        const isDesactivated = await TicketModel.isDesactivated(creador_id);
            if(isDesactivated) {
            return res.status(401).json(buildResponse({
                statusCode: 401, inOpCode: 'UNAUTHORIZED',
                message: 'Usuario desactivado',
            }));
            }

        const nuevoTicket = await TicketModel.create({
            titulo,
            descripcion,
            grupo_id:     Number(grupo_id),
            creador_id,
            estado_id:    ESTADO.PENDIENTE,
            prioridad_id: Number(prioridad_id),
            asignado_id:  asignado_id ? Number(asignado_id) : null,
            fecha_cierre,
        });

        await TicketModel.registrarHistorial(nuevoTicket.id, creador_id, 'Ticket creado');

        return reply.status(201).send(buildResponse({
            statusCode: 201,
            inOpCode:   'CREATED',
            message:    'Ticket creado exitosamente',
            data:       [nuevoTicket],
        }));
    } catch (error) {
        req.log.error(error, '[create]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function update(req, reply) {
    try {
        const { id }     = req.params;
        const usuario_id = req.userId;

        const ticket = await TicketModel.findById(Number(id));
        if (!ticket || esBloqueado(ticket)) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        const actualizado = await TicketModel.update(Number(id), req.body);
        if (!actualizado) {
            return reply.status(400).send(buildResponse({
                statusCode: 400,
                inOpCode:   'BAD_REQUEST',
                message:    'No se proporcionaron campos válidos para actualizar',
            }));
        }

        await TicketModel.registrarHistorial(id, usuario_id, 'Ticket actualizado');

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Ticket actualizado exitosamente',
            data:       [actualizado],
        }));
    } catch (error) {
        req.log.error(error, '[update]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function cambiarEstado(req, reply) {
    try {
        const { ticketId }      = req.params;
        const { estado_id } = req.body;
        const usuario_id  = req.userId;

        console.log("usuario:", usuario_id, "ticket:", ticketId, "estado_id:", estado_id);

        const ticket = await TicketModel.findById(Number(ticketId));
        if (!ticket) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        if (esBloqueado(ticket)) {
            return reply.status(409).send(buildResponse({
                statusCode: 409,
                inOpCode:   'CONFLICT',
                message:    'El ticket está bloqueado y no puede cambiar de estado',
            }));
        }

        const actualizado = await TicketModel.cambiarEstado(Number(ticketId), Number(estado_id));

        const accionHistorial = Number(estado_id) === ESTADO.BLOQUEADO
            ? 'Ticket bloqueado (eliminado)'
            : `Estado cambiado a ID ${estado_id}`;

        await TicketModel.registrarHistorial(ticketId, usuario_id, accionHistorial);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Estado del ticket actualizado exitosamente',
            data:       [actualizado],
        }));
    } catch (error) {
        req.log.error(error, '[cambiarEstado]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function asignar(req, reply) {
    try {
        const { ticketId } = req.params;
        const { asignado_id } = req.body;
        const usuario_id    = req.userId;

        const isDesactivated = await TicketModel.isDesactivated(asignado_id);
            if(isDesactivated) {
            return res.status(401).json(buildResponse({
                statusCode: 401, inOpCode: 'UNAUTHORIZED',
                message: 'Usuario desactivado',
            }));
            }

        const ticket = await TicketModel.findById(Number(ticketId));
        if (!ticket || esBloqueado(ticket)) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        const actualizado = await TicketModel.update(Number(ticketId), {
            asignado_id: asignado_id ? Number(asignado_id) : null,
        });

        const accion = asignado_id
            ? `Ticket asignado a usuario ID ${asignado_id}`
            : 'Ticket desasignado';

        await TicketModel.registrarHistorial(id, usuario_id, accion);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    asignado_id ? 'Ticket asignado exitosamente' : 'Ticket desasignado exitosamente',
            data:       [actualizado],
        }));
    } catch (error) {
        req.log.error(error, '[asignar]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function agregarComentario(req, reply) {
    try {
        const { id }        = req.params;
        const { comentario } = req.body;
        const usuario_id    = req.userId;

        const ticket = await TicketModel.findById(Number(id));
        if (!ticket || esBloqueado(ticket)) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        const nuevoComentario = await TicketModel.crearComentario(id, usuario_id, comentario.trim());
        await TicketModel.registrarHistorial(id, usuario_id, 'Comentario agregado');

        return reply.status(201).send(buildResponse({
            statusCode: 201,
            inOpCode:   'CREATED',
            message:    'Comentario agregado exitosamente',
            data:       [nuevoComentario],
        }));
    } catch (error) {
        req.log.error(error, '[agregarComentario]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function getHistorial(req, reply) {
    try {
        const { id } = req.params;

        const historial = await TicketModel.findHistorialByTicket(id);

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Historial obtenido exitosamente',
            data:       historial,
        }));
    } catch (error) {
        req.log.error(error, '[getHistorial]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
}

async function remove(req, reply) {
    try {
        const { id }     = req.params;
        const usuario_id = req.userId;

        const ticket = await TicketModel.findById(Number(id));
        if (!ticket) {
            return reply.status(404).send(buildResponse({
                statusCode: 404,
                inOpCode:   'NOT_FOUND',
                message:    'Ticket no encontrado',
            }));
        }

        if (esBloqueado(ticket)) {
            return reply.status(409).send(buildResponse({
                statusCode: 409,
                inOpCode:   'CONFLICT',
                message:    'El ticket ya está bloqueado',
            }));
        }

        await TicketModel.cambiarEstado(Number(id), ESTADO.BLOQUEADO);
        await TicketModel.registrarHistorial(id, usuario_id, 'Ticket bloqueado (eliminado)');

        return reply.status(200).send(buildResponse({
            statusCode: 200,
            inOpCode:   'OK',
            message:    'Ticket bloqueado correctamente',
        }));
    } catch (error) {
        req.log.error(error, '[remove]');
        return reply.status(500).send(buildResponse({
            statusCode: 500,
            inOpCode:   'INTERNAL_ERROR',
            message:    'Error interno del servidor',
        }));
    }
    
}

module.exports = { getAll, getByGrupo, getSinAsignar, getById, create, update,
    cambiarEstado, asignar, agregarComentario, getHistorial, remove, getAltaPrioridad, getTicketsAsignados, getTicketsCreados, getMisTickets
};