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
            const manage = await PermisoModel.tienePermiso(req.usuario.id, 'group_manage');
            if (manage) return next();

            const grupoId = req.params.id ?? req.params.grupo_id;
            if (!grupoId) {
                return res.status(400).json(buildResponse({
                    statusCode: 400,
                    inOpCode: 'BAD_REQUEST',
                    message: 'grupo_id es requerido',
                }));
            }

            const tiene = await PermisoModel.tienePermisoEnGrupo(req.usuario.id, grupoId, lista);
            if (!tiene) {
                return res.status(403).json(buildResponse({
                    statusCode: 403,
                    inOpCode: 'FORBIDDEN',
                    message: `No tienes permisos en este grupo`,
                }));
            }

            next();
        } catch (err) {
            console.error('Error permisoGrupo middleware:', err);
            return res.status(500).json(buildResponse({
                statusCode: 500,
                inOpCode: 'INTERNAL_ERROR',
                message: 'Error interno del servidor',
            }));
        }
    };
};

module.exports = {permiso, permisoGrupo};