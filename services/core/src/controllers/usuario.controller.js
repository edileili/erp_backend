const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

const UsuarioModel = require('../models/usuario.model');
const PermisoModel = require('../models/permiso.model');

// ── Helper: genera JWT ─────────────────────────────────────────────────────
const generarToken = (usuario, permisos = []) =>
  jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, email: usuario.email, 
      nombre_com: usuario.nombre_com, permisos },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

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

// ── POST /api/usuarios/registro ────────────────────────────────────────────
const registro = async (req, res) => {
  try {
    const { usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono } = req.body;

    const duplicado = await UsuarioModel.existeDuplicado(email, usuario);
    if (duplicado) {
      return res.status(409).json(buildResponse({
        statusCode: 409,
        inOpCode: 'CONFLICT',
        message: 'El email o usuario ya está registrado',
      }));
    }

    const hash = await bcrypt.hash(contrasenia, 10);
    const nuevoUsuario = await UsuarioModel.create({
      usuario, email, contrasenia: hash, nombre_com, direccion, fecha_nacimiento, telefono,
    });

    const permisosAsignados = await UsuarioModel.assignGeneralPermissions(nuevoUsuario.id);

    return res.status(201).json(buildResponse({
      statusCode: 201,
      inOpCode: 'CREATED',
      message: 'Usuario registrado exitosamente',
      data: [{
        ...nuevoUsuario,
        permisos: permisosAsignados.map(p => p.nombre), // solo los nombres, como en tu referencia
      }],
    }));
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json(buildResponse({
      statusCode: 500,
      inOpCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    }));
  }
};

// ── POST /api/usuarios/login ───────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    const usuario = await UsuarioModel.findByEmail(email);
    if (!usuario) {
      return res.status(401).json(buildResponse({
        statusCode: 401, inOpCode: 'UNAUTHORIZED',
        message: 'Credenciales incorrectas',
      }));
    }

    const passwordValido = await bcrypt.compare(contrasenia, usuario.contrasenia);
    if (!passwordValido) {
      return res.status(401).json(buildResponse({
        statusCode: 401, inOpCode: 'UNAUTHORIZED',
        message: 'Credenciales incorrectas',
      }));
    }

    const permisos = await PermisoModel.findByUsuario(usuario.id);
    const nombresPermisos = permisos.map(p => p.nombre);

    const token = generarToken(usuario, nombresPermisos);
    const { contrasenia: _, ...usuarioSinPassword } = usuario;

    return res.status(200).json(buildResponse({
      statusCode: 200, 
      inOpCode: 'OK',
      message: 'Login exitoso',
      data: [{
        accessToken: token,
        usuario: {
          ...usuarioSinPassword,
          permisos: nombresPermisos,
        },
      }],
    }));
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json(buildResponse({
      statusCode: 500, inOpCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    }));
  }
};

// ── GET /api/usuarios/perfil ───────────────────────────────────────────────
const perfil = async (req, res) => {
  try {
    const usuario = await UsuarioModel.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json(buildResponse({
        statusCode: 404,
        inOpCode: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      }));
    }

    return res.status(200).json(buildResponse({
      statusCode: 200,
      inOpCode: 'OK',
      message: 'Perfil obtenido exitosamente',
      data: [usuario],
    }));
  } catch (err) {
    console.error('Error en perfil:', err);
    return res.status(500).json(buildResponse({
      statusCode: 500,
      inOpCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    }));
  }
};

// ── PUT /api/usuarios/perfil ───────────────────────────────────────────────
const actualizar = async (req, res) => {
  try {
    const usuarioActualizado = await UsuarioModel.update(req.usuario.id, req.body);
    if (!usuarioActualizado) {
      return res.status(404).json(buildResponse({
        statusCode: 404,
        inOpCode: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      }));
    }

    return res.status(200).json(buildResponse({
      statusCode: 200,
      inOpCode: 'UPDATED',
      message: 'Perfil actualizado exitosamente',
      data: [usuarioActualizado],
    }));
  } catch (err) {
    console.error('Error en actualizar:', err);
    return res.status(500).json(buildResponse({
      statusCode: 500,
      inOpCode: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    }));
  }
};

module.exports = { registro, login, perfil, actualizar };