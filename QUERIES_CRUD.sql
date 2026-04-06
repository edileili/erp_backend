
-- USUARIOS

-- CREATE
INSERT INTO public.usuarios (usuario, email, contrasenia, nombre_com, direccion, fecha_nacimiento, telefono)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id;

-- READ 
SELECT id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono, created_at
FROM public.usuarios
WHERE usuario = $1;

-- READ
SELECT id, usuario, email, nombre_com, direccion, fecha_nacimiento, telefono, created_at
FROM public.usuarios
WHERE id = $1;

-- UPDATE 
UPDATE public.usuarios SET usuario         = $2 WHERE id = $1;
UPDATE public.usuarios SET email           = $2 WHERE id = $1;
UPDATE public.usuarios SET contrasenia     = $2 WHERE id = $1;
UPDATE public.usuarios SET nombre_com      = $2 WHERE id = $1;
UPDATE public.usuarios SET direccion       = $2 WHERE id = $1;
UPDATE public.usuarios SET fecha_nacimiento= $2 WHERE id = $1;
UPDATE public.usuarios SET telefono        = $2 WHERE id = $1;

-- DELETE
DELETE FROM public.usuarios WHERE id = $1;
DELETE FROM public.permisos_generales WHERE usuario_id = $1;


-- PERMISOS
-- CREATE
INSERT INTO public.permisos_generales (usuario_id, permiso_id)
SELECT $1, id
FROM public.permisos
WHERE nombre IN (
    'group_view',
    'ticket_view',
    'ticket_edit_state',
    'ticket_add',
    'user_view',
    'user_edit'
);

-- READ
SELECT p.id, p.nombre, p.descripcion
FROM public.permisos p
INNER JOIN public.permisos_generales pg ON pg.permiso_id = p.id
WHERE pg.usuario_id = $1
ORDER BY p.nombre;

-- READ 
SELECT 1
FROM public.permisos_generales pg
INNER JOIN public.permisos p ON p.id = pg.permiso_id
WHERE pg.usuario_id = $1
  AND p.nombre = $2
LIMIT 1;

-- DELETE – quitar un permiso 
DELETE FROM public.permisos_generales
WHERE usuario_id = $1 AND permiso_id = $2;

-- DELETE – quitar todos los permisos 
DELETE FROM public.permisos_generales
WHERE usuario_id = $1;


-- Grupos
-- CREATE
INSERT INTO public.grupos (nombre, descripcion, creador_id, creado_fecha)
VALUES ($1, $2, $3, NOW())
RETURNING id;

-- READ 
SELECT g.id, g.nombre, g.descripcion, g.creado_fecha,
       u.nombre_com AS creado_por
FROM public.grupos g
JOIN public.usuarios u ON g.creador_id = u.id
ORDER BY g.creado_fecha DESC;

-- READ 
SELECT
    g.id,
    g.nombre,
    g.descripcion,
    g.creado_fecha,
    u.nombre_com AS nombre_creador,
    u.email      AS email_creador,
    (SELECT COUNT(*) FROM public.tickets WHERE grupo_id = g.id) AS total_tickets
FROM public.grupos g
LEFT JOIN public.usuarios u ON g.creador_id = u.id
WHERE g.id = $1;

-- UPDATE 
UPDATE public.grupos SET nombre     = $2 WHERE id = $1;
UPDATE public.grupos SET descripcion = $2 WHERE id = $1;
UPDATE public.grupos SET creador_id = $2 WHERE id = $1;

-- DELETE
DELETE FROM public.grupos WHERE id = $1;



-- Tickets
-- CREATE
INSERT INTO public.tickets (grupo_id, titulo, descripcion, asignado_id, creador_id, estado_id, prioridad_id, creado_fecha, fecha_cierre)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
RETURNING id;

-- READ 
SELECT
    t.id,
    t.titulo,
    t.descripcion,
    t.creado_fecha,
    t.fecha_cierre,
    g.nombre              AS nombre_grupo,
    u_crea.nombre_com     AS creado_por,
    u_asig.nombre_com     AS asignado_a,
    u_asig.id             AS asignado_id,
    est.nombre            AS estado,
    prio.nombre           AS prioridad
FROM public.tickets t
JOIN public.grupos     g      ON t.grupo_id    = g.id
JOIN public.usuarios   u_crea ON t.creador_id  = u_crea.id
LEFT JOIN public.usuarios u_asig ON t.asignado_id = u_asig.id
JOIN public.estados    est   ON t.estado_id   = est.id
JOIN public.prioridades prio ON t.prioridad_id = prio.id
WHERE t.id = $1;

-- READ 
SELECT
    t.id,
    t.titulo,
    u_asig.nombre_com AS asignado_a,
    u_crea.nombre_com AS creado_por,
    g.nombre          AS grupo,
    t.creado_fecha
FROM public.tickets t
JOIN public.usuarios u_asig ON t.asignado_id = u_asig.id
JOIN public.usuarios u_crea ON t.creador_id  = u_crea.id
JOIN public.grupos   g      ON t.grupo_id    = g.id
ORDER BY t.creado_fecha DESC;

-- UPDATE 
UPDATE public.tickets
SET estado_id   = $2
WHERE id = $1;

-- UPDATE – cambiar fecha de cierre
UPDATE public.tickets
SET fecha_cierre = $2
WHERE id = $1;

-- DELETE
DELETE FROM public.tickets WHERE id = $1;

