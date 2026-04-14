const db = require('../../../shared/db-client'); 
const PermisoModel = require('../models/permiso.model')

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

const permiso = (nombrePermiso) => async (request, reply) => {
    try {
        const userId = request.headers['x-user-id'];
        
        if (!userId) {
            return reply.code(401).send({ error: 'Usuario no autenticado' });
        }

        const permisos = Array.isArray(nombrePermiso) ? nombrePermiso : [nombrePermiso];

        const { rows } = await db.query(
            `SELECT 1 FROM public.permisos_generales pg
            JOIN public.permisos p ON p.id = pg.permiso_id
            WHERE pg.usuario_id = $1 
              AND p.nombre = ANY($2::text[])
            LIMIT 1`,
            [userId, permisos] 
        );

        if (rows.length === 0) {
            return reply.code(403).send({
                statusCode: 403,
                inOpCode: 'FORBIDDEN',
                message: `No tienes permiso para realizar esta acción (${permisos.join(', ')})`,
                data: [],
                total: 0,
                timestamp: new Date().toISOString(),
            });
        }

    } catch (err) {
        request.log.error('Error en middleware de permiso:', err);
        return reply.code(500).send({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
            data: [],
            total: 0,
            timestamp: new Date().toISOString(),
        });
    }
};

const permisoGrupo = (permisosRequeridos) => {
    const lista = Array.isArray(permisosRequeridos) ? permisosRequeridos : [permisosRequeridos];

    return async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const manage = await PermisoModel.tienePermiso(userId, 'ticket_manage');
            if (manage) return;

            const grupoId = req.params.grupo_id ?? req.body?.grupo_id;
            if (!grupoId) {
                return res.status(400).send(buildResponse({
                    statusCode: 400,
                    inOpCode: 'BAD_REQUEST',
                    message: 'grupo_id es requerido',
                }));
            }

            const tiene = await PermisoModel.tienePermisoEnGrupo(userId, grupoId, lista);
            console.log("lista:", lista);
            console.log("user:", userId);
            console.log("grupo:", grupoId);
            console.log("Tiene:", tiene);
            if (!tiene) {
                return res.status(403).send(buildResponse({
                    statusCode: 403,
                    inOpCode: 'FORBIDDEN',
                    message: `No tienes permisos en este grupo`,
                }));
            }

        } catch (err) {
            console.error('Error permisoGrupo middleware:', err);
            return res.status(500).send(buildResponse({
                statusCode: 500,
                inOpCode: 'INTERNAL_ERROR',
                message: 'Error interno del servidor',
            }));
        }
    };
};

module.exports = {permiso, permisoGrupo};