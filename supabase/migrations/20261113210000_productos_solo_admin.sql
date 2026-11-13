-- Solo el administrador puede editar, archivar (deleted_at) y restaurar
-- productos. La pantalla consultas/producto ya oculta esos botones.
drop policy if exists productos_update on public.productos;
drop policy if exists productos_update_admin on public.productos;

create policy productos_update_admin on public.productos
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());
