const express = require('express');
const router  = express.Router();

const { findAll, findById, getMiembros, create, update, newMiembro, softDelete, removeMiembro, permisoUsuarioGrupo, permisosUsuario, getMyGroups, permisosGrupos } = require('../controllers/grupo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const {permiso, permisoGrupo} = require('../middlewares/permiso.middleware');

//Permisos Generales
router.get('/permisos-group', authMiddleware, permiso('group_edit_permissions'), permisosGrupos);
router.get('/mis-grupos', authMiddleware, permiso('group_view'), getMyGroups);
router.get('/', authMiddleware, permiso('group_manage'), findAll);
router.post('/', authMiddleware, permiso('group_add'), create);

//Permisos de grupo
router.get('/:id', authMiddleware, permiso('group_view'), findById);
router.get('/:id/miembros', authMiddleware, permiso('group_view'), getMiembros);
router.post  ('/:id/miembro',           authMiddleware, permisoGrupo('group_add_member'),   newMiembro);
router.put   ('/:id',                   authMiddleware, permisoGrupo('group_edit'),         update);
router.delete('/:id',                   authMiddleware, permisoGrupo('group_remove'),       softDelete);
router.delete('/:id/miembro/:usuario_id', authMiddleware, permisoGrupo('group_remove_member'), removeMiembro);

//Gestión de permisos
router.post('/:id/permiso', authMiddleware, permiso('user_edit_permissions'), permisoUsuarioGrupo);
router.get('/:id/permisos/:usuario_id', authMiddleware, permisosUsuario);

module.exports = router;