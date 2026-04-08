const express = require('express');
const router  = express.Router();

const { registro, login } = require('../controllers/usuario.controller');
const validate       = require('../../../../gateway/middlewares/validate.middleware');
const { registroSchema, loginSchema } = require('../schemas/usuario.schema');

router.post('/registro', validate(registroSchema), registro);
router.post('/login',    validate(loginSchema),    login);

module.exports = router;