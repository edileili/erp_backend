require('dotenv').config();
const express      = require('express');
const gruposRoutes = require('./routes/grupos.routes');

const app  = express();
const PORT = process.env.GROUPS_PORT || 3003;

app.use(express.json());

app.use((req, _res, next) => {
    req.userId   = req.headers['x-user-id'];
    req.userRole = req.headers['x-user-role'];
    next();
});

//Rutas
app.use('/api/grupos', gruposRoutes);

//Health check
app.get('/health', (_req, res) => res.json({ service: 'grupos', status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`[Grupos Service] corriendo en puerto ${PORT}`));