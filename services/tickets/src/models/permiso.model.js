const db = require('../../../shared/db-client');
const pool = require('../../../../gateway/config/database');

const PERMISOS_GENERALES = [
    'user_activated',
    'user_desactivated',
    'user_edit_profile',
    'user_view',
    'users_view',
    'group_view',
    'group_add',
    'ticket_view',
    'user_edit',
    'user_add',
    'user_remove',
    'user_edit_permissions',
    'user_manage',
    'group_manage',
    'ticket_manage',
];

const PERMISOS_GRUPO = [
    'group_edit',
    'group_remove',
    'group_add_member',
    'group_remove_member',
    'group_edit_permissions',
    'ticket_view_all',
    'ticket_view_owner',
    'ticket_view_created',
    'ticket_add',
    'ticket_edit',
    'ticket_delete',
    'ticket_edit_state',
    'ticket_comment',
    'ticket_edit_comment',
    'ticket_assign',
];

const PermisoModel = {

    async findAll() {
        const { rows } = await db.query(
            'SELECT * FROM public.permisos ORDER BY id'
        );
        return rows;
    },

    async findDeGrupo() {
        const { rows } = await db.query(
            `SELECT * FROM public.permisos
            WHERE nombre = ANY($1)
            ORDER BY id`,
            [PERMISOS_GRUPO]
        );
        return rows;
    },

    async findByUsuario(usuarioId) {
        const { rows } = await db.query(
            `SELECT p.id, p.nombre, p.descripcion
            FROM public.permisos p
            INNER JOIN public.permisos_generales up ON up.permiso_id = p.id
            WHERE up.usuario_id = $1
            ORDER BY p.nombre`,
            [usuarioId]
        );
        return rows;
    },

    //Asignar un permiso a un usuario 
    async asignar(usuarioId, permisoId) {
        const { rows } = await db.query(
            `INSERT INTO public.permisos_generales (usuario_id, permiso_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *`,
            [usuarioId, permisoId]
        );
        return rows[0] || null;
    },

    //Revocar un permiso de un usuario
    async revocar(usuarioId, permisoId) {
        const { rowCount } = await db.query(
            `DELETE FROM public.permisos_generales
            WHERE usuario_id = $1 AND permiso_id = $2`,
            [usuarioId, permisoId]
        );
        return rowCount > 0;
    },

    async revocarTodoGrupos(usuarioId) {
        const { rowCount } = await db.query(
            `DELETE FROM public.grupo_usuario_permisos WHERE usuario_id = $1`,
            [usuarioId]
        );
        return rowCount;
    },

    async revocarTodo(usuarioId) {
        const { rowCount } = await db.query(
            `DELETE FROM public.permisos_generales WHERE usuario_id = $1`,
            [usuarioId]
        );
        return rowCount;
    },

    async desactivar(usuarioId) {
        const { rowCount } = await db.query(
            `INSERT INTO public.permisos_generales (usuario_id, permiso_id)
            VALUES ($1, 30);`,
            [usuarioId]
        );
        return rowCount > 0;
    },

    //Reemplazar TODOS los permisos de un usuario
    async sincronizar(usuarioId, permisoIds = []) {
        const client = await pool.connect(); 
        
        try {
            await client.query('BEGIN');
            
            await client.query(
                'DELETE FROM public.permisos_generales WHERE usuario_id = $1',
                [usuarioId]
            );

            if (permisoIds.length > 0) {
                for (const permisoId of permisoIds) {
                    await client.query(
                        'INSERT INTO public.permisos_generales (usuario_id, permiso_id) VALUES ($1, $2)',
                        [usuarioId, permisoId]
                    );
                }
            }
            
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            if (client) client.release(); 
        }
    },

    //Verificar si un usuario tiene un permiso específico
    async tienePermiso(usuarioId, nombrePermiso) {
        const { rows } = await db.query(
            `SELECT 1 FROM public.permisos_generales up
            INNER JOIN public.permisos p ON p.id = up.permiso_id
            WHERE up.usuario_id = $1 AND p.nombre = $2
            LIMIT 1`,
            [usuarioId, nombrePermiso]
        );
        return rows.length > 0;
    },

    async findByUsuarioEnGrupo(usuarioId, grupoId) {
        const { rows } = await db.query(
            `SELECT p.id, p.nombre, p.descripcion
            FROM public.permisos p
            INNER JOIN public.grupo_usuario_permisos gup ON gup.permiso_id = p.id
            WHERE gup.usuario_id = $1 AND gup.grupo_id = $2
            ORDER BY p.nombre`,
            [usuarioId, grupoId]
        );
        return rows;
    },

    async asignarEnGrupo(usuarioId, grupoId, permisoId) {
        const { rows } = await db.query(
            `INSERT INTO public.grupo_usuario_permisos (usuario_id, grupo_id, permiso_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *`,
            [usuarioId, grupoId, permisoId]
        );
        return rows[0] || null;
    },

    async revocarEnGrupo(usuarioId, grupoId, permisoId) {
        const { rowCount } = await db.query(
            `DELETE FROM public.grupo_usuario_permisos
            WHERE usuario_id = $1 AND grupo_id = $2 AND permiso_id = $3`,
            [usuarioId, grupoId, permisoId]
        );
        return rowCount > 0;
    },

    async sincronizarEnGrupo(usuarioId, grupoId, permisoIds = []) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `DELETE FROM public.grupo_usuario_permisos
                WHERE usuario_id = $1 AND grupo_id = $2`,
                [usuarioId, grupoId]
            );
            for (const permisoId of permisoIds) {
                await client.query(
                    `INSERT INTO public.grupo_usuario_permisos (usuario_id, grupo_id, permiso_id)
                    VALUES ($1, $2, $3)`,
                    [usuarioId, grupoId, permisoId]
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

    async tienePermisoEnGrupo(usuarioId, grupoId, nombrePermiso) {
        const lista = Array.isArray(nombrePermiso) ? nombrePermiso : [nombrePermiso];

        const { rows } = await db.query(
            `SELECT 1 FROM public.grupo_usuario_permisos gup
            INNER JOIN public.permisos p ON p.id = gup.permiso_id
            WHERE gup.usuario_id = $1
            AND gup.grupo_id = $2
            AND p.nombre = ANY($3)
            LIMIT 1`,
            [usuarioId, grupoId, lista]
        );
        console.log("rows:", rows);
        return rows.length > 0;
    },
};

module.exports = PermisoModel;