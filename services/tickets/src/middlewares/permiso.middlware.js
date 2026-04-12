const db = require('../../../shared/db-client'); 

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
            [userId, permisos]  // PostgreSQL recibe el array directo
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
            const grupoId = req.params.id ?? req.params.grupo_id;

            if (!grupoId) {
                return res.status(400).json({ message: 'grupo_id es requerido' });
            }

            const { rows } = await db.query(
                `SELECT 1 FROM public.grupo_usuario_permisos gup
                INNER JOIN public.permisos p ON p.id = gup.permiso_id
                WHERE gup.usuario_id = $1
                  AND gup.grupo_id  = $2
                  AND p.nombre = ANY($3)
                LIMIT 1`,
                [req.userId, grupoId, lista]
            );

            if (rows.length === 0) {
                return res.status(403).json({ message: 'No tienes permisos en este grupo' });
            }
        } catch (err) {
            console.error('Error permisoGrupo middleware:', err);
            return res.status(500).json({ message: 'Error verificando permisos de grupo' });
        }
    };
};

module.exports = {permiso, permisoGrupo};