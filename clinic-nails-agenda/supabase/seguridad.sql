-- ===========================================================================
-- CIERRA LA BASE DE DATOS AL PÚBLICO
-- ===========================================================================
-- Ejecútalo UNA VEZ, cuando la nueva versión ya esté subida al hosting y funcionando
-- (con la variable SUPABASE_SERVICE_ROLE_KEY configurada). A partir de aquí, la clave
-- pública que viaja en la web ya NO puede leer ni escribir nada: todo pasa por el
-- servidor de la app, que comprueba quién eres y qué puedes hacer.
--
-- Es seguro volver a ejecutarlo. Para comprobar que ha funcionado, mira
-- Configuración → Seguridad dentro de la app.
-- ===========================================================================

do $$
declare
  t text;
  p record;
begin
  foreach t in array array['empleadas','cabinas','servicios','clientes','metodos_pago','productos','citas','fichajes','fichajes_activos','ajustes','ajustes_privados','bloqueos','bonos','ventas','bonos_vendidos','bono_usos','actividad','categorias_servicios','lecciones','resultados_cursos','avisos','avisos_vistos','marketing_contactos','clientes_acceso','clientes_codigos']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Fotos de empleadas: se siguen viendo (el cubo es público) pero nadie sube ni cambia
-- archivos con la clave pública; las subidas las hace el servidor.
drop policy if exists "avatars escritura publica" on storage.objects;
drop policy if exists "avatars actualizacion publica" on storage.objects;

notify pgrst, 'reload schema';
