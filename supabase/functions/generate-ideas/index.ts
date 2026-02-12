import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as jose from 'npm:jose@5';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseToList(raw: string | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { access_token?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token =
    typeof body.access_token === 'string' && body.access_token.trim()
      ? body.access_token.trim()
      : (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'NO_TOKEN' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let userId: string;
  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const issuer = `${baseUrl}/auth/v1`;
  const jwksUrl = `${baseUrl}/auth/v1/.well-known/jwks.json`;
  try {
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(token, JWKS, { issuer });
    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') {
      throw new Error('Missing sub in JWT');
    }
    userId = sub;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        error: 'Invalid or expired token',
        code: 'JWT_VERIFY_FAILED',
        detail: detail.slice(0, 200),
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: universe, error: universeError } = await supabaseAdmin
    .from('creator_universe')
    .select('content_pillars, avatar')
    .eq('user_id', userId)
    .maybeSingle();

  if (universeError || !universe) {
    return new Response(
      JSON.stringify({ error: 'Creator Universe not found. Set up your Creator Universe first.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const avatar = (universe as { avatar?: { psychographic?: { struggle?: string; desire?: string } } }).avatar;
  const psych = avatar?.psychographic;
  const struggles = parseToList(psych?.struggle);
  const desires = parseToList(psych?.desire);

  const pillars = (universe as { content_pillars?: { title?: string; ideas?: string[] }[] }).content_pillars ?? [];
  const topics: string[] = [];
  for (const p of pillars) {
    const ideas = p?.ideas;
    if (Array.isArray(ideas)) {
      for (const i of ideas) {
        if (typeof i === 'string' && i.trim()) topics.push(i.trim());
      }
    }
  }

  if (struggles.length === 0 || desires.length === 0 || topics.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'Add struggles (Target Avatar), desires (Target Avatar), and topics (Vision ideas) in Creator Universe first.',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const listSection = (title: string, items: string[]) =>
    `${title}:\n${items.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`;

  const attached = [
    listSection('Struggles (target avatar)', struggles),
    listSection('Topics (from my pillars / vision ideas)', topics),
    listSection('Desires (target avatar)', desires),
  ].join('\n\n');

  const prompt = `${attached}

Generate 60 short-form content ideas by combining:
- one struggle
- one topic from my pillars
- one desire

Each idea should:
- clearly map to struggle → topic → desire
- feel practical and actionable

Output exactly 60 ideas. Format: one idea per line, numbered 1. through 60. Each line should be a single short idea (one sentence or short phrase).`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error', geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    const lines = rawText
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean);
    const ideas = lines.slice(0, 60);
    if (ideas.length < 60) {
      console.warn('Gemini returned', ideas.length, 'ideas, expected 60');
    }

    return new Response(JSON.stringify({ ideas }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Gemini request failed', e);
    return new Response(
      JSON.stringify({ error: 'Failed to call AI service' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
