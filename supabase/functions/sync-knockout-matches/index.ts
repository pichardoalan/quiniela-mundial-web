import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ADMIN_USER_ID = 'eb8798f7-d4d2-42f0-be6f-641fdf8dd13f'
const COMPETITION_ID = Deno.env.get('FOOTBALL_DATA_COMPETITION_ID') ?? '2000'
const PLACEHOLDER_CREST = 'https://via.placeholder.com/150'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const footballDataToken = Deno.env.get('FOOTBALL_DATA_TOKEN')

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !footballDataToken) {
    console.error('Missing required Edge Function secrets')
    return new Response(JSON.stringify({ error: 'Server configuration is incomplete' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser()

  if (userError || user?.id !== ADMIN_USER_ID) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await fetch(`https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches`, {
      headers: { 'X-Auth-Token': footballDataToken },
    })

    if (!response.ok) {
      throw new Error(`Football-Data respondió con ${response.status}`)
    }

    const payload = await response.json()
    const matches = Array.isArray(payload.matches) ? payload.matches : []
    const knockoutMatches = matches.filter((match) => match.stage && match.stage !== 'GROUP_STAGE')

    if (knockoutMatches.length === 0) {
      return Response.json({ count: 0 }, { headers: corsHeaders })
    }

    const records = knockoutMatches.map((match) => ({
      id: match.id,
      local: match.homeTeam?.tla || match.homeTeam?.name || 'TBD',
      visitante: match.awayTeam?.tla || match.awayTeam?.name || 'TBD',
      logo_local: match.homeTeam?.crest || PLACEHOLDER_CREST,
      logo_visitante: match.awayTeam?.crest || PLACEHOLDER_CREST,
      fecha: match.utcDate,
      fase: match.stage,
    }))

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { error: upsertError } = await adminClient.from('partidos').upsert(records)
    if (upsertError) throw upsertError

    return Response.json({ count: records.length }, { headers: corsHeaders })
  } catch (error) {
    console.error('Unable to sync knockout matches', error)
    return new Response(JSON.stringify({ error: 'Unable to sync knockout matches' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
