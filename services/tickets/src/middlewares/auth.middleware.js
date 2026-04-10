module.exports = async (request, reply) => {
    let userId = request.headers['x-user-id'];
    
    if (!userId) {
        const header = request.headers['authorization'] || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const user = jwt.verify(token, process.env.JWT_SECRET);
                userId = String(user.id);
                request.headers['x-user-id'] = userId;
            } catch {
                return reply.code(401).send({ error: 'Token inválido' });
            }
        }
    }

    if (!userId) {
        return reply.code(401).send({ error: 'No autenticado' });
    }

    request.userId = userId;
};