const PermisoModel = require('../../services/core/src/models/permiso.model');

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

module.exports = permiso;