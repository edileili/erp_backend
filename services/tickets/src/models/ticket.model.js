const db = require('../../../shared/db-client');

const TicketModel = {
    async findById(id) {
        const { rows } = await db.query(
            `SELECT 
                t.id, 
                t.titulo, 
                t.descripcion,
                t.creado_fecha,
                t.fecha_cierre,
                g.nombre          AS nombre_grupo,
                u_crea.nombre_com AS creado_por_nombre,
                u_asig.nombre_com AS asignado_a_nombre,
                u_asig.id         AS asignado_id,
                est.nombre        AS estado_actual,
                prio.nombre       AS nivel_prioridad
            FROM public.tickets t
            JOIN  public.grupos      g       ON t.grupo_id     = g.id
            JOIN  public.usuarios    u_crea  ON t.creador_id   = u_crea.id
            LEFT  JOIN public.usuarios u_asig ON t.asignado_id = u_asig.id
            JOIN  public.estados     est     ON t.estado_id    = est.id
            JOIN  public.prioridades prio    ON t.prioridad_id = prio.id
            WHERE t.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    async findAll({ grupo_id } = {}) {
        const values = [];
        let queryText = `
            SELECT 
                t.id, t.titulo, t.creado_fecha, t.fecha_cierre,
                g.nombre          AS nombre_grupo,
                u_asig.nombre_com AS asignado_a_nombre,
                est.nombre        AS estado_actual,
                prio.nombre       AS nivel_prioridad
            FROM public.tickets t
            JOIN  public.grupos      g       ON t.grupo_id     = g.id
            LEFT  JOIN public.usuarios u_asig ON t.asignado_id = u_asig.id
            JOIN  public.estados     est     ON t.estado_id    = est.id
            JOIN  public.prioridades prio    ON t.prioridad_id = prio.id
        `;

        if (grupo_id) {
            queryText += ` WHERE g.id = $1`;
            values.push(grupo_id);
        }

        queryText += ` ORDER BY t.creado_fecha DESC`;

        const { rows } = await db.query(queryText, values);
        return rows;
    },

    async findByGrupo(grupo_id) {
        return this.findAll({ grupo_id });
    },

    async findSinAsignar(grupo_id) {
        const { rows } = await db.query(
            `SELECT 
                t.id,
                t.titulo,
                t.creado_fecha,
                g.nombre    AS nombre_grupo,
                est.nombre  AS estado_actual,
                prio.nombre AS nivel_prioridad
            FROM public.tickets t
            JOIN  public.grupos      g    ON t.grupo_id     = g.id
            LEFT  JOIN public.estados     est  ON t.estado_id    = est.id
            LEFT  JOIN public.prioridades prio ON t.prioridad_id = prio.id
            WHERE t.asignado_id IS NULL
              AND g.id = $1
            ORDER BY t.creado_fecha DESC`,
            [grupo_id]
        );
        return rows;
    },

    async create({ titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id = null, fecha_cierre }) {
        const { rows } = await db.query(
            `INSERT INTO public.tickets
                (titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id, creado_fecha, fecha_cierre)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
             RETURNING id, titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id, creado_fecha, fecha_cierre`,
            [titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id, fecha_cierre]
        );
        return rows[0];
    },

    async update(id, campos) {
        const PERMITIDOS = ['titulo', 'descripcion', 'grupo_id', 'prioridad_id', 'asignado_id'];
        const camposFiltrados = Object.fromEntries(
            Object.entries(campos).filter(([k]) => PERMITIDOS.includes(k))
        );

        if (Object.keys(camposFiltrados).length === 0) return null;

        const keys      = Object.keys(camposFiltrados);
        const values    = Object.values(camposFiltrados);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

        const { rows } = await db.query(
            `UPDATE public.tickets
             SET ${setClause}
             WHERE id = $${keys.length + 1}
             RETURNING id, titulo, descripcion, estado_id, prioridad_id, asignado_id`,
            [...values, id]
        );
        return rows[0] || null;
    },

    async cambiarEstado(id, estado_id) {
        const { rows } = await db.query(
            `UPDATE public.tickets
             SET estado_id = $1
             WHERE id = $2
             RETURNING id, titulo, estado_id`,
            [estado_id, id]
        );
        return rows[0] || null;
    },

    async findComentariosByTicket(ticket_id) {
        const { rows } = await db.query(
            `SELECT 
                c.id,
                c.comentario,
                c.creado_fecha,
                u.nombre_com AS autor
             FROM public.comentarios c
             JOIN public.usuarios u ON c.usuario_id = u.id
             WHERE c.ticket_id = $1
             ORDER BY c.creado_fecha ASC`,
            [ticket_id]
        );
        return rows;
    },

    async crearComentario(ticket_id, usuario_id, comentario) {
        const { rows } = await db.query(
            `INSERT INTO public.comentarios (ticket_id, usuario_id, comentario, creado_fecha)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, comentario, creado_fecha`,
            [ticket_id, usuario_id, comentario]
        );
        return rows[0];
    },

    async findHistorialByTicket(ticket_id) {
        const { rows } = await db.query(
            `SELECT 
                h.id,
                h.accion,
                h.creado_fecha,
                u.nombre_com AS usuario
             FROM public.historial_tickets h
             JOIN public.usuarios u ON h.usuario_id = u.id
             WHERE h.ticket_id = $1
             ORDER BY h.creado_fecha ASC`,
            [ticket_id]
        );
        return rows;
    },

    async registrarHistorial(ticket_id, usuario_id, accion) {
        await db.query(
            `INSERT INTO public.historial_tickets (ticket_id, usuario_id, accion, creado_fecha)
             VALUES ($1, $2, $3, NOW())`,
            [ticket_id, usuario_id, accion]
        );
    },
};

module.exports = TicketModel;