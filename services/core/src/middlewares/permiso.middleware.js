const PermisoModel = require('../models/permiso.model');

const buildResponse = ({ statusCode, inOpCode, message, data = [] }) => ({
  statusCode,
  inOpCode,
  message,
  data,
  total: data.length,
  timestamp: new Date().toISOString(),
});

const permiso = (nombrePermiso) => async (req, res, next) => {
  try {
    const tiene = await PermisoModel.tienePermiso(req.usuario.id, nombrePermiso);

    if (!tiene) {
      return res.status(403).json(buildResponse({
        statusCode: 403,
        inOpCode: 'FORBIDDEN',
        message: `No tienes permiso para realizar esta acción (${nombrePermiso})`,
      }));
    }

    next();
  } catch (err) {
    console.error('Error en middleware de permiso:', err);
    return res.status(500).json(buildResponse({
      statusCode: 500,
      inOpCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    }));
  }
};

const permisoGrupo = (permisosRequeridos) => {
    const lista = Array.isArray(permisosRequeridos) ? permisosRequeridos : [permisosRequeridos];

    return async (req, res, next) => {
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
                [req.usuario.id, grupoId, lista]
            );

            if (rows.length === 0) {
                return res.status(403).json({ message: 'No tienes permisos en este grupo' });
            }
            next();
        } catch (err) {
            console.error('Error permisoGrupo middleware:', err);
            return res.status(500).json({ message: 'Error verificando permisos de grupo' });
        }
    };
};

module.exports = {permiso, permisoGrupo};