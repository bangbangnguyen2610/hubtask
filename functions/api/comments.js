// Cloudflare Pages Function - Fetch comments for a task
// Uses user_access_token from OAuth

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
};

// Get app_access_token (used for refreshing user token)
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

// Refresh user_access_token using refresh_token
async function refreshUserAccessToken(refreshToken) {
  const appAccessToken = await getAppAccessToken();

  const response = await fetch(`${LARK_CONFIG.baseUrl}/authen/v1/oidc/refresh_access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appAccessToken}`,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (data.code === 0) {
    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresIn: data.data.expires_in,
    };
  }
  throw new Error(`Failed to refresh token: ${data.msg}`);
}

// Fetch comments for a specific task
async function fetchTaskComments(token, taskGuid) {
  let allComments = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasks/${taskGuid}/comments`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allComments = [...allComments, ...data.data.items];
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token;
    } else {
      // Return error for debugging
      return { comments: [], error: data };
    }
  }

  return { comments: allComments };
}

// Transform comment to simpler format
function transformComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at ? parseInt(comment.created_at) : null,
    updatedAt: comment.updated_at ? parseInt(comment.updated_at) : null,
    creator: comment.creator ? {
      id: comment.creator.id,
      name: comment.creator.name,
      avatarUrl: comment.creator.avatar_url,
    } : null,
    // Reply info
    replyToCommentId: comment.reply_to_comment_id,
    // Mentioned users
    mentionedUsers: comment.mentioned_user_ids || [],
  };
}

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Refresh-Token',
    'Access-Control-Expose-Headers': 'X-New-Access-Token, X-New-Refresh-Token',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing taskId parameter',
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get tokens from request headers
    let userAccessToken = context.request.headers.get('Authorization')?.replace('Bearer ', '');
    let refreshToken = context.request.headers.get('X-Refresh-Token');

    // If no access token but has refresh token, try to refresh
    if (!userAccessToken && refreshToken) {
      try {
        const tokens = await refreshUserAccessToken(refreshToken);
        userAccessToken = tokens.accessToken;
        corsHeaders['X-New-Access-Token'] = tokens.accessToken;
        corsHeaders['X-New-Refresh-Token'] = tokens.refreshToken;
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token refresh failed: ' + e.message,
          needsAuth: true,
          authUrl: '/api/oauth/login',
        }), {
          status: 401,
          headers: corsHeaders,
        });
      }
    }

    if (!userAccessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No access token provided',
        needsAuth: true,
        authUrl: '/api/oauth/login',
      }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Fetch comments for the task
    const result = await fetchTaskComments(userAccessToken, taskId);

    if (result.error) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        taskId,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const comments = result.comments.map(transformComment);

    return new Response(JSON.stringify({
      success: true,
      taskId,
      comments,
      total: comments.length,
    }), {
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
