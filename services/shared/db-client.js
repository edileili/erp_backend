const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:3000';
const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || '').trim();

const db = {
    async query(query, params = []) {
        const response = await axios.post(
            `${GATEWAY_URL}/internal/db`,
            {query, params},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-token': INTERNAL_SECRET
                },
                timeout: 8000,
            }
        );
        return response.data;
    },
};

module.exports = db;