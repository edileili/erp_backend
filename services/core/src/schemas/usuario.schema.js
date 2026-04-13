// ─── Schema: Registro de usuario ────────────────────────────────────────────
const registroSchema = {
    type: 'object',
    required: ['usuario', 'email', 'contrasenia', 'nombre_com', 'direccion', 'fecha_nacimiento', 'telefono'],
    additionalProperties: false,
    properties: {
        usuario: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'Nombre de usuario único',
        },
        email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
        },
        contrasenia: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            description: 'Mínimo 8 caracteres',
        },
        nombre_com: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nombre completo del usuario',
        },
        direccion: {
            type: 'string',
            minLength: 5,
            maxLength: 255,
        },
        fecha_nacimiento: {
            type: 'string',
            format: 'date',
            description: 'Formato ISO: YYYY-MM-DD',
        },
        telefono: {
            type: 'number',
            minimum: 1000000000,
            maximum: 9999999999,
            description: '10 dígitos numéricos',
        },
    },
};

// ─── Schema: Login ───────────────────────────────────────────────────────────
const loginSchema = {
    type: 'object',
    required: ['email', 'contrasenia'],
    additionalProperties: false,
    properties: {
        email: {
            type: 'string',
            format: 'email',
        },
        contrasenia: {
            type: 'string',
            minLength: 1,
        },
    },
};

// ─── Schema: Actualización parcial ──────────────────────────────────────────
const actualizarSchema = {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: {
        usuario: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        nombre_com: { type: 'string', minLength: 2, maxLength: 100 },
        contrasenia: { type: 'string', minLength: 8, maxLength: 100, description: 'Mínimo 8 caracteres', },
        direccion: { type: 'string', minLength: 5, maxLength: 255 },
        fecha_nacimiento: { type: 'string', format: 'date-time' },
        telefono: { type: 'number', minimum: 1000000000, maximum: 9999999999 },
    },
};

module.exports = { registroSchema, loginSchema, actualizarSchema };