const pool = require('../config/database');

const ALLOWED_OPERATIONS = new Set([
    'SELECT', 'INSERT', 'UPDATE', 'DELETE',
]);

function getOperation(query = '') {
    return query.trim().split(/\s+/)[0].toUpperCase();
}

module.exports = async (request, reply) => {
    const { query, params = []} = request.body;

    if(!query || typeof query !== 'string') {
        return reply.code(400).send({error: 'Query inválida'});
    }

    const operation = getOperation(query);
    if(!ALLOWED_OPERATIONS.has(operation)) {
        return reply.code(403).send({error: 'Operación no permitida'});
    }

    try {
        const result = await pool.query(query, params);
        reply.send({rows: result.rows, rowCount: result.rowCount});
    } catch (err) {
        request.log.error('Error en la query', err.message);
        reply.code(500).send({error: 'Error en la base de datos', detail: err.message});
    }
};
