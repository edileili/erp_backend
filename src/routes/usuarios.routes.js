const express = require('express');
const router  = express.Router();

const { registro, login, perfil, actualizar } = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate       = require('../middlewares/validate.middleware');
const { registroSchema, loginSchema, actualizarSchema } = require('../schemas/usuario.schema');

// ── Rutas públicas ─────────────────────────────────────────────────────────
router.post('/registro', validate(registroSchema), registro);
router.post('/login',    validate(loginSchema),    login);

// ── Rutas protegidas (requieren JWT) ───────────────────────────────────────
router.get('/perfil',  authMiddleware, perfil);
router.put('/perfil',  authMiddleware, validate(actualizarSchema), actualizar);

module.exports = router;