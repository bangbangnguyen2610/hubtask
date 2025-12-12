// OAuth Login - Redirect to Lark authorization page

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  baseUrl: 'https://open.larksuite.com/open-apis',
  // Redirect URL must be configured in Lark Developer Console -> Security Settings
  redirectUri: 'https://hubtask.pages.dev/api/oauth/callback',
};

export async function onRequest(context) {
  // Build Lark OAuth authorization URL
  const authUrl = new URL('https://open.larksuite.com/open-apis/authen/v1/authorize');
  authUrl.searchParams.set('app_id', LARK_CONFIG.appId);
  authUrl.searchParams.set('redirect_uri', LARK_CONFIG.redirectUri);
  authUrl.searchParams.set('scope', 'task:tasklist:read task:task:read');
  authUrl.searchParams.set('state', 'hubtask_auth');

  // Redirect user to Lark authorization page
  return Response.redirect(authUrl.toString(), 302);
}
