const express = require('express');
const router  = express.Router();

const {
  listarUsuarios, verUsuario, crearUsuario,
  editarUsuario, eliminarUsuario,
  listarPermisos, actualizarPermisos,
} = require('../controllers/admin.controller');

const authMiddleware   = require('../middlewares/auth.middleware');
const permiso          = require('../middlewares/permiso.middleware');
const validate         = require('../middlewares/validate.middleware');
const { registroSchema, actualizarSchema } = require('../schemas/usuario.schema');

// ── CRUD Usuarios ──────────────────────────────────────────────────────────
router.get   ('/',         authMiddleware, permiso('users_view'),    listarUsuarios);
router.get   ('/:id',      authMiddleware, permiso('user_view'), verUsuario);
router.post('/',  validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('user_edit'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('user_remove'),eliminarUsuario);

// ── Gestión de permisos ────────────────────────────────────────────────────
router.get   ('/permisos',          authMiddleware, permiso('user_edit'), listarPermisos);
router.put   ('/:id/permisos',      authMiddleware, permiso('user_edit'), actualizarPermisos);
/*
router.get   ('/',         authMiddleware, permiso('usuarios:leer'),    listarUsuarios);
router.get   ('/:id',      authMiddleware, permiso('usuarios:leer'), verUsuario);
router.post('/', authMiddleware, permiso('user_edit'), validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('usuarios:editar'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('usuarios:eliminar'),eliminarUsuario);
*/
module.exports = router;