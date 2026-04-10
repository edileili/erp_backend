const express = require('express');
const router  = express.Router();

const {perfil, actualizar } = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate       = require('../middlewares/validate.middleware');
const { actualizarSchema } = require('../schemas/usuario.schema');

// ── Rutas protegidas (requieren JWT) ───────────────────────────────────────
router.get('/perfil/:id', authMiddleware, perfil);
router.put('/perfil', authMiddleware, validate(actualizarSchema), actualizar);

module.exports = router;