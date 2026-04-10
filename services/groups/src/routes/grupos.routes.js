const express = require('express');
const router  = express.Router();

const { findAll, findById, getMiembros, create, update, newMiembro, softDelete, removeMiembro, permisoUsuarioGrupo, permisosUsuario } = require('../controllers/grupo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const permiso = require('../middlewares/permiso.middleware');

router.get('/', authMiddleware, permiso('group_manage'), findAll);
router.get('/:id', authMiddleware, permiso('group_edit'), findById);
router.get('/:id/miembros', authMiddleware, permiso('group_manage'), getMiembros);
router.post('/:id/miembro', authMiddleware, permiso('group_manage'), newMiembro);
router.post('/', authMiddleware, permiso('group_add'), create);
router.put('/:id', authMiddleware, permiso('group_edit'), update);

router.delete('/:id', authMiddleware, permiso('group_remove'), softDelete);
router.delete('/:id/miembro/:usuario_id', authMiddleware, permiso('group_remove_member'), removeMiembro);
router.post('/:id/permiso', authMiddleware, permiso('user_edit_permissions'), permisoUsuarioGrupo);
router.get('/:id/permisos/:usuario_id', authMiddleware, permiso('user_edit_permissions'), permisosUsuario);

module.exports = router;