// Sync comments from Lark Task API v2 to D1
// Requires OAuth tokens stored in D1

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

// Get stored OAuth tokens from D1
async function getStoredTokens(db) {
  const result = await db.prepare('SELECT * FROM oauth_tokens WHERE id = ?').bind('default').first();
  return result;
}

// Save updated tokens to D1
async function saveTokens(db, accessToken, refreshToken, expiresIn) {
  const now = Date.now();
  await db.prepare(`
    INSERT OR REPLACE INTO oauth_tokens (id, user_access_token, refresh_token, expires_in, saved_at, updated_at)
    VALUES ('default', ?, ?, ?, ?, ?)
  `).bind(accessToken, refreshToken, expiresIn, now, now).run();
}

// Refresh user access token
async function refreshUserAccessToken(db, refreshToken) {
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
    await saveTokens(db, data.data.access_token, data.data.refresh_token, data.data.expires_in);
    return data.data.access_token;
  }
  throw new Error(`Failed to refresh token: ${data.msg}`);
}

// Check if token needs refresh
function needsRefresh(tokens) {
  if (!tokens || !tokens.saved_at || !tokens.expires_in) return true;
  const expiresAt = tokens.saved_at + (tokens.expires_in * 1000);
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() > (expiresAt - fiveMinutes);
}

// Get valid user access token
async function getValidToken(db) {
  const tokens = await getStoredTokens(db);

  if (!tokens || !tokens.refresh_token) {
    throw new Error('No OAuth tokens stored. Please login first at /api/oauth/login');
  }

  if (needsRefresh(tokens)) {
    return await refreshUserAccessToken(db, tokens.refresh_token);
  }

  return tokens.user_access_token;
}

// Fetch comments for a task
async function fetchTaskComments(token, taskGuid) {
  const comments = [];
  let pageToken = null;

  do {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/comments`);
    url.searchParams.set('resource_type', 'task');
    url.searchParams.set('resource_id', taskGuid);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('user_id_type', 'open_id');
    url.searchParams.set('direction', 'desc');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      comments.push(...data.data.items);
      pageToken = data.data.has_more ? data.data.page_token : null;
    } else {
      break;
    }
  } while (pageToken);

  return comments;
}

// Transform comment for D1
function transformComment(comment, taskId, taskGuid) {
  const now = Date.now();
  return {
    id: comment.id,
    task_id: taskId,
    task_guid: taskGuid,
    content: comment.content || '',
    creator_id: comment.creator?.id || null,
    creator_name: comment.creator?.name || 'Unknown',
    creator_avatar_url: comment.creator?.avatar_url || null,
    reply_to_comment_id: comment.reply_to_comment_id || null,
    created_at: comment.created_at ? parseInt(comment.created_at) : now,
    updated_at: comment.updated_at ? parseInt(comment.updated_at) : null,
    last_synced_at: now,
  };
}

// Upsert comment to D1
async function upsertComment(db, comment) {
  await db.prepare(`
    INSERT OR REPLACE INTO comments (
      id, task_id, task_guid, content, creator_id, creator_name, creator_avatar_url,
      reply_to_comment_id, created_at, updated_at, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    comment.id, comment.task_id, comment.task_guid, comment.content,
    comment.creator_id, comment.creator_name, comment.creator_avatar_url,
    comment.reply_to_comment_id, comment.created_at, comment.updated_at,
    comment.last_synced_at
  ).run();
}

// Create sync log entry
async function createSyncLog(db, syncType) {
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.prepare(`
    INSERT INTO sync_logs (id, sync_type, started_at, status, items_synced)
    VALUES (?, ?, ?, 'running', 0)
  `).bind(id, syncType, Date.now()).run();
  return id;
}

// Update sync log
async function updateSyncLog(db, logId, status, itemsSynced, errorMessage = null) {
  await db.prepare(`
    UPDATE sync_logs SET completed_at = ?, status = ?, items_synced = ?, error_message = ?
    WHERE id = ?
  `).bind(Date.now(), status, itemsSynced, errorMessage, logId).run();
}

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!context.env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  const db = context.env.DB;
  let logId = null;

  try {
    logId = await createSyncLog(db, 'comments');

    // Get valid OAuth token
    const token = await getValidToken(db);

    // Get all tasks - extract guid from link if lark_guid is null
    const tasksResult = await db.prepare(`
      SELECT id, lark_guid, link FROM tasks
    `).all();

    const tasks = (tasksResult.results || []).map(task => {
      // If lark_guid exists, use it
      if (task.lark_guid) {
        return { id: task.id, lark_guid: task.lark_guid };
      }
      // Try to extract guid from link URL
      // Link format: https://applink.larksuite.com/client/todo/detail?guid=xxx&...
      if (task.link) {
        const match = task.link.match(/guid=([a-f0-9-]+)/i);
        if (match) {
          return { id: task.id, lark_guid: match[1] };
        }
      }
      return null;
    }).filter(t => t && t.lark_guid);

    // Remove duplicates
    const uniqueTasks = Array.from(new Map(tasks.map(t => [t.lark_guid, t])).values());

    let totalSynced = 0;

    // Fetch comments for each task
    for (const task of uniqueTasks) {
      if (!task.lark_guid) continue;

      try {
        const comments = await fetchTaskComments(token, task.lark_guid);

        for (const comment of comments) {
          const transformed = transformComment(comment, task.id, task.lark_guid);
          await upsertComment(db, transformed);
          totalSynced++;
        }
      } catch (e) {
        console.error(`Failed to sync comments for task ${task.lark_guid}:`, e);
      }
    }

    await updateSyncLog(db, logId, 'success', totalSynced);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${totalSynced} comments from ${uniqueTasks.length} tasks`,
      syncId: logId,
    }), { headers: corsHeaders });

  } catch (error) {
    if (logId) {
      await updateSyncLog(db, logId, 'failed', 0, error.message);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
