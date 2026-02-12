import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as jose from 'npm:jose@5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  let body: { access_token?: string; prompt?: string };
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

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const issuer = `${baseUrl}/auth/v1`;
  const jwksUrl = `${baseUrl}/auth/v1/.well-known/jwks.json`;
  try {
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    await jose.jwtVerify(token, JWKS, { issuer });
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

  const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim() : '';
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
            maxOutputTokens: 2048,
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
    const script =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ script }), {
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
