import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const ROL_ADMIN = 'administrador'

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return json({ error: 'No autorizado' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar que el llamador sea un usuario válido y administrador
    const { data: callerData, error: callerError } = await supabase.auth.getUser(token)
    if (callerError || !callerData?.user) {
      return json({ error: 'No autorizado' }, 401)
    }

    const { data: callerPerfil } = await supabase
      .from('perfiles')
      .select('rol, deleted_at')
      .eq('id', callerData.user.id)
      .maybeSingle()

    if (!callerPerfil || callerPerfil.deleted_at || callerPerfil.rol !== ROL_ADMIN) {
      return json({ error: 'Solo un administrador puede crear usuarios' }, 403)
    }

    const { email, password, nombre_completo, rol, sucursal_id } = await req.json()

    if (!email || !password || !nombre_completo || !rol) {
      return json({ error: 'Faltan campos requeridos' }, 400)
    }

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo, rol, sucursal_id },
    })

    if (createError) {
      const msg = createError.message?.toLowerCase() ?? ''
      if (msg.includes('already been registered') || msg.includes('already registered')) {
        // No se modifica el perfil de cuentas existentes desde aquí
        return json({ error: `El correo "${email}" ya está registrado.` }, 409)
      }
      return json({ error: createError.message }, 400)
    }

    if (!userData.user) {
      return json({ error: 'No se pudo crear el usuario' }, 500)
    }

    return json({ success: true }, 200)
  } catch (_err) {
    return json({ error: 'Error interno del servidor' }, 500)
  }
})
