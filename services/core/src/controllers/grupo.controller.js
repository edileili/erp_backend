require('dotenv').config();

const GrupoModel = require('../models/grupo.model');

const buildResponse = ({ statusCode, inOpCode, message, data = [] }) => ({
    statusCode,
    inOpCode,
    message,
    data,
    total: data.length,
    timestamp: new Date().toISOString(),
});

const findAll = async (req, res) => {
    try {
        const grupos = await GrupoModel.findAll();
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Grupos obtenidos exitosamente',
            data: grupos,
        }));
    } catch (err) {
        console.error('Error en solicitud:', err);
        return res.status(500).json(buildResponse({
        statusCode: 500,
        inOpCode: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        }));
    }
}

const findById = async (req, res) => {
    try {
        const grupo = await GrupoModel.findById(req.params.id);
        if (!grupo) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Grupo no encontrado',
            }));
        }
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Grupo obtenido exitosamente',
            data: [grupo],
        }));
    } catch (err) {
        console.error('Error en solicitud:', err);
        return res.status(500).json(buildResponse({
        statusCode: 500,
        inOpCode: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        }));
    }
}

const getMiembros = async (req, res) => {
    try {
        const miembros = await GrupoModel.getMiembros(req.params.id);
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Miembros obtenidos exitosamente',
            data: miembros,
        }));
    } catch (err) {
        console.error('Error en solicitud:', err);
        return res.status(500).json(buildResponse({
        statusCode: 500,
        inOpCode: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        }));
    }
}

const create = async (req, res) => {
    try {
        const {nombre, descripcion, creador_id} = req.body;
        if (!nombre || !creador_id) {
            return res.status(400).json(buildResponse({
                statusCode: 400,
                inOpCode: 'BAD_REQUEST',
                message: 'Datos incompletos',
            }));
        }
        const nuevo = await GrupoModel.create({nombre, descripcion, creador_id});
        return res.status(200).json(buildResponse({
            statusCode: 201,
            inOpCode: 'CREATED',
            message: 'Grupo creado exitosamente',
            data: [nuevo],
        }));
    } catch (err) {
        console.error('Error en solicitud:', err);
        return res.status(500).json(buildResponse({
        statusCode: 500,
        inOpCode: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        }));
    }
}

const update = async (req, res) => {
    try {
        const actualizado = await GrupoModel.update(req.params.id, req.body);
        if (!actualizado) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Grupo no encontrado',
            }));
        }
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Grupo actualizado exitosamente',
            data: [actualizado],
        }));
    } catch (err) {
        console.error('Error en solicitud:', err);
        return res.status(500).json(buildResponse({
        statusCode: 500,
        inOpCode: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        }));
    }
}

/*const softDelete = async (req, res) => {
    try {
        const eliminado = await GrupoModel.softDelete(req.params.id);
        if (!eliminado) {
            return res.status(404).json(buildResponse({
                statusCode: 404,
                inOpCode: 'NOT_FOUND',
                message: 'Grupo no encontrado o ya eliminado',
            }));
        }
        return res.status(200).json(buildResponse({
            statusCode: 200,
            inOpCode: 'OK',
            message: 'Grupo eliminado exitosamente',
            data: [eliminado],
        }));
    } catch (err) {
        // Error lanzado por tickets activos
        if (err.message.includes('tickets activos')) {
            return res.status(409).json(buildResponse({
                statusCode: 409,
                inOpCode: 'CONFLICT',
                message: err.message,
            }));
        }
        console.error('Error en softDelete grupo:', err);
        return res.status(500).json(buildResponse({
            statusCode: 500,
            inOpCode: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
        }));
    }
};*/

module.exports = {findAll, findById, getMiembros, create, update};