const db = require('../../../shared/db-client');

const UsuarioModel = {

  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM public.usuarios WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono, created_at
        FROM public.usuarios WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },


  async create({ usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono }) {
    const { rows } = await db.query(
      `INSERT INTO public.usuarios (usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono, created_at`,
      [usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono]
    );
    return rows[0];
  },

  async assignGeneralPermissions(usuario_id, permisosNombres = [
      'group_view',
      'ticket_view',
      'user_view',
      'user_edit_profile',
      'user_activated'
  ]) {
      const query = `
        INSERT INTO public.permisos_generales (usuario_id, permiso_id)
        SELECT 
          $1, 
          p.id
        FROM public.permisos p
        WHERE p.nombre = ANY($2)
        RETURNING permiso_id, 
        (SELECT nombre FROM public.permisos WHERE id = permiso_id) AS nombre;
      `;

      const { rows } = await db.query(query, [usuario_id, permisosNombres]);
      return rows;
  },

  async update(id, campos) {
    const keys   = Object.keys(campos);
    const values = Object.values(campos);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await db.query(
      `UPDATE public.usuarios SET ${setClause}
       WHERE id = $${keys.length + 1}
       RETURNING id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono`,
      [...values, id]
    );
    return rows[0] || null;
  },

  async existeDuplicado(email, usuario) {
    const { rows } = await db.query(
      'SELECT id FROM public.usuarios WHERE email = $1 OR usuario = $2 LIMIT 1',
      [email, usuario]
    );
    return rows.length > 0;
  },

  async isDesactivated(usuario_id) {
    const { rows } = await db.query(
      `SELECT 1 FROM public.permisos_generales up
            INNER JOIN public.permisos p ON p.id = up.permiso_id
            WHERE up.usuario_id = $1 AND p.nombre = 'user_desactivated'
            LIMIT 1`,
      [usuario_id]
    );
    return rows.length > 0;
  }
};

module.exports = UsuarioModel;