-- ---------------------------------------------------------------------------
-- Clinic Nails & Beauty — esquema completo de la agenda interna
-- Pega este archivo entero en Supabase → SQL Editor → Run.
--
-- Este script es idempotente: puedes volver a pegarlo entero cuando quieras
-- (por ejemplo, cada vez que Claude te lo actualice) sin perder datos. Crea
-- lo que falte y añade las columnas nuevas a lo que ya exista.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------------

create table if not exists empleadas (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists cabinas (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists servicios (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists metodos_pago (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists productos (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists citas (
  id text primary key,
  created_at timestamptz default now()
);

create table if not exists fichajes (
  id text primary key,
  created_at timestamptz default now()
);

-- Fichaje en curso: una fila por empleada mientras está "dentro".
-- Se borra al fichar la salida.
create table if not exists fichajes_activos (
  empleada_id text primary key references empleadas(id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- 2. Columnas — con "add column if not exists" para que sea seguro volver a
--    ejecutar este script sobre una base de datos que ya tenía algunas de
--    estas tablas de una versión anterior.
-- ---------------------------------------------------------------------------

-- Empleadas ------------------------------------------------------------------
alter table empleadas add column if not exists nombre text not null default '';
alter table empleadas add column if not exists telefono text;
alter table empleadas add column if not exists activa boolean not null default true;
alter table empleadas add column if not exists color text default '#B4863C';
alter table empleadas add column if not exists horario jsonb default '{}'::jsonb;
alter table empleadas add column if not exists dias_libres jsonb default '[]'::jsonb;
alter table empleadas add column if not exists servicios jsonb default '[]'::jsonb;
alter table empleadas add column if not exists codigo text;
alter table empleadas add column if not exists rol text not null default 'empleada';
alter table empleadas add column if not exists permisos jsonb default '{"agenda":true,"fichajes":true,"empleadas":false,"servicios":false,"cabinas":false,"clientes":false,"productos":false,"ventas":false}'::jsonb;
alter table empleadas add column if not exists foto_url text;
alter table empleadas add column if not exists horario_tipo text not null default 'fijo';
alter table empleadas add column if not exists turnos jsonb default '[]'::jsonb;
alter table empleadas add column if not exists turno_inicio date;
alter table empleadas add column if not exists ausencias jsonb default '[]'::jsonb;

-- Cabinas ----------------------------------------------------------------
alter table cabinas add column if not exists nombre text not null default '';
alter table cabinas add column if not exists activa boolean not null default true;

-- Servicios ----------------------------------------------------------------
alter table servicios add column if not exists nombre text not null default '';
alter table servicios add column if not exists precio numeric not null default 0;
alter table servicios add column if not exists duracion int not null default 30;
alter table servicios add column if not exists categoria text;
alter table servicios add column if not exists empleadas jsonb default '[]'::jsonb;
alter table servicios add column if not exists cabina text default 'cualquiera';
alter table servicios add column if not exists activo boolean not null default true;
alter table servicios add column if not exists color text not null default '#B4863C';

-- Clientes ----------------------------------------------------------------
alter table clientes add column if not exists nombre text not null default '';
alter table clientes add column if not exists telefono text not null default '';
alter table clientes add column if not exists email text;
alter table clientes add column if not exists favorito boolean not null default false;

-- Métodos de pago ------------------------------------------------------------
alter table metodos_pago add column if not exists nombre text not null default '';
alter table metodos_pago add column if not exists activo boolean not null default true;

-- Productos ----------------------------------------------------------------
alter table productos add column if not exists nombre text not null default '';
alter table productos add column if not exists precio numeric not null default 0;
alter table productos add column if not exists stock int not null default 0;
alter table productos add column if not exists activo boolean not null default true;

-- Citas ----------------------------------------------------------------
alter table citas add column if not exists fecha date not null default current_date;
alter table citas add column if not exists empleada_id text references empleadas(id) on delete set null;
alter table citas add column if not exists servicio_id text references servicios(id) on delete set null;
alter table citas add column if not exists cabina_id text references cabinas(id) on delete set null;
alter table citas add column if not exists cliente_id text references clientes(id) on delete set null;
alter table citas add column if not exists clienta text not null default '';
alter table citas add column if not exists inicio int not null default 0;
alter table citas add column if not exists duracion int not null default 30;
alter table citas add column if not exists creado_por text references empleadas(id) on delete set null;
alter table citas add column if not exists modificado_por text references empleadas(id) on delete set null;
alter table citas add column if not exists precio_manual numeric;
alter table citas add column if not exists servicios_extra jsonb default '[]'::jsonb;
alter table citas add column if not exists pagos jsonb default '[]'::jsonb;
alter table citas add column if not exists productos jsonb default '[]'::jsonb;
alter table citas add column if not exists estado_cobro text not null default 'pendiente';
alter table citas add column if not exists cobrada_en timestamptz;
alter table citas add column if not exists cobrada_por text references empleadas(id) on delete set null;
alter table citas add column if not exists updated_at timestamptz default now();

-- Fichajes ----------------------------------------------------------------
alter table fichajes add column if not exists empleada_id text references empleadas(id) on delete cascade;
alter table fichajes add column if not exists fecha date not null default current_date;
alter table fichajes add column if not exists entrada int not null default 0;
alter table fichajes add column if not exists salida int not null default 0;

alter table fichajes_activos add column if not exists hora_entrada int not null default 0;

-- ---------------------------------------------------------------------------
-- 3. Seguridad: RLS abierta con la clave "anon"
-- ---------------------------------------------------------------------------
-- El control de acceso (quién ve qué pantalla, y el código para fichar o
-- tocar la agenda) lo hace la interfaz, no la base de datos. Razonable para
-- un equipo pequeño y de confianza; si más adelante quieres que la propia
-- base de datos exija sesión, sustituye esto por políticas con auth.uid().

alter table empleadas enable row level security;
alter table cabinas enable row level security;
alter table servicios enable row level security;
alter table clientes enable row level security;
alter table metodos_pago enable row level security;
alter table productos enable row level security;
alter table citas enable row level security;
alter table fichajes enable row level security;
alter table fichajes_activos enable row level security;



-- Bucket de almacenamiento para las fotos de empleadas (público para poder
-- mostrarlas directamente en la interfaz).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars lectura publica" on storage.objects;

create policy "avatars lectura publica" on storage.objects for select using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- 4. Datos de ejemplo (opcional — puedes borrar este bloque si prefieres
--    empezar en blanco y crear todo desde la interfaz). "on conflict do
--    nothing" hace que nunca sobrescriba datos que ya hayas cambiado.
-- ---------------------------------------------------------------------------
--
-- ⚠️ IMPORTANTE — CÓDIGOS DE EJEMPLO: cámbialos en cuanto entres a la app
-- (Empleadas → editar → Código). Aquí solo son un punto de partida:
--   Eduardo (admin) → 0000
--   Génesis         → 1111
--   Silvia          → 2222

insert into empleadas (id, nombre, telefono, activa, color, horario, dias_libres, servicios, codigo, rol, permisos) values
  ('eduardo', 'Eduardo', '', true, '#292521',
   '{}', '[]', '[]', '0000', 'admin',
   '{"agenda":true,"fichajes":true,"empleadas":true,"servicios":true,"cabinas":true,"clientes":true,"productos":true,"ventas":true}'),
  ('genesis', 'Génesis', '624 09 82 55', true, '#B4863C',
   '{"lun":{"activo":true,"inicio":"10:00","fin":"21:00"},"mar":{"activo":true,"inicio":"10:00","fin":"21:00"},"mie":{"activo":true,"inicio":"10:00","fin":"21:00"},"jue":{"activo":true,"inicio":"10:00","fin":"21:00"},"vie":{"activo":true,"inicio":"10:00","fin":"21:00"},"sab":{"activo":true,"inicio":"10:00","fin":"15:00"},"dom":{"activo":false,"inicio":"","fin":""}}',
   '["dom"]', '["skin","dermapen","manicura","pedicura"]', '1111', 'empleada',
   '{"agenda":true,"fichajes":true,"empleadas":false,"servicios":false,"cabinas":false,"clientes":false,"productos":false,"ventas":false}'),
  ('silvia', 'Silvia', '624 09 82 55', true, '#7C5A2E',
   '{"lun":{"activo":true,"inicio":"10:00","fin":"21:00"},"mar":{"activo":true,"inicio":"10:00","fin":"21:00"},"mie":{"activo":true,"inicio":"10:00","fin":"21:00"},"jue":{"activo":true,"inicio":"10:00","fin":"21:00"},"vie":{"activo":true,"inicio":"10:00","fin":"21:00"},"sab":{"activo":true,"inicio":"10:00","fin":"15:00"},"dom":{"activo":false,"inicio":"","fin":""}}',
   '["dom"]', '["skin","eternal","slim"]', '2222', 'empleada',
   '{"agenda":true,"fichajes":true,"empleadas":false,"servicios":false,"cabinas":false,"clientes":false,"productos":false,"ventas":false}')
on conflict (id) do nothing;

-- Por si ya tenías estas filas de antes de que existieran los permisos de
-- Productos y Ventas, esto se los concede al admin sin tocar nada más.
update empleadas set permisos = permisos || '{"productos":true,"ventas":true}'::jsonb where rol = 'admin';

insert into cabinas (id, nombre, activa) values
  ('cabina1', 'Cabina 1', true),
  ('cabina2', 'Cabina 2', true)
on conflict (id) do nothing;

insert into servicios (id, nombre, precio, duracion, categoria, empleadas, cabina, activo, color) values
  ('skin', 'Skin Revival', 49, 45, 'Facial', '["genesis","silvia"]', 'cualquiera', true, '#B4863C'),
  ('eternal', 'Eternal Radiance', 60, 60, 'Facial', '["silvia"]', 'cualquiera', true, '#B98285'),
  ('slim', 'Slim Contour', 70, 70, 'Corporal', '["silvia"]', 'cabina1', true, '#7C8B6F'),
  ('dermapen', 'Dermapen', 80, 60, 'Facial', '["genesis"]', 'cabina1', true, '#A85C42'),
  ('manicura', 'Manicura', 25, 45, 'Uñas', '["genesis"]', 'cualquiera', true, '#8C7B6B'),
  ('pedicura', 'Pedicura', 30, 45, 'Uñas', '["genesis"]', 'cualquiera', true, '#5B6B73')
on conflict (id) do nothing;

insert into metodos_pago (id, nombre, activo) values
  ('efectivo', 'Efectivo', true),
  ('tarjeta', 'Tarjeta', true),
  ('bizum', 'Bizum', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Tiempo real (opcional pero recomendado)
-- ---------------------------------------------------------------------------
-- Para que un cambio hecho en un dispositivo aparezca en los demás sin
-- recargar la página: Supabase → Database → Replication →
-- supabase_realtime → activa las 8 tablas: empleadas, cabinas, servicios,
-- clientes, metodos_pago, productos, citas, fichajes, fichajes_activos.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Excepciones de horario por día concreto (override puntual, sin tocar el
-- horario fijo/rotativo recurrente) — usado desde la vista Turnos.
-- ---------------------------------------------------------------------------
alter table empleadas add column if not exists excepciones jsonb default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Integración con GoHighLevel: guardamos el id del contacto/evento creado en
-- GHL para poder actualizarlo la próxima vez en lugar de duplicarlo.
-- ---------------------------------------------------------------------------
alter table clientes add column if not exists ghl_contact_id text;
alter table citas add column if not exists ghl_event_id text;

-- ---------------------------------------------------------------------------
-- Calendario de GoHighLevel propio de cada empleada (para que Génesis y
-- Silvia puedan tener citas a la misma hora sin chocar en GHL).
-- ---------------------------------------------------------------------------
alter table empleadas add column if not exists ghl_calendar_id text;

-- ---------------------------------------------------------------------------
-- Calendario de GHL en el que quedó cada cita (para poder moverla si cambia
-- la empleada o si se corrige el calendario de una empleada).
-- ---------------------------------------------------------------------------
alter table citas add column if not exists ghl_calendar_id text;

-- ---------------------------------------------------------------------------
-- Notas internas, asistencia y origen de las citas · nota fija del cliente
-- ---------------------------------------------------------------------------
alter table citas add column if not exists notas text;
alter table citas add column if not exists asistencia text not null default 'prevista'; -- prevista | no_asistio | cancelada
alter table citas add column if not exists origen text;                                  -- 'ghl' si vino de GoHighLevel
alter table clientes add column if not exists nota_fija text;

-- ---------------------------------------------------------------------------
-- Ajustes de la app (colores, etiquetas de marketing, datos de GHL...).
-- Aquí NO van secretos: esta tabla se puede leer con la clave pública.
-- ---------------------------------------------------------------------------
create table if not exists ajustes (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table ajustes enable row level security;

-- ---------------------------------------------------------------------------
-- Secretos (clave de GHL). Con la seguridad activada y SIN ninguna política, la
-- clave pública no puede ni leerla ni escribirla: solo el servidor de la app
-- (con la clave "service_role") puede usarla.
-- ---------------------------------------------------------------------------
create table if not exists ajustes_privados (
  clave text primary key,
  valor text,
  updated_at timestamptz default now()
);
alter table ajustes_privados enable row level security;
revoke all on ajustes_privados from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad: el código de acceso ya no se guarda en claro. El servidor guarda aquí
-- una huella cifrada (HMAC con una clave que solo conoce el servidor).
-- ---------------------------------------------------------------------------
alter table empleadas add column if not exists codigo_hash text;
create unique index if not exists empleadas_codigo_hash_unico on empleadas (codigo_hash) where codigo_hash is not null;

-- ---------------------------------------------------------------------------
-- Horarios no disponibles (bloqueos) de cada empleada
-- ---------------------------------------------------------------------------
create table if not exists bloqueos (
  id text primary key,
  created_at timestamptz default now()
);
alter table bloqueos add column if not exists fecha date not null default current_date;
alter table bloqueos add column if not exists empleada_id text references empleadas(id) on delete cascade;
alter table bloqueos add column if not exists inicio int not null default 0;
alter table bloqueos add column if not exists duracion int not null default 60;
alter table bloqueos add column if not exists motivo text;
alter table bloqueos add column if not exists creado_por text references empleadas(id) on delete set null;
alter table bloqueos add column if not exists ghl_event_id text;
alter table bloqueos add column if not exists ghl_calendar_id text;
alter table bloqueos enable row level security;

-- ---------------------------------------------------------------------------
-- Bonos (catálogo), bonos vendidos, sus usos y ventas sin cita
-- ---------------------------------------------------------------------------
create table if not exists bonos (id text primary key, created_at timestamptz default now());
alter table bonos add column if not exists nombre text not null default '';
alter table bonos add column if not exists servicio_id text references servicios(id) on delete set null;
alter table bonos add column if not exists sesiones int not null default 1;
alter table bonos add column if not exists precio numeric not null default 0;
alter table bonos add column if not exists caducidad_dias int;
alter table bonos add column if not exists activo boolean not null default true;
alter table bonos add column if not exists servicio_ids jsonb not null default '[]'::jsonb; -- varios servicios por bono
alter table bonos enable row level security;

create table if not exists ventas (id text primary key, created_at timestamptz default now());
alter table ventas add column if not exists fecha date not null default current_date;
alter table ventas add column if not exists cliente_id text references clientes(id) on delete set null;
alter table ventas add column if not exists cliente_nombre text;
alter table ventas add column if not exists productos jsonb not null default '[]'::jsonb;
alter table ventas add column if not exists bonos jsonb not null default '[]'::jsonb;
alter table ventas add column if not exists pagos jsonb not null default '[]'::jsonb;
alter table ventas add column if not exists total numeric not null default 0;
alter table ventas add column if not exists anulada boolean not null default false;
alter table ventas add column if not exists creado_por text references empleadas(id) on delete set null;
alter table ventas enable row level security;

create table if not exists bonos_vendidos (id text primary key, created_at timestamptz default now());
alter table bonos_vendidos add column if not exists venta_id text references ventas(id) on delete set null;
alter table bonos_vendidos add column if not exists plantilla_id text references bonos(id) on delete set null;
alter table bonos_vendidos add column if not exists cliente_id text references clientes(id) on delete set null;
alter table bonos_vendidos add column if not exists nombre text not null default '';
alter table bonos_vendidos add column if not exists servicio_id text references servicios(id) on delete set null;
alter table bonos_vendidos add column if not exists sesiones_total int not null default 1;
alter table bonos_vendidos add column if not exists precio numeric not null default 0;
alter table bonos_vendidos add column if not exists fecha_venta date not null default current_date;
alter table bonos_vendidos add column if not exists caduca date;
alter table bonos_vendidos add column if not exists estado text not null default 'activo';
alter table bonos_vendidos add column if not exists vendido_por text references empleadas(id) on delete set null;
alter table bonos_vendidos add column if not exists servicio_ids jsonb not null default '[]'::jsonb;
alter table bonos_vendidos enable row level security;

create table if not exists bono_usos (id text primary key, created_at timestamptz default now());
alter table bono_usos add column if not exists bono_vendido_id text references bonos_vendidos(id) on delete cascade;
alter table bono_usos add column if not exists cita_id text references citas(id) on delete cascade;
alter table bono_usos add column if not exists fecha date not null default current_date;
alter table bono_usos add column if not exists creado_por text references empleadas(id) on delete set null;
alter table bono_usos enable row level security;

-- Última versión de cada cita que GHL y la app tenían igual (para saber quién cambió qué cuando se mueve algo en GHL)
alter table citas add column if not exists ghl_snapshot jsonb;

-- Reserva online de las clientas (página pública /reservar)
alter table servicios add column if not exists reservable_online boolean not null default true;
alter table servicios add column if not exists recomendado_online boolean not null default false; -- sale en «Recomendados» de la reserva online (si ese modo es el manual)
create table if not exists clientes_acceso (id text primary key, cliente_id text not null, token_hash text not null, creado timestamptz default now(), ultimo_uso timestamptz default now());
create index if not exists clientes_acceso_hash on clientes_acceso (token_hash);
alter table clientes_acceso enable row level security;
create table if not exists clientes_codigos (id text primary key, cliente_id text not null, email text not null, codigo_hash text not null, expira timestamptz not null, intentos int not null default 0, usado boolean not null default false, creado timestamptz default now());
alter table clientes_codigos enable row level security;

-- Marketing: a qué clientas ya se ha escrito o llamado (para no repetir). Solo lo ve el administrador.
create table if not exists marketing_contactos (id text primary key, created_at timestamptz default now());
alter table marketing_contactos add column if not exists cliente_id text;
alter table marketing_contactos add column if not exists canal text not null default 'whatsapp';       -- whatsapp | llamada | manual
alter table marketing_contactos add column if not exists motivo text not null default 'reactivacion';  -- reactivacion | hueco
alter table marketing_contactos add column if not exists por text;
alter table marketing_contactos add column if not exists fecha date;
alter table marketing_contactos enable row level security;

-- Avisos para las empleadas (popup al entrar con su código): «recuerda fichar», etc.
create table if not exists avisos (id text primary key, created_at timestamptz default now());
alter table avisos add column if not exists titulo text not null default '';
alter table avisos add column if not exists mensaje text not null default '';
alter table avisos add column if not exists destinatarios jsonb not null default '[]'::jsonb;   -- ids de empleadas; vacío = todas
alter table avisos add column if not exists frecuencia text not null default 'diaria';         -- diaria | una_vez
alter table avisos add column if not exists solo_si_no_ficho boolean not null default false;
alter table avisos add column if not exists dias jsonb not null default '[]'::jsonb;           -- días de la semana (0 = domingo); vacío = todos
alter table avisos add column if not exists desde date;
alter table avisos add column if not exists hasta date;
alter table avisos add column if not exists activo boolean not null default true;
alter table avisos enable row level security;
create table if not exists avisos_vistos (id text primary key, created_at timestamptz default now());
alter table avisos_vistos add column if not exists aviso_id text;
alter table avisos_vistos add column if not exists empleada_id text;
alter table avisos_vistos add column if not exists fecha date;
alter table avisos_vistos enable row level security;

-- Confirmación de asistencia de cada cita (se llama o contesta por WhatsApp): pendiente | confirmada | no_contesta
alter table citas add column if not exists confirmacion text not null default 'pendiente';
alter table citas add column if not exists confirmacion_por text;
alter table citas add column if not exists confirmacion_en timestamptz;

-- Cursos de ventas para las empleadas: clases (con test opcional), resultados y objetivo semanal de ventas extra
create table if not exists lecciones (id text primary key, created_at timestamptz default now());
alter table lecciones add column if not exists titulo text not null default '';
alter table lecciones add column if not exists contenido text;
alter table lecciones add column if not exists tipo text not null default 'base';   -- base | refuerzo | avanzado
alter table lecciones add column if not exists orden int not null default 0;
alter table lecciones add column if not exists activa boolean not null default true;
alter table lecciones add column if not exists obligatorio_semanal boolean not null default false;
alter table lecciones add column if not exists minimo_aprobado int not null default 70;
alter table lecciones add column if not exists preguntas jsonb not null default '[]'::jsonb;
alter table lecciones enable row level security;
create table if not exists resultados_cursos (id text primary key, created_at timestamptz default now());
alter table resultados_cursos add column if not exists empleada_id text;
alter table resultados_cursos add column if not exists leccion_id text;
alter table resultados_cursos add column if not exists semana text;                 -- lunes de la semana (AAAA-MM-DD)
alter table resultados_cursos add column if not exists puntuacion int not null default 0;
alter table resultados_cursos add column if not exists aciertos int not null default 0;
alter table resultados_cursos add column if not exists total int not null default 0;
alter table resultados_cursos add column if not exists aprobado boolean not null default false;
alter table resultados_cursos enable row level security;
alter table empleadas add column if not exists objetivo_extra_semanal numeric not null default 0;
alter table empleadas add column if not exists objetivo_ticket_medio numeric not null default 0;
-- Horario semanal de disponibilidad de GHL que la app mantiene para cada empleada (lo escribe el servidor)
alter table empleadas add column if not exists ghl_schedule_id text;

-- Catálogo de servicios: posición de cada servicio y categorías propias (con su descripción y su orden)
alter table servicios add column if not exists orden int not null default 0;
create table if not exists categorias_servicios (id text primary key, created_at timestamptz default now());
alter table categorias_servicios add column if not exists nombre text not null default '';
alter table categorias_servicios add column if not exists descripcion text;
alter table categorias_servicios add column if not exists orden int not null default 0;
alter table categorias_servicios enable row level security;

-- Descripción de cada servicio (al importarlos; también es la descripción de su calendario en GHL)
alter table servicios add column if not exists descripcion text;

-- Calendario de GHL de cada servicio (lo crea y rellena el servidor al sincronizar)
alter table servicios add column if not exists ghl_calendar_id text;

-- Fichajes con SEGUNDOS exactos (si no se pegan, siguen funcionando con precisión de minutos)
alter table fichajes add column if not exists entrada_s int;
alter table fichajes add column if not exists salida_s int;
alter table fichajes_activos add column if not exists hora_entrada_s int;
alter table fichajes_activos add column if not exists descanso_desde_s int;

-- ---------------------------------------------------------------------------
-- Registro de actividad (auditoría): quién hizo qué y cuándo. Solo el servidor escribe;
-- solo el administrador lo ve. NO se puede modificar ni borrar (lo impide un disparador).
-- ---------------------------------------------------------------------------
create table if not exists actividad (id text primary key, created_at timestamptz default now());
alter table actividad add column if not exists usuario_id text;      -- sin clave foránea: el historial se conserva aunque se borre a la empleada
alter table actividad add column if not exists usuario_nombre text;
alter table actividad add column if not exists origen text not null default 'app';  -- 'app' o 'ghl' (reserva online / IA)
alter table actividad add column if not exists entidad text;
alter table actividad add column if not exists entidad_id text;
alter table actividad add column if not exists cliente_id text;
alter table actividad add column if not exists accion text;
alter table actividad add column if not exists resumen text;
alter table actividad add column if not exists detalle jsonb;
create index if not exists actividad_entidad_idx on actividad (entidad, entidad_id, created_at desc);
create index if not exists actividad_cliente_idx on actividad (cliente_id, created_at desc);
create index if not exists actividad_fecha_idx on actividad (created_at desc);
alter table actividad enable row level security;
create or replace function actividad_inmutable() returns trigger as $$
begin
  raise exception 'El registro de actividad no se puede modificar ni borrar';
end;
$$ language plpgsql;
drop trigger if exists actividad_no_modificar on actividad;
create trigger actividad_no_modificar before update or delete on actividad for each row execute function actividad_inmutable();
-- TRUNCATE (vaciar la tabla de golpe) no activa los disparadores de fila: se bloquea aparte
drop trigger if exists actividad_no_truncar on actividad;
create trigger actividad_no_truncar before truncate on actividad for each statement execute function actividad_inmutable();

-- Descanso dentro de un fichaje abierto
alter table fichajes_activos add column if not exists en_descanso boolean not null default false;
alter table fichajes_activos add column if not exists descanso_desde int;

-- ---------------------------------------------------------------------------
-- Refresca la caché de esquema de Supabase para que las columnas nuevas se
-- vean al momento (evita el error "Could not find the '...' column ... in the
-- schema cache" justo después de añadir una columna).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
