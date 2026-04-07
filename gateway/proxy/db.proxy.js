const express = require('express');
const pool = require('../config/database');

const router = express.Router();

const ALLOWED_OPERATIONS = new Set([
    'SELECT', 'INSERT', 'UPDATE', 'DELETE',
]);

function getOperation(query = '') {
    return query.trim().split(/\s+/)[0].toUpperCase();
}

router.post('/', async (req, res) => {
    const { query, params = []} = req.body;

    if(!query || typeof query !== 'string') {
        return res.status(400).json({error: 'Query inválida'});
    }

    const operation = getOperation(query);
    if(!ALLOWED_OPERATIONS.has(operation)) {
        return res.status(403).json({error: 'Operación no permitida'});
    }

    try {
        const result = await pool.query(query, params);
        res.json({rows: result.rows, rowCount: result.rowCount});
    } catch (err) {
        console.error('Error en la query', err.message);
        res.status(500).json({error: 'Error en la base de datos', detail: err.message});
    }
});

module.exports = router;