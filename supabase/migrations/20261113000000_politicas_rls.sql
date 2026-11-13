-- =====================================================================
-- Políticas RLS de Novacarne
--
-- Hace de esta migración la ÚNICA fuente de verdad de las políticas de
-- las tablas de la app: borra cualquier política existente en ellas y
-- crea las de abajo. Revisar antes de aplicar (supabase db push).
--
-- Roles de la app (perfiles.rol): administrador | cajero | tablajero
-- Las políticas reflejan lo que hace la app hoy:
--   * /registros (perfiles, sucursales, productos, proveedores,
--     preliminar_lote) -> solo administrador escribe.
--   * Entradas y consultas -> cualquier usuario autenticado lee; los
--     lotes de entrada los crea/edita cualquier usuario autenticado.
--   * Nadie borra filas (la app usa borrado lógico con deleted_at).
--   * El rol anon no tiene acceso a nada.
-- La service-role key (edge function crear-usuario, triggers SECURITY
-- DEFINER) ignora RLS y no se ve afectada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: ¿el usuario actual es administrador activo?
-- SECURITY DEFINER para poder leer perfiles sin recursión de RLS.
-- ---------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and rol = 'administrador'
      and deleted_at is null
  );
$$;

revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Habilitar RLS y limpiar políticas previas
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'perfiles', 'sucursales', 'productos', 'proveedores',
    'preliminar_lote', 'lotes_entrada'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- perfiles
-- Cada usuario lee su propio perfil; el admin lee y edita todos.
-- Un usuario NO puede cambiar su propio rol ni su sucursal.
-- El alta la hace la edge function crear-usuario (service role).
-- ---------------------------------------------------------------------
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy perfiles_update_admin on public.perfiles
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------
-- sucursales  (lectura: lotes-entrada, consultas/lotes)
-- ---------------------------------------------------------------------
create policy sucursales_select on public.sucursales
  for select to authenticated
  using (true);

create policy sucursales_insert_admin on public.sucursales
  for insert to authenticated
  with check (public.es_admin());

create policy sucursales_update_admin on public.sucursales
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------
-- proveedores
-- ---------------------------------------------------------------------
create policy proveedores_select on public.proveedores
  for select to authenticated
  using (true);

create policy proveedores_insert_admin on public.proveedores
  for insert to authenticated
  with check (public.es_admin());

create policy proveedores_update_admin on public.proveedores
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------
-- productos  (lectura: despiece, consultas/producto)
-- Solo el administrador crea, edita, archiva (deleted_at) y restaura.
-- La pantalla consultas/producto oculta esos botones a otros roles.
-- ---------------------------------------------------------------------
create policy productos_select on public.productos
  for select to authenticated
  using (true);

create policy productos_insert_admin on public.productos
  for insert to authenticated
  with check (public.es_admin());

create policy productos_update_admin on public.productos
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------
-- preliminar_lote  (alta en /registros; lectura en entradas y consultas)
-- ---------------------------------------------------------------------
create policy preliminar_lote_select on public.preliminar_lote
  for select to authenticated
  using (true);

create policy preliminar_lote_insert_admin on public.preliminar_lote
  for insert to authenticated
  with check (public.es_admin());

create policy preliminar_lote_update_admin on public.preliminar_lote
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------------------------------------------
-- lotes_entrada
-- Cualquier usuario autenticado registra lotes (entradas/lotes-entrada)
-- y corrige pesos de canales (consultas/lotes).
-- ---------------------------------------------------------------------
create policy lotes_entrada_select on public.lotes_entrada
  for select to authenticated
  using (true);

create policy lotes_entrada_insert on public.lotes_entrada
  for insert to authenticated
  with check (true);

create policy lotes_entrada_update on public.lotes_entrada
  for update to authenticated
  using (true)
  with check (true);
