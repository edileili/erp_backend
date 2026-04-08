const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/usuario.model');
const PermisoModel = require('../models/permiso.model');
const db = require('../../../shared/db-client');

// ── Helper: construye respuesta estandarizada ──────────────────────────────
const buildResponse = ({ statusCode, inOpCode, message, data = [] }) => {
    const generalData = data.length > 0
        ? data.map(item => ({ message, ...item}))
        : [{message}];
    
    return {
        statusCode,
        inOpCode,
        data: generalData,
        total: generalData.length,
        timestamp: new Date().toISOString(),
    };
};

// ── GET /api/admin/usuarios ────────────────────────────────────────────────
const listarUsuarios = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono, created_at
            FROM public.usuarios ORDER BY id`
        );

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Usuarios obtenidos exitosamente',
            data: rows,
        }));
    } catch (err) {
        console.error('Error listarUsuarios:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── GET /api/admin/usuarios/:id ────────────────────────────────────────────
const verUsuario = async (req, res) => {
    try {
        const usuario = await UsuarioModel.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Usuario no encontrado',
            }));
        }

        const permisos = await PermisoModel.findByUsuario(usuario.id);

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Usuario obtenido exitosamente',
            data: [{ ...usuario, permisos }],
        }));
    } catch (err) {
        console.error('Error verUsuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── POST /api/admin/usuarios ───────────────────────────────────────────────
const crearUsuario = async (req, res) => {
    try {
        const { usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono } = req.body;

        const duplicado = await UsuarioModel.existeDuplicado(email);
        if (duplicado) {
            return res.status(409).json(buildResponse({
                statusCode: 409,
                inOpCode: 'CONFLICT',
                message: 'El email o usuario ya existe',
            }));
        }

        const hash = await bcrypt.hash(contrasenia, 10);
        const nuevo = await UsuarioModel.create({
            usuario, email, contrasenia: hash, nombre_com, direccion, fecha_nacimiento, telefono,
        });

        const permisosAsignados = await UsuarioModel.assignGeneralPermissions(nuevo.id);

        return res.status(201).json(buildResponse({
            statusCode: 201,
            inOpCode: 'CREATED',
            message: 'Usuario creado exitosamente',
            data: [{ ...nuevo, permisos: permisosAsignados.map(p => p.nombre) }],
        }));
    } catch (err) {
        console.error('Error crearUsuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── PUT /api/admin/usuarios/:id ────────────────────────────────────────────
const editarUsuario = async (req, res) => {
    try {
        const actualizado = await UsuarioModel.update(req.params.id, req.body);
        if (!actualizado) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Usuario no encontrado',
            }));
        }

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'UPDATED',
            message: 'Usuario actualizado exitosamente',
            data: [actualizado],
        }));
    } catch (err) {
        console.error('Error editarUsuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── DELETE /api/admin/usuarios/:id ────────────────────────────────────────
const eliminarUsuario = async (req, res) => {
    try {
        if (Number(req.params.id) === req.usuario.id) {
            return res.status(400).json(buildResponse({
                statusCode: 400,
                inOpCode: 'BAD_REQUEST',
                message: 'No puedes eliminarte a ti mismo',
            }));
        }

        const { rowCount } = await db.query(
            'DELETE FROM public.usuarios WHERE id = $1',
            [req.params.id]
        );

        if (rowCount === 0) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Usuario no encontrado',
            }));
        }

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'DELETED',
            message: 'Usuario eliminado exitosamente',
        }));
    } catch (err) {
        console.error('Error eliminarUsuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── GET /api/admin/permisos ────────────────────────────────────────────────
const listarPermisos = async (req, res) => {
    try {
        const permisos = await PermisoModel.findAll();

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Permisos obtenidos exitosamente',
            data: permisos,
        }));
    } catch (err) {
        console.error('Error listarPermisos:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

// ── PUT /api/admin/usuarios/:id/permisos ──────────────────────────────────
const actualizarPermisos = async (req, res) => {
    try {
        const { permisos } = req.body;

        if (!Array.isArray(permisos)) {
            return res.status(400).json(buildResponse({
                statusCode: 400,
                inOpCode: 'BAD_REQUEST',
                message: 'Se esperaba un array de IDs en "permisos"',
            }));
        }

        await PermisoModel.sincronizar(req.params.id, permisos);
        const actualizados = await PermisoModel.findByUsuario(req.params.id);

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'UPDATED',
            message: 'Permisos actualizados exitosamente',
            data: actualizados,
        }));
    } catch (err) {
        console.error('Error actualizarPermisos:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};

module.exports = { listarUsuarios, verUsuario, crearUsuario, editarUsuario, eliminarUsuario, listarPermisos, actualizarPermisos };