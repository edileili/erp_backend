
module.exports = (req, res, next) => {
    const token = req.headers['x-internal-token'];
    if(!token || token !== process.env.JWT_SECRET) {
        return res.status(403).json({error: 'Acceso interno denegado'});
    }
    next();
}