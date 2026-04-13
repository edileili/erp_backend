const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/usuario.model');
const PermisoModel = require('../models/permiso.model');
const db = require('../../../shared/db-client');

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

const listarUsuarios = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.usuario, 
                u.email, 
                u.nombre_com, 
                -- Si NO existe el permiso 'user_desactivated', entonces está activo
                NOT EXISTS (
                    SELECT 1 
                    FROM public.permisos_generales pg
                    JOIN public.permisos p ON pg.permiso_id = p.id
                    WHERE pg.usuario_id = u.id 
                      AND p.nombre = 'user_desactivated'
                ) AS activo
            FROM public.usuarios u
            ORDER BY u.id
        `;

        const { rows } = await db.query(query);

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

const editarUsuario = async (req, res) => {
    try {
        const camposAActualizar = { ...req.body };
            
        if (camposAActualizar.contrasenia) {
            const saltRounds = 10;
            camposAActualizar.contrasenia = await bcrypt.hash(camposAActualizar.contrasenia, saltRounds);
        }
        const actualizado = await UsuarioModel.update(req.params.id, camposAActualizar);
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

const eliminarUsuario = async (req, res) => {
    try {
        const adminId = req.usuario?.id || req.usuario?._id || req.userId;
        const targetId = Number(req.params.id); 

        if (targetId === adminId) {
            return res.status(400).json(buildResponse({
                statusCode: 400,
                inOpCode: 'BAD_REQUEST',
                message: 'No puedes eliminarte a ti mismo',
            }));
        }

        const filasGrupos = await PermisoModel.revocarEnGrupo(targetId);
        const filasGenerales = await PermisoModel.revocarTodo(targetId);
        await PermisoModel.desactivar(targetId);

        if (filasGrupos === 0 && filasGenerales === 0) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Usuario no encontrado',
            }));
        }

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'DELETED',
            message: 'Usuario desactivado exitosamente',
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

const permisosUsuarios = async (req, res) => {
    try {
        const permisos = await PermisoModel.findGenerales();

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

const permisosGrupos = async (req, res) => {
    try {
        const permisos = await PermisoModel.findDeGrupo();

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

const revocarPermiso = async (req, res) => {
    try {
        const { id, permiso_id} = Number(req.params.id);
        const permisos = await PermisoModel.revocar(id, permiso_id);

        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Permiso revocado exitosamente',
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

const getPermisosUser = async (req, res) => {
    try {
        const user = req.params.id;
        const permisos = await PermisoModel.findByUsuario(user);
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Permisos obtenidos exitosamente',
            data: permisos,
        }));
    } catch (err) {
        console.error('Error permisos usuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
}

const getPermisosUserEnGrupo = async (req, res) => {
    try {
        const { id, grupo_id } = req.params;
        const permisos = await PermisoModel.findByUsuarioEnGrupo(id, grupo_id);
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Permisos en grupo obtenidos exitosamente',
            data: permisos,
        }));
    } catch (err) {
        console.error('Error permisos usuario:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
}

const actualizarPermisos = async (req, res) => {
    try {
        const id = req.params.id;
        const { permisos } = req.body;

        if (!Array.isArray(permisos)) {
            return res.status(400).json(buildResponse({
                statusCode: 400,
                inOpCode: 'BAD_REQUEST',
                message: 'Se esperaba un array de IDs en "permisos"',
            }));
        }

        await PermisoModel.sincronizar(id, permisos);
        const actualizados = await PermisoModel.findByUsuario(id);

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

module.exports = { listarUsuarios, verUsuario, crearUsuario, editarUsuario, eliminarUsuario, listarPermisos, actualizarPermisos, getPermisosUser, getPermisosUserEnGrupo, revocarPermiso, permisosGrupos, permisosUsuarios };