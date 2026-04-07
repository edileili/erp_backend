const db = require('../../../shared/db-client');

const GrupoModel = {
    async findById(id) {
        const { rows } = await db.query(
            `SELECT 
                g.id, 
                g.nombre, 
                g.descripcion, 
                g.creado_fecha,
                u.nombre_com AS nombre_creador,
                u.email    AS email_creador,
                (SELECT COUNT(*) FROM public.tickets WHERE grupo_id = g.id) AS total_tickets
            FROM public.grupos g
            LEFT JOIN public.usuarios u ON g.creador_id = u.id
            WHERE g.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    async create({ nombre, descripcion, creador_id }) {
        const { rows } = await db.query(
            `INSERT INTO public.grupos (nombre, descripcion, creador_id, creado_fecha)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, nombre, descripcion, creador_id, creado_fecha`,
            [nombre, descripcion, creador_id]
        );
        return rows[0];
    },

    async update(id, campos) {
        const keys   = Object.keys(campos);
        const values = Object.values(campos);

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

        const { rows } = await db.query(
            `UPDATE public.grupos SET ${setClause}
             WHERE id = $${keys.length + 1}
             RETURNING id, nombre, descripcion, creador_id`,
            [...values, id]
        );
        return rows[0] || null;
    },

    async findAll() {
        const { rows } = await db.query(
            `SELECT 
                g.id,
                g.nombre,
                g.descripcion,
                g.creado_fecha,
                u.nombre_com AS nombre_creador,
                COUNT(t.id)  AS total_tickets
            FROM public.grupos g
            LEFT JOIN public.usuarios u ON g.creador_id = u.id
            LEFT JOIN public.tickets  t ON t.grupo_id   = g.id
            GROUP BY g.id, u.nombre_com
            ORDER BY g.creado_fecha DESC`
        );
        return rows;
    },

    async getMiembros(grupo_id) {
        const { rows } = await db.query(
            `SELECT DISTINCT
                u.id,
                u.nombre_com,
                u.email,
                COUNT(t.id) FILTER (WHERE t.asignado_id = u.id) AS tickets_asignados,
                COUNT(t.id) FILTER (WHERE t.creador_id  = u.id) AS tickets_creados
            FROM public.tickets t
            JOIN public.usuarios u ON u.id = t.asignado_id OR u.id = t.creador_id
            WHERE t.grupo_id   = $1
            GROUP BY u.id, u.nombre_com, u.email
            ORDER BY tickets_asignados DESC`,
            [grupo_id]
        );
        return rows;
    },

    /*
    async softDelete(id) {
        // Verifica que no tenga tickets activos antes de eliminar
        const { rows: activos } = await db.query(
            `SELECT COUNT(*) AS total
             FROM public.tickets
             WHERE grupo_id = $1 AND eliminado = false`,
            [id]
        );

        if (parseInt(activos[0].total) > 0) {
            throw new Error('No se puede eliminar un grupo con tickets activos');
        }

        const { rows } = await db.query(
            `UPDATE public.grupos
             SET eliminado = true
             WHERE id = $1 AND eliminado = false
             RETURNING id`,
            [id]
        );
        return rows[0] || null;
    },
    */
};

module.exports = GrupoModel;