import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, nombre_completo, rol, sucursal_id } = await req.json()

    if (!email || !password || !nombre_completo || !rol) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400, headers: corsHeaders })
    }

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo, rol, sucursal_id },
    })

    if (createError) {
      if (createError.message?.toLowerCase().includes('already been registered') || createError.message?.toLowerCase().includes('already registered')) {
        const { data: users } = await supabase.auth.admin.listUsers()
        const existing = users?.users?.find(u => u.email === email)
        if (!existing) {
          return new Response(JSON.stringify({ error: `El correo "${email}" ya está registrado en Authentication pero no se pudo recuperar el usuario.` }), { status: 400, headers: corsHeaders })
        }
        await supabase.from('perfiles').upsert({
          id: existing.id,
          nombre_completo,
          rol,
          sucursal_id: sucursal_id || null,
        }, { onConflict: 'id' })
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
      }
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders })
    }

    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'No se pudo crear el usuario' }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: corsHeaders })
  }
})
