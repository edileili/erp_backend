const express = require('express');
const router  = express.Router();

const { findAll, findById, getMiembros, create, update } = require('../controllers/grupo.controller');
const authMiddleware = require('../../../../gateway/middlewares/auth.middleware');

router.get('/', findAll);
router.get('/:id', findById);
router.get('/:id/miembros', getMiembros);
router.post('/', create);
router.put('/:id', update);

module.exports = router;