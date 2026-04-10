const express = require('express');
const router  = express.Router();

const { findAll, findById, getMiembros, create, update } = require('../controllers/grupo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const permiso = require('../middlewares/permiso.middleware');

router.get('/', authMiddleware, permiso('group_manage'), findAll);
router.get('/:id', authMiddleware, permiso('group_edit'), findById);
router.get('/:id/miembros', authMiddleware, permiso('group_manage'), getMiembros);
router.post('/', authMiddleware, permiso('group_add'), create);
router.put('/:id', authMiddleware, permiso('group_edit'), update);

module.exports = router;