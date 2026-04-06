const pool = require('../config/database');

const PermisoModel = {

    // ── Todos los permisos del sistema ─────────────────────────────────────────
    async findAll() {
        const { rows } = await pool.query(
            'SELECT * FROM public.permisos ORDER BY id'
        );
        return rows;
    },

    // ── Permisos que tiene un usuario específico ───────────────────────────────
    async findByUsuario(usuarioId) {
        const { rows } = await pool.query(
            `SELECT p.id, p.nombre, p.descripcion
            FROM public.permisos p
            INNER JOIN public.permisos_generales up ON up.permiso_id = p.id
            WHERE up.usuario_id = $1
            ORDER BY p.nombre`,
            [usuarioId]
        );
        return rows;
    },

    // ── Asignar un permiso a un usuario ───────────────────────────────────────
    async asignar(usuarioId, permisoId) {
        const { rows } = await pool.query(
            `INSERT INTO public.permisos_generales (usuario_id, permiso_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *`,
            [usuarioId, permisoId]
        );
        return rows[0] || null;
    },

    // ── Revocar un permiso de un usuario ──────────────────────────────────────
    async revocar(usuarioId, permisoId) {
        const { rowCount } = await pool.query(
            `DELETE FROM public.permisos_generales
            WHERE usuario_id = $1 AND permiso_id = $2`,
            [usuarioId, permisoId]
        );
        return rowCount > 0;
    },

    // ── Reemplazar TODOS los permisos de un usuario ───────────────────────────
    async sincronizar(usuarioId, permisoIds = []) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                'DELETE FROM public.permisos_generales WHERE usuario_id = $1',
                [usuarioId]
            );
            for (const permisoId of permisoIds) {
                await client.query(
                    'INSERT INTO public.permisos_generales (usuario_id, permiso_id) VALUES ($1, $2)',
                    [usuarioId, permisoId]
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // ── Verificar si un usuario tiene un permiso específico ───────────────────
    async tienePermiso(usuarioId, nombrePermiso) {
        const { rows } = await pool.query(
            `SELECT 1 FROM public.permisos_generales up
            INNER JOIN public.permisos p ON p.id = up.permiso_id
            WHERE up.usuario_id = $1 AND p.nombre = $2
            LIMIT 1`,
            [usuarioId, nombrePermiso]
        );
        return rows.length > 0;
    },
};

module.exports = PermisoModel;