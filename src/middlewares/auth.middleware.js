const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware: verifica el JWT del header Authorization.
 * Si es válido, adjunta el payload decodificado en req.usuario.
 *
 * El token contiene: { id, usuario, email, nombre_com }
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Token no proporcionado o formato inválido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, usuario, email, nombre_com, iat, exp }
    next();
  } catch (err) {
    const mensaje =
      err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';

    return res.status(401).json({ ok: false, mensaje });
  }
};

module.exports = authMiddleware;