
module.exports = async (request, reply) => {
    const token = request.headers['x-internal-token'];
    if(!token || token !== process.env.INTERNAL_SECRET) {
        return res.status(403).json({error: 'Acceso interno denegado'});
    }
};