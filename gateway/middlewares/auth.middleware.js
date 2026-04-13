const jwt = require('jsonwebtoken');

module.exports = async (request, reply) => {
    const header = request.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return reply.code(401).send({ error: 'Token requerido' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        request.headers['x-user-id']   = String(user.id);
        request.headers['x-user-role'] = String(user.rol);
        request.user = user;
    } catch (err) {
        console.error('[Auth] Error verificando token',);
        return reply.code(401).send({ error: 'Token inválido o expirado' });
    }
};