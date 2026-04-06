const pool = require('../config/database');

// ID del estado "cerrado" en tu tabla estados — ajusta si es diferente
const ESTADO_CERRADO_ID = 5;

const TicketModel = {

    // ─── READ ────────────────────────────────────────────────────────────────

    async findById(id) {
        const { rows } = await pool.query(
            `SELECT 
                t.id, 
                t.titulo, 
                t.descripcion,
                t.creado_fecha,
                t.fecha_cierre,
                g.nombre        AS nombre_grupo,
                u_crea.nombre_com AS creado_por_nombre,
                u_asig.nombre_com AS asignado_a_nombre,
                u_asig.id         AS asignado_id,
                est.nombre        AS estado_actual,
                prio.nombre       AS nivel_prioridad
            FROM public.tickets t
            JOIN public.grupos      g       ON t.grupo_id    = g.id
            JOIN public.usuarios    u_crea  ON t.creador_id  = u_crea.id
            LEFT JOIN public.usuarios u_asig ON t.asignado_id = u_asig.id
            JOIN public.estados     est     ON t.estado_id   = est.id
            JOIN public.prioridades prio    ON t.prioridad_id = prio.id
            WHERE t.id = $1 AND t.eliminado = false`,
            [id]
        );
        return rows[0] || null;
    },

    async findAll({ grupo_id, estado_id, prioridad_id, asignado_id } = {}) {
        const conditions = ['t.eliminado = false'];
        const values = [];

        if (grupo_id) {
            values.push(grupo_id);
            conditions.push(`t.grupo_id = $${values.length}`);
        }
        if (estado_id) {
            values.push(estado_id);
            conditions.push(`t.estado_id = $${values.length}`);
        }
        if (prioridad_id) {
            values.push(prioridad_id);
            conditions.push(`t.prioridad_id = $${values.length}`);
        }
        if (asignado_id) {
            values.push(asignado_id);
            conditions.push(`t.asignado_id = $${values.length}`);
        }

        const where = conditions.join(' AND ');

        const { rows } = await pool.query(
            `SELECT 
                t.id,
                t.titulo,
                t.creado_fecha,
                t.fecha_cierre,
                g.nombre          AS nombre_grupo,
                u_asig.nombre_com AS asignado_a_nombre,
                est.nombre        AS estado_actual,
                prio.nombre       AS nivel_prioridad
            FROM public.tickets t
            JOIN public.grupos      g       ON t.grupo_id     = g.id
            LEFT JOIN public.usuarios u_asig ON t.asignado_id  = u_asig.id
            JOIN public.estados     est     ON t.estado_id    = est.id
            JOIN public.prioridades prio    ON t.prioridad_id = prio.id
            WHERE ${where}
            ORDER BY t.creado_fecha DESC`,
            values
        );
        return rows;
    },

    async findByGrupo(grupo_id) {
        return this.findAll({ grupo_id });
    },

    async findByEstado(estado_id) {
        return this.findAll({ estado_id });
    },

    // Tickets sin asignar (asignado_id es NULL en BD)
    async findSinAsignar(grupo_id = null) {
        const conditions = ['t.asignado_id IS NULL', 't.eliminado = false'];
        const values = [];

        if (grupo_id) {
            values.push(grupo_id);
            conditions.push(`t.grupo_id = $${values.length}`);
        }

        const { rows } = await pool.query(
            `SELECT 
                t.id,
                t.titulo,
                t.creado_fecha,
                g.nombre    AS nombre_grupo,
                est.nombre  AS estado_actual,
                prio.nombre AS nivel_prioridad
            FROM public.tickets t
            JOIN public.grupos      g    ON t.grupo_id     = g.id
            JOIN public.estados     est  ON t.estado_id    = est.id
            JOIN public.prioridades prio ON t.prioridad_id = prio.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY t.creado_fecha DESC`,
            values
        );
        return rows;
    },

    // ─── CREATE ──────────────────────────────────────────────────────────────

    async create({ titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id = null }) {
        const { rows } = await pool.query(
            `INSERT INTO public.tickets
                (titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id, creado_fecha, fecha_cierre, eliminado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NULL, false)
             RETURNING id, titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id, creado_fecha`,
            [titulo, descripcion, grupo_id, creador_id, estado_id, prioridad_id, asignado_id]
        );
        return rows[0];
    },

    // ─── UPDATE ──────────────────────────────────────────────────────────────

    async update(id, campos) {
        // Campos permitidos para evitar inyección desde el body
        const PERMITIDOS = ['titulo', 'descripcion', 'grupo_id', 'prioridad_id', 'asignado_id'];
        const camposFiltrados = Object.fromEntries(
            Object.entries(campos).filter(([k]) => PERMITIDOS.includes(k))
        );

        if (Object.keys(camposFiltrados).length === 0) return null;

        const keys   = Object.keys(camposFiltrados);
        const values = Object.values(camposFiltrados);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

        const { rows } = await pool.query(
            `UPDATE public.tickets
             SET ${setClause}
             WHERE id = $${keys.length + 1} AND eliminado = false
             RETURNING id, titulo, descripcion, estado_id, prioridad_id, asignado_id`,
            [...values, id]
        );
        return rows[0] || null;
    },

    async cambiarEstado(id, estado_id) {
        const esCerrado = estado_id === ESTADO_CERRADO_ID;

        const { rows } = await pool.query(
            `UPDATE public.tickets
             SET estado_id   = $1,
                 fecha_cierre = ${esCerrado ? 'NOW()' : 'NULL'}
             WHERE id = $2 AND
             RETURNING id, titulo, estado_id, fecha_cierre`,
            [estado_id, id]
        );
        return rows[0] || null;
    },

    /*
    async softDelete(id) {
        const { rows } = await pool.query(
            `UPDATE public.tickets
             SET eliminado = true
             WHERE id = $1 AND eliminado = false
             RETURNING id`,
            [id]
        );
        return rows[0] || null; // null = no encontrado o ya eliminado
    },*/
};

module.exports = TicketModel;