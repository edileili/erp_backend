const express = require('express');
const router  = express.Router();

const {
  listarUsuarios, verUsuario, crearUsuario,
  editarUsuario, eliminarUsuario,
  listarPermisos, actualizarPermisos,
} = require('../controllers/admin.controller');

const authMiddleware   = require('../middlewares/auth.middleware');
const {permiso, requirePermisoGrupo}          = require('../middlewares/permiso.middleware');
const validate         = require('../middlewares/validate.middleware');
const { registroSchema, actualizarSchema } = require('../schemas/usuario.schema');

router.get   ('/',         authMiddleware, permiso('users_view'),    listarUsuarios);
router.get   ('/:id',      authMiddleware, permiso('user_view'), verUsuario);
router.post('/',  authMiddleware, validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('user_edit'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('user_remove'),eliminarUsuario);

//Gestión de permisos
router.get   ('/permisos',          authMiddleware, permiso('user_edit'), listarPermisos);
router.put   ('/:id/permisos',      authMiddleware, permiso('user_edit_permissions'), actualizarPermisos);

module.exports = router;