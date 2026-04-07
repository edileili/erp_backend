const express = require('express');
const router  = express.Router();

const {
  listarUsuarios, verUsuario, crearUsuario,
  editarUsuario, eliminarUsuario,
  listarPermisos, actualizarPermisos,
} = require('../controllers/admin.controller');

const authMiddleware   = require('../../../../gateway/middlewares/auth.middleware');
const permiso          = require('../../../../gateway/middlewares/permiso.middleware');
const validate         = require('../../../../gateway/middlewares/validate.middleware');
const { registroSchema, actualizarSchema } = require('../schemas/usuario.schema');

// ── CRUD Usuarios ──────────────────────────────────────────────────────────
router.get   ('/',         authMiddleware, permiso('usuarios:leer'),    listarUsuarios);
router.get   ('/:id',       verUsuario);
router.post('/',  validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('usuarios:editar'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('usuarios:eliminar'),eliminarUsuario);

// ── Gestión de permisos ────────────────────────────────────────────────────
router.get   ('/permisos',          authMiddleware, permiso('usuarios:editar'), listarPermisos);
router.put   ('/:id/permisos',      authMiddleware, permiso('usuarios:editar'), actualizarPermisos);
/*
router.get   ('/',         authMiddleware, permiso('usuarios:leer'),    listarUsuarios);
router.get   ('/:id',      authMiddleware, permiso('usuarios:leer'), verUsuario);
router.post('/', authMiddleware, permiso('user_edit'), validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('usuarios:editar'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('usuarios:eliminar'),eliminarUsuario);
*/
module.exports = router;