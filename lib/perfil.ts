import { supabase } from './supabase';

interface Perfil {
  nombre_completo: string;
  rol: string;
  sucursal_id: string | null;
}

const cache = new Map<string, Perfil>();
const pending = new Map<string, Promise<Perfil | null>>();

export function invalidatePerfil() {
  cache.clear();
  pending.clear();
}

export async function getPerfil(): Promise<Perfil | null> {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return null;

  if (cache.has(user.id)) return cache.get(user.id)!;
  if (pending.has(user.id)) return pending.get(user.id)!;

  const promise = (async () => {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre_completo, rol, sucursal_id')
      .eq('id', user.id)
      .single();

    const result: Perfil | null = perfil
      ? {
          nombre_completo: perfil.nombre_completo || user.email?.split('@')[0] || '',
          rol: perfil.rol,
          sucursal_id: perfil.sucursal_id,
        }
      : null;

    if (result) cache.set(user.id, result);
    return result;
  })();

  pending.set(user.id, promise);
  promise.finally(() => pending.delete(user.id));
  return promise;
}
