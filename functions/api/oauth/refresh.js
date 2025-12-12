// OAuth Token Refresh endpoint

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
};

// Get app_access_token
async function getAppAccessToken() {
  const response = await fetch(`${LARK_CONFIG.baseUrl}/auth/v3/app_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: LARK_CONFIG.appId,
      app_secret: LARK_CONFIG.appSecret,
    }),
  });

  const data = await response.json();
  if (data.code === 0) {
    return data.app_access_token;
  }
  throw new Error(`Failed to get app_access_token: ${data.msg}`);
}

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await context.request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing refresh_token',
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get app_access_token first
    const appAccessToken = await getAppAccessToken();

    // Refresh user_access_token
    const response = await fetch(`${LARK_CONFIG.baseUrl}/authen/v1/oidc/refresh_access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appAccessToken}`,
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    });

    const data = await response.json();

    if (data.code === 0) {
      return new Response(JSON.stringify({
        success: true,
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_in: data.data.expires_in,
        refresh_expires_in: data.data.refresh_expires_in,
      }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: data.msg || 'Failed to refresh token',
      code: data.code,
    }), {
      status: 400,
      headers: corsHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
