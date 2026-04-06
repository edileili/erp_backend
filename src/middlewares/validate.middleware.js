const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv); // Habilita: "email", "date", etc.

/**
 * Factory que devuelve un middleware validador para el schema dado.
 * @param {object} schema - JSON Schema a validar
 */
const validate = (schema) => (req, res, next) => {
  const validate = ajv.compile(schema);
  const valid = validate(req.body);

  if (!valid) {
    const errores = validate.errors.map((e) => ({
      campo: e.instancePath.replace('/', '') || e.params?.missingProperty || 'body',
      mensaje: e.message,
    }));

    return res.status(400).json({
      ok: false,
      statusCode: 400,
      mensaje: 'Datos de entrada inválidos',
      errores,
    });
  }

  next();
};

module.exports = validate;