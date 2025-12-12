// Sync tasks from Lark Task API v2 to D1
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

// Fetch all user tasks from Task API v2
async function fetchAllTasks(token) {
  const allTasks = [];

  // Fetch non-completed tasks
  let pageToken = null;
  do {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasks`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allTasks.push(...data.data.items);
      pageToken = data.data.has_more ? data.data.page_token : null;
    } else {
      break;
    }
  } while (pageToken);

  // Fetch completed tasks
  pageToken = null;
  do {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasks`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('completed', 'true');
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allTasks.push(...data.data.items);
      pageToken = data.data.has_more ? data.data.page_token : null;
    } else {
      break;
    }
  } while (pageToken);

  // Remove duplicates
  const uniqueTasks = [];
  const seenGuids = new Set();
  for (const task of allTasks) {
    if (!seenGuids.has(task.guid)) {
      seenGuids.add(task.guid);
      uniqueTasks.push(task);
    }
  }

  return uniqueTasks;
}

// Transform task for D1
function transformTask(task) {
  const now = Date.now();

  // Determine status
  let status = 'pending';
  if (task.completed_at && task.completed_at !== '0') {
    status = 'completed';
  } else if (task.due?.timestamp) {
    const dueTime = parseInt(task.due.timestamp);
    if (dueTime < now) {
      status = 'overdue';
    } else if (task.start?.timestamp) {
      status = 'in_progress';
    }
  }

  // Parse members
  const assignees = (task.members || [])
    .filter(m => m.role === 'assignee')
    .map(m => ({ name: m.name || m.id, id: m.id }));

  const followers = (task.members || [])
    .filter(m => m.role === 'follower')
    .map(m => ({ name: m.name || m.id, id: m.id }));

  // Get tasklist info
  const tasklistGuid = task.tasklists?.[0]?.tasklist_guid || null;

  return {
    id: `taskv2_${task.guid}`,
    lark_guid: task.guid,
    bitable_record_id: null,
    title: task.summary || 'Untitled',
    description: task.description || '',
    status,
    priority: null, // Task API v2 doesn't have priority
    project_name: task.tasklists?.[0]?.name || 'Unknown List',
    tasklist_guid: tasklistGuid,
    due_date: task.due?.timestamp ? parseInt(task.due.timestamp) : null,
    start_date: task.start?.timestamp ? parseInt(task.start.timestamp) : null,
    completed_at: task.completed_at && task.completed_at !== '0' ? parseInt(task.completed_at) : null,
    created_at: task.created_at ? parseInt(task.created_at) : now,
    updated_at: now,
    is_all_day: task.due?.is_all_day ? 1 : 0,
    is_milestone: task.is_milestone ? 1 : 0,
    repeat_rule: task.repeat_rule || null,
    link: `https://applink.larksuite.com/client/todo/detail?guid=${task.guid}`,
    api_source: 'task_v2',
    last_synced_at: now,
    assignees,
    followers,
  };
}

// Upsert task to D1
async function upsertTask(db, task) {
  await db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, lark_guid, bitable_record_id, title, description, status, priority,
      project_name, tasklist_guid, due_date, start_date, completed_at, created_at,
      updated_at, is_all_day, is_milestone, repeat_rule, link, api_source, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    task.id, task.lark_guid, task.bitable_record_id, task.title, task.description,
    task.status, task.priority, task.project_name, task.tasklist_guid,
    task.due_date, task.start_date, task.completed_at, task.created_at,
    task.updated_at, task.is_all_day, task.is_milestone, task.repeat_rule,
    task.link, task.api_source, task.last_synced_at
  ).run();

  // Delete old members
  await db.prepare('DELETE FROM task_members WHERE task_id = ?').bind(task.id).run();

  // Insert assignees
  for (const assignee of task.assignees) {
    const memberId = `${task.id}_assignee_${assignee.id || assignee.name}`;
    await db.prepare(`
      INSERT INTO task_members (id, task_id, user_id, user_name, role, avatar_url)
      VALUES (?, ?, ?, ?, 'assignee', NULL)
    `).bind(memberId, task.id, assignee.id, assignee.name).run();
  }

  // Insert followers
  for (const follower of task.followers) {
    const memberId = `${task.id}_follower_${follower.id || follower.name}`;
    await db.prepare(`
      INSERT INTO task_members (id, task_id, user_id, user_name, role, avatar_url)
      VALUES (?, ?, ?, ?, 'follower', NULL)
    `).bind(memberId, task.id, follower.id, follower.name).run();
  }
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
    logId = await createSyncLog(db, 'tasks_v2');

    // Get valid OAuth token
    const token = await getValidToken(db);

    // Fetch all tasks
    const tasks = await fetchAllTasks(token);

    let totalSynced = 0;

    // Upsert each task
    for (const task of tasks) {
      const transformed = transformTask(task);
      await upsertTask(db, transformed);
      totalSynced++;
    }

    await updateSyncLog(db, logId, 'success', totalSynced);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${totalSynced} tasks from Lark Task API v2`,
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
