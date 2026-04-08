
module.exports = async (request, reply) => {
    const token = (request.headers['x-internal-token'] || '').trim();
    const secret = (process.env.INTERNAL_SECRET || '').trim();

    if (!token || token !== secret) {
        console.error('[Auth Interna] ERROR: Los tokens no coinciden');
        return reply.code(403).send({ 
            error: 'Acceso interno denegado',
            detail: 'Token inválido o no proporcionado' 
        });
    }
};