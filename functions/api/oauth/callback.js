// OAuth Callback - Exchange authorization code for tokens

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Handle Lark URL verification (for registering callback URL)
  if (context.request.method === 'POST') {
    try {
      const body = await context.request.json();
      // Lark sends a challenge for URL verification
      if (body.challenge) {
        return new Response(JSON.stringify({ challenge: body.challenge }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      // Not a verification request, continue
    }
  }

  // Handle GET request for verification ping
  if (context.request.method === 'GET' && !url.searchParams.get('code')) {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Step 1: Get app_access_token first
    const appTokenRes = await fetch(`${LARK_CONFIG.baseUrl}/auth/v3/app_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: LARK_CONFIG.appId,
        app_secret: LARK_CONFIG.appSecret,
      }),
    });
    const appTokenData = await appTokenRes.json();

    if (appTokenData.code !== 0) {
      throw new Error(`Failed to get app_access_token: ${appTokenData.msg}`);
    }

    const appAccessToken = appTokenData.app_access_token;

    // Step 2: Exchange code for user_access_token
    const tokenRes = await fetch(`${LARK_CONFIG.baseUrl}/authen/v1/oidc/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appAccessToken}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      throw new Error(`Failed to get user_access_token: ${tokenData.msg}`);
    }

    const { access_token, refresh_token, expires_in, refresh_expires_in } = tokenData.data;

    // Save tokens to D1 database for server-side sync
    if (context.env.DB) {
      const now = Date.now();
      await context.env.DB.prepare(`
        INSERT OR REPLACE INTO oauth_tokens (id, user_access_token, refresh_token, expires_in, saved_at, updated_at)
        VALUES ('default', ?, ?, ?, ?, ?)
      `).bind(access_token, refresh_token, expires_in, now, now).run();
    }

    // Get redirect URL from state or default to /activity
    const redirectUrl = state || '/activity';

    // Return HTML page that saves tokens and redirects to app
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorization Successful</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { color: #10b981; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 24px; }
    .tokens { background: #f0f9ff; padding: 16px; border-radius: 8px; text-align: left; font-size: 12px; word-break: break-all; margin-bottom: 24px; }
    .token-label { font-weight: bold; color: #0369a1; }
    button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ Authorization Successful</h1>
    <p>Your Lark account has been connected to HubTask.</p>
    <div class="tokens">
      <p><span class="token-label">Access Token:</span><br/>${access_token.substring(0, 50)}...</p>
      <p><span class="token-label">Refresh Token:</span><br/>${refresh_token.substring(0, 50)}...</p>
      <p><span class="token-label">Expires in:</span> ${expires_in} seconds</p>
    </div>
    <p style="font-size: 12px; color: #999;">Copy these tokens and add them to your environment configuration.</p>
    <button onclick="copyTokens()">Copy Tokens</button>
    <script>
      const tokens = {
        user_access_token: '${access_token}',
        refresh_token: '${refresh_token}',
        expires_in: ${expires_in},
        refresh_expires_in: ${refresh_expires_in}
      };

      // Save to localStorage for the app to use
      localStorage.setItem('lark_tokens', JSON.stringify({
        user_access_token: tokens.user_access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        savedAt: Date.now()
      }));

      function copyTokens() {
        const text = JSON.stringify(tokens, null, 2);
        navigator.clipboard.writeText(text).then(() => {
          alert('Tokens copied to clipboard!');
        });
      }

      // Auto redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '${redirectUrl}';
      }, 2000);
    </script>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}
