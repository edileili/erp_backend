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
                (SELECT COUNT(*) FROM public.grupo_miembros WHERE grupo_id = g.id) AS total_miembros,
                (SELECT COUNT(*) FROM public.tickets WHERE grupo_id = g.id) AS total_tickets
            FROM public.grupos g
            LEFT JOIN public.usuarios u ON g.creador_id = u.id
            WHERE g.activo = true
            ORDER BY g.creado_fecha DESC`
        );
        return rows;
    },

    async getMiembros(grupo_id) {
        const { rows } = await db.query(
            `SELECT 
                u.id,
                u.nombre_com,
                u.email,
                COUNT(CASE WHEN t.asignado_id = u.id THEN 1 END) AS tickets_asignados,
                COUNT(CASE WHEN t.creador_id = u.id THEN 1 END) AS tickets_creados
            FROM public.usuarios u
            
            JOIN public.grupo_miembros gm ON u.id = gm.usuario_id
            LEFT JOIN public.tickets t ON (u.id = t.asignado_id OR u.id = t.creador_id) 
            AND t.grupo_id = gm.grupo_id
            WHERE gm.grupo_id = $1
            GROUP BY u.id, u.nombre_com, u.email
            ORDER BY tickets_asignados DESC;`,
            [grupo_id]
        );
        return rows;
    },

    async getPermisosUsuario(grupo_id, usuario_id) {
        const { rows } = await db.query(
            `SELECT 
                p.id as permiso_id,
                p.nombre as clave,
                p.descripcion
            FROM public.grupo_usuario_permisos gup
            JOIN public.permisos p ON gup.permiso_id = p.id
            WHERE gup.grupo_id = $1 AND gup.usuario_id = $2
            ORDER BY p.id ASC;`,
            [grupo_id, usuario_id]
        );
        return rows;
    },

    async addMiembro(grupo_id, email) {
        const query = `
        INSERT INTO public.grupo_miembros (grupo_id, usuario_id, fecha_ingreso)
        SELECT $1::integer, id, NOW()
        FROM public.usuarios 
        WHERE email = $2
        RETURNING *;
        `;
        
        const { rows } = await db.query(query, [grupo_id, email]);

        if (rows.length === 0) {
            throw new Error('El usuario con ese correo no existe.');
        }

        return rows[0];
    },

    async removeMember(grupo_id, usuario_id) {
        await db.query(
            `DELETE FROM public.grupo_usuario_permisos WHERE grupo_id = $1 AND usuario_id = $2`,
            [grupo_id, usuario_id]
        );

        const { rows } = await db.query(
            `DELETE FROM public.grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2 RETURNING id`,
            [grupo_id, usuario_id]
        );
        
        return rows[0] || null;
    },

    async assignPermission(grupo_id, usuario_id, permiso_id) {
        const { rows: miembro } = await db.query(
            `SELECT id FROM public.grupo_miembros 
            WHERE grupo_id = $1 AND usuario_id = $2`,
            [grupo_id, usuario_id]
        );

        if (miembro.length === 0) {
            throw new Error('El usuario debe ser miembro del grupo para recibir permisos.');
        }

        const { rows } = await db.query(
            `INSERT INTO public.grupo_usuario_permisos (grupo_id, usuario_id, permiso_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING -- Evita errores si el permiso ya existía
            RETURNING id`,
            [grupo_id, usuario_id, permiso_id]
        );

        return rows[0] || { message: "El permiso ya estaba asignado." };
    },

    async softDelete(id) {
        const { rows } = await db.query(
            `UPDATE public.grupos 
            SET activo = false 
            WHERE id = $1 AND activo = true
            RETURNING id, nombre`,
            [id]
        );
        
        if (rows.length === 0) {
            throw new Error('El grupo no existe o ya ha sido dado de baja.');
        }
        
        return rows[0];
    }
};

module.exports = GrupoModel;