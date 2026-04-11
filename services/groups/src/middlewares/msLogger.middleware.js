'use strict';

function msLogger(nombreServicio, pool) {
    return function (req, res, next) {
        // Guardar el momento de entrada
        const inicio = Date.now();

        // Interceptar el momento en que Express termina de enviar la respuesta
        res.on('finish', () => {
            if (req.url === '/health') return;

            const tiempoMs   = Date.now() - inicio;
            const statusHttp = res.statusCode;
            const usuarioId  = req.headers['x-user-id']
                ? parseInt(req.headers['x-user-id'], 10)
                : null;

            // En Express no tenemos el body de respuesta fácilmente,
            // así que el error_mensaje lo sacamos del status code
            const errorMensaje = statusHttp >= 400
                ? `HTTP ${statusHttp}`
                : null;

            // ── Log ──────────────────────────────────────────────────────────
            pool.query(
                `INSERT INTO api_logs
                    (servicio, endpoint, metodo, ip_origen, status_http,
                     usuario_id, tiempo_ms, error_mensaje)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    nombreServicio,
                    req.path,
                    req.method,
                    req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress,
                    statusHttp,
                    usuarioId,
                    tiempoMs,
                    errorMensaje,
                ]
            ).catch(err => console.error(`[${nombreServicio}] Error al guardar log:`, err.message));

            // ── Métrica ──────────────────────────────────────────────────────
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
                    req.path,
                    req.method,
                    esError === 0 ? 1 : 0,
                    esError,
                    tiempoMs,
                ]
            ).catch(err => console.error(`[${nombreServicio}] Error al guardar métrica:`, err.message));
        });

        next();
    };
}

module.exports = msLogger;