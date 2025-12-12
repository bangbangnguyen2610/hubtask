// Save OAuth tokens to D1 for scheduled sync
// Called from frontend after OAuth callback

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }), { status: 405, headers: corsHeaders });
  }

  if (!context.env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await context.request.json();
    const { user_access_token, refresh_token, expires_in } = body;

    if (!user_access_token || !refresh_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required tokens',
      }), { status: 400, headers: corsHeaders });
    }

    const db = context.env.DB;
    const now = Date.now();

    // Save tokens to D1
    await db.prepare(`
      INSERT OR REPLACE INTO oauth_tokens (id, user_access_token, refresh_token, expires_in, saved_at, updated_at)
      VALUES ('default', ?, ?, ?, ?, ?)
    `).bind(user_access_token, refresh_token, expires_in || 7200, now, now).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens saved to D1 for scheduled sync',
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
