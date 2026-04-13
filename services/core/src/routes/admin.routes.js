const express = require('express');
const router  = express.Router();

const {
  listarUsuarios, verUsuario, crearUsuario,
  editarUsuario, eliminarUsuario,
  listarPermisos, actualizarPermisos,
  getPermisosUser,
  getPermisosUserEnGrupo,
  permisosUsuarios,
  permisosGrupos,
} = require('../controllers/admin.controller');

const authMiddleware   = require('../middlewares/auth.middleware');
const {permiso}          = require('../middlewares/permiso.middleware');
const validate         = require('../middlewares/validate.middleware');
const { registroSchema, actualizarSchema } = require('../schemas/usuario.schema');

router.get   ('/permisos',          authMiddleware, permiso('user_edit'), listarPermisos);
router.get   ('/',         authMiddleware, permiso('users_view'),    listarUsuarios);
router.get   ('/:id',      authMiddleware, permiso('user_view'), verUsuario);
router.post('/',  authMiddleware, validate(registroSchema), crearUsuario);
router.put   ('/:id',      authMiddleware, permiso('user_edit'),  validate(actualizarSchema), editarUsuario);
router.delete('/:id',      authMiddleware, permiso('user_remove'),eliminarUsuario);

router.get('/:id/permisos', authMiddleware, permiso('user_edit_permissions'), getPermisosUser);
router.get('/:id/permisos-user', authMiddleware, permiso('user_edit_permissions'), permisosUsuarios);
router.get('/:id/permisos-group', authMiddleware, permiso('group_edit_permissions'), permisosGrupos);

router.get('/:id/permisos/:grupo_id', authMiddleware, permiso('user_edit_permissions'), getPermisosUserEnGrupo);
router.put   ('/:id/permisos',      authMiddleware, permiso('user_edit_permissions'), actualizarPermisos);
//router.delete('/:id/permisos/:permiso_id',      authMiddleware, permiso('user_remove'),eliminarUsuario);

module.exports = router;