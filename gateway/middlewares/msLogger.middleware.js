'use strict';

function msLogger(nombreServicio, pool) {
    return async function onSendHook(request, reply, payload) {
        if (request.url === '/health') return payload;
 
        const tiempoMs   = Math.round(reply.elapsedTime ?? 0);
        const statusHttp = reply.statusCode;
 
        // El API Gateway inyecta x-user-id en cada request autenticado
        const usuarioId = request.headers['x-user-id']
            ? parseInt(request.headers['x-user-id'], 10)
            : null;
 
        let errorMensaje = null;
        let stackTrace   = null;
 
        if (statusHttp >= 400) {
            try {
                const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
                errorMensaje = body?.error || body?.message || `HTTP ${statusHttp}`;
                // Incluye stack trace solo en desarrollo para no exponer internals en prod
                if (process.env.NODE_ENV !== 'production') {
                    stackTrace = body?.stack || null;
                }
            } catch {
                errorMensaje = `HTTP ${statusHttp}`;
            }
        }
 
        // ── Log ───────────────────────────────────────────────────────────────
        pool.query(
            `INSERT INTO api_logs
                (servicio, endpoint, metodo, ip_origen, status_http,
                 usuario_id, tiempo_ms, error_mensaje, stack_trace)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
                nombreServicio,
                request.url.split('?')[0],
                request.method,
                // IP real: el gateway la reenvía en x-forwarded-for
                request.headers['x-forwarded-for'] || request.ip,
                statusHttp,
                usuarioId,
                tiempoMs,
                errorMensaje,
                stackTrace,
            ]
        ).catch(err => console.error(`[${nombreServicio}] Error al guardar log:`, err.message));
 
        // ── Métrica ───────────────────────────────────────────────────────────
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
        ).catch(err => console.error(`[${nombreServicio}] Error al guardar métrica:`, err.message));
 
        return payload;
    };
}
 
module.exports = msLogger;