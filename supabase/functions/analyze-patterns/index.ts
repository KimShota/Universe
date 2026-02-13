import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as jose from 'npm:jose@5';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CREATORS = 7;
const MAX_ENTRIES_PER_CREATOR = 7;

type CreatorRow = { id: string; name: string };
type EntryRow = { creator_id: string; data: Record<string, unknown> };

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

  let body: { creatorIds?: string[]; access_token?: string };
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

  const creatorIds = Array.isArray(body.creatorIds) ? body.creatorIds.slice(0, MAX_CREATORS) : [];
  if (creatorIds.length === 0) {
    return new Response(JSON.stringify({ error: 'creatorIds required (array of up to 7 creator IDs)' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: creatorsData, error: creatorsError } = await supabaseAdmin
    .from('analysis_creators')
    .select('id, name')
    .eq('user_id', userId)
    .in('id', creatorIds);
  if (creatorsError || !creatorsData?.length) {
    return new Response(JSON.stringify({ error: 'No creators found for this user' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const creators = creatorsData as CreatorRow[];
  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  const { data: entriesData, error: entriesError } = await supabaseAdmin
    .from('analysis_entries')
    .select('creator_id, data')
    .eq('user_id', userId)
    .in('creator_id', creatorIds)
    .order('id', { ascending: true });
  if (entriesError) {
    return new Response(JSON.stringify({ error: 'Failed to load analysis entries' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const entries = (entriesData || []) as EntryRow[];
  const byCreator = new Map<string, EntryRow[]>();
  for (const e of entries) {
    const list = byCreator.get(e.creator_id) ?? [];
    if (list.length < MAX_ENTRIES_PER_CREATOR) list.push(e);
    byCreator.set(e.creator_id, list);
  }

  const lines: string[] = [];
  for (const c of creators) {
    const list = byCreator.get(c.id) ?? [];
    lines.push(`Creator: ${c.name}`);
    list.forEach((e, i) => {
      const format = (e.data?.format as string) ?? '';
      const duration = (e.data?.duration as string) ?? '';
      const audio = (e.data?.audio as string) ?? '';
      lines.push(`  Video ${i + 1}: format="${format}", duration="${duration}", audio="${audio}"`);
    });
    lines.push('');
  }

  const dataBlock = lines.join('\n').trim();
  const prompt = `You are analyzing short-form video content patterns. Below is data for up to 7 creators, each with up to 7 videos. For each video we have: format (e.g. Talking head, Split Screen, Silent film/B-roll), duration, and audio style.

Data:
${dataBlock}

Summarize the common patterns and trends across these videos in 2–4 short paragraphs. Focus on: which formats are most used, typical duration, audio patterns, and any notable differences between creators. Write in clear, concise English.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
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
    const text =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'No pattern summary could be generated.';
    return new Response(JSON.stringify({ pattern: text }), {
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
