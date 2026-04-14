const grupoSchema = {
    type: 'object',
    required: ['nombre', 'descripcion'],
    additionalProperties: false,
    properties: {
        nombre: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'Nombre del grupo',
        },
        descripcion: {
            type: 'string',
            minLength: 3,
            maxLength: 200,
            description: 'Descripción del grupo',
        },
    },
};

const actualizarSchema = {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: {
        nombre: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
        },
        descripcion: {
            type: 'string',
            minLength: 3,
            maxLength: 200,
        },
        creador_id: {
            type: 'number',
            minimum: 1,
            maximum: 9999999,
        },
    },
};

const idParamSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', minimum: 1 },
        },
    },
};

const idAndUsuarioParamSchema = {
    params: {
        type: 'object',
        required: ['id', 'usuario_id'],
        properties: {
            id:         { type: 'integer', minimum: 1 },
            usuario_id: { type: 'integer', minimum: 1 },
        },
    },
};

const miembroSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', minimum: 1 },
        },
    },
    body: {
        type: 'object',
        required: ['email'],
        additionalProperties: false,
        properties: {
            email: {
                type: 'string',
                format: 'email',
                maxLength: 255,
            },
        },
    },
};

const permisoSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', minimum: 1 },
        },
    },
    body: {
        type: 'object',
        required: ['usuario_id', 'permiso'],
        additionalProperties: false,
        properties: {
            usuario_id: {
                type: 'integer',
                minimum: 1,
                maximum: 9999999,
                description: 'ID del usuario al que se le asigna el permiso',
            },
            permiso: {
                type: 'string',
                minLength: 3,
                maxLength: 100,
                description: 'Nombre del permiso a asignar',
            },
        },
    },
};

module.exports = {
    grupoSchema,
    actualizarSchema,
    idParamSchema,
    idAndUsuarioParamSchema,
    miembroSchema,
    permisoSchema,
};