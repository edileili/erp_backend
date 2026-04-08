const express = require('express');
const router  = express.Router();

const { registro, login, perfil, actualizar } = require('../controllers/usuario.controller');
const authMiddleware = require('../../../../gateway/middlewares/auth.middleware');
const validate       = require('../../../../gateway/middlewares/validate.middleware');
const { registroSchema, loginSchema, actualizarSchema } = require('../schemas/usuario.schema');

// ── Rutas públicas ─────────────────────────────────────────────────────────
//('/registro', validate(registroSchema), registro);
//('/login',    validate(loginSchema),    login);

// ── Rutas protegidas (requieren JWT) ───────────────────────────────────────
router.get('/perfil',  authMiddleware, perfil);
router.put('/perfil',  authMiddleware, validate(actualizarSchema), actualizar);

module.exports = router;