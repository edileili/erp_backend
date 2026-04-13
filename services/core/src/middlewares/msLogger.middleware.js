'use strict';
const loggerMiddleware = require('./logger.middleware');
const winstonLogger = require('../utils/winston');

/**
 * Middleware de Logging y Métricas
 * @param {string} nombreServicio 
 * @param {object} pool - Instancia de conexión a la DB (pg)
 */
function msLogger(nombreServicio, pool) {
    return async function onSendHook(request, reply, payload) {
        if (request.url === '/health') return payload;
 
        const tiempoMs   = Math.round(reply.elapsedTime ?? 0);
        const statusHttp = reply.statusCode;
 
        const usuarioId = request.headers['x-user-id']
            ? parseInt(request.headers['x-user-id'], 10)
            : null;
 
        let errorMensaje = null;
        let stackTrace   = null;
        let responseBody = null;
 
        //Parsear Payload
        try {
            responseBody = typeof payload === 'string' ? JSON.parse(payload) : payload;
        } catch {
            responseBody = null;
        }

        if (statusHttp >= 400) {
            errorMensaje = responseBody?.error || responseBody?.message || `HTTP ${statusHttp}`;
            if (process.env.NODE_ENV !== 'production') {
                stackTrace = responseBody?.stack || null;
            }
        }

        //Parsear request body
        let requestBody = null;
        try {
            if (request.body) {
                const raw = Buffer.isBuffer(request.body)
                    ? request.body.toString('utf8')
                    : request.body;
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

                const { password, token, secret, ...safe } = parsed;
                requestBody = Object.keys(safe).length ? safe : null;
            }
        } catch {
            requestBody = null;
        }
 
        // Lógica de Logs
        pool.query(
            `INSERT INTO api_logs
                (servicio, endpoint, metodo, ip_origen, status_http,
                 usuario_id, tiempo_ms, request_body, response_body,
                 error_mensaje, stack_trace)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                nombreServicio,
                request.url.split('?')[0],
                request.method,
                request.headers['x-forwarded-for'] || request.ip,
                statusHttp,
                usuarioId,
                tiempoMs,
                requestBody    ? JSON.stringify(requestBody)  : null,
                responseBody   ? JSON.stringify(responseBody) : null,
                errorMensaje,
                stackTrace,
            ]
        ).catch(err => console.error(`[${nombreServicio}] Error Log:`, err.message));
 
        // Lógica de Métricas (Upsert)
        const esError = statusHttp >= 400 ? 1 : 0;
        pool.query(
            `INSERT INTO api_metricas
                (servicio, endpoint, metodo, ventana_hora,
                 total_requests, requests_exitosos, requests_error,
                 tiempo_total_ms, tiempo_min_ms, tiempo_max_ms)
             VALUES ($1,$2,$3, date_trunc('hour', now()),
                     1, $4, $5,
                     $6, $6, $6)
             ON CONFLICT (servicio, endpoint, metodo, ventana_hora)
             DO UPDATE SET
                 total_requests    = api_metricas.total_requests    + 1,
                 requests_exitosos = api_metricas.requests_exitosos + $4,
                 requests_error    = api_metricas.requests_error    + $5,
                 tiempo_total_ms   = api_metricas.tiempo_total_ms   + $6,
                 tiempo_min_ms     = LEAST(api_metricas.tiempo_min_ms,    $6),
                 tiempo_max_ms     = GREATEST(api_metricas.tiempo_max_ms, $6)`,
            [
                nombreServicio,
                request.url.split('?')[0],
                request.method,
                esError === 0 ? 1 : 0,
                esError,
                tiempoMs,
            ]
        ).catch(err => winstonLogger.error(`[${nombreServicio}] Error al guardar métrica`, { error: err.message }));
 
        return payload;
    };
}

module.exports = msLogger;