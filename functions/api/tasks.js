// Cloudflare Pages Function - Lark Task API v2 Proxy
// Fetches tasks directly from Lark Task Lists using user_access_token

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
  // Tasklist GUIDs from Lark Tasks
  tasklists: [
    { guid: '9f97563c-dcdc-4dca-8db5-bea0ae002b08', name: '200Lab x Gearvn' },
    // Add more tasklists here when available
  ],
  // Store refresh token here (will be updated after OAuth)
  // You can also pass it via request header
  refreshToken: null,
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

// Fetch ALL tasks for the user using /task/v2/tasks API
// This gets all tasks the user can see, then we filter by tasklist
async function fetchAllUserTasks(token) {
  let allTasks = [];

  // Fetch non-completed tasks first
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasks`);
    url.searchParams.set('page_size', '100');
    // Request user_accessible data
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allTasks = [...allTasks, ...data.data.items];
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token;
    } else {
      console.log('Fetch tasks (non-completed) response:', JSON.stringify(data));
      break;
    }
  }

  // Fetch completed tasks
  pageToken = null;
  hasMore = true;

  while (hasMore) {
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
      allTasks = [...allTasks, ...data.data.items];
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token;
    } else {
      console.log('Fetch tasks (completed) response:', JSON.stringify(data));
      break;
    }
  }

  // Remove duplicates
  const uniqueTasks = [];
  const seenGuids = new Set();
  for (const task of allTasks) {
    if (!seenGuids.has(task.guid)) {
      seenGuids.add(task.guid);
      uniqueTasks.push(task);
    }
  }

  return { tasks: uniqueTasks };
}

// Fetch tasks from a specific tasklist
async function fetchTasklistTasks(token, tasklistGuid) {
  let allTasks = [];

  // Fetch non-completed tasks
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasklists/${tasklistGuid}/tasks`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allTasks = [...allTasks, ...data.data.items];
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token;
    } else {
      break;
    }
  }

  // Fetch completed tasks
  pageToken = null;
  hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasklists/${tasklistGuid}/tasks`);
    url.searchParams.set('page_size', '100');
    url.searchParams.set('completed', 'true');
    url.searchParams.set('user_id_type', 'open_id');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allTasks = [...allTasks, ...data.data.items];
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token;
    } else {
      break;
    }
  }

  // Remove duplicates
  const uniqueTasks = [];
  const seenGuids = new Set();
  for (const task of allTasks) {
    if (!seenGuids.has(task.guid)) {
      seenGuids.add(task.guid);
      uniqueTasks.push(task);
    }
  }

  return { tasks: uniqueTasks };
}

// Fetch comments for a specific task
async function fetchTaskComments(token, taskGuid) {
  try {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasks/${taskGuid}/comments`);
    url.searchParams.set('page_size', '100');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      return data.data.items;
    }
  } catch (e) {
    console.error(`Error fetching comments for task ${taskGuid}:`, e);
  }
  return [];
}

// Transform Lark Task API response to our format
function transformTask(task, tasklistGuid, tasklistName) {
  // Determine status
  let status = 'pending';
  if (task.completed_at && task.completed_at !== '0') {
    status = 'completed';
  } else if (task.due?.timestamp) {
    const dueTime = parseInt(task.due.timestamp);
    if (dueTime < Date.now()) {
      status = 'overdue';
    } else if (task.start?.timestamp) {
      status = 'in_progress';
    }
  }

  // Parse members (assignees and followers)
  const assignees = (task.members || [])
    .filter(m => m.role === 'assignee')
    .map(m => m.name || m.id);
  const followers = (task.members || [])
    .filter(m => m.role === 'follower')
    .map(m => m.name || m.id);

  // Format due date
  let dueDate = null;
  let dueDateRaw = null;
  if (task.due?.timestamp) {
    dueDateRaw = parseInt(task.due.timestamp);
    const date = new Date(dueDateRaw);
    dueDate = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }

  // Format start date
  let startDate = null;
  let startDateRaw = null;
  if (task.start?.timestamp) {
    startDateRaw = parseInt(task.start.timestamp);
    const date = new Date(startDateRaw);
    startDate = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }

  return {
    id: task.guid,
    guid: task.guid,
    summary: task.summary || 'Untitled',
    description: task.description || '',
    status,
    completedAt: task.completed_at && task.completed_at !== '0' ? parseInt(task.completed_at) : null,
    dueDate,
    dueDateRaw,
    startDate,
    startDateRaw,
    isAllDay: task.due?.is_all_day || false,
    assignees,
    followers,
    members: task.members || [],
    isMilestone: task.is_milestone || false,
    repeatRule: task.repeat_rule || null,
    customFields: task.custom_fields || [],
    tasklistGuid,
    tasklistName,
    // Link to open in Lark
    link: `https://applink.larksuite.com/client/todo/detail?guid=${task.guid}`,
  };
}

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Refresh-Token',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const tasklistGuidParam = url.searchParams.get('tasklist');
    const includeComments = url.searchParams.get('comments') === 'true';
    const fetchAllMode = url.searchParams.get('all') === 'true';

    // Get tokens from request headers or query params
    let userAccessToken = context.request.headers.get('Authorization')?.replace('Bearer ', '');
    let refreshToken = context.request.headers.get('X-Refresh-Token') || url.searchParams.get('refresh_token');

    // If no access token but has refresh token, try to refresh
    if (!userAccessToken && refreshToken) {
      try {
        const tokens = await refreshUserAccessToken(refreshToken);
        userAccessToken = tokens.accessToken;
        // Return new tokens in response headers
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

    // If still no token, return auth needed
    if (!userAccessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No access token provided',
        needsAuth: true,
        authUrl: '/api/oauth/login',
        hint: 'Please authorize the app first by visiting /api/oauth/login',
      }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    let allTasks = [];
    let errors = [];
    let tasklistsToFetch = LARK_CONFIG.tasklists;

    // Mode 1: Fetch ALL user tasks (not filtered by tasklist)
    if (fetchAllMode) {
      const result = await fetchAllUserTasks(userAccessToken);
      allTasks = result.tasks.map(t => {
        // Try to find tasklist info from task's tasklist_guids
        const tasklistGuid = t.tasklists?.[0]?.tasklist_guid || 'unknown';
        const tasklistName = LARK_CONFIG.tasklists.find(tl => tl.guid === tasklistGuid)?.name || 'Unknown List';
        return transformTask(t, tasklistGuid, tasklistName);
      });
    } else {
      // Mode 2: Fetch from specific tasklists
      if (tasklistGuidParam) {
        tasklistsToFetch = tasklistsToFetch.filter(t => t.guid === tasklistGuidParam);
      }

      // Fetch tasks from all tasklists in parallel
      const results = await Promise.all(
        tasklistsToFetch.map(async (tasklist) => {
          try {
            const result = await fetchTasklistTasks(userAccessToken, tasklist.guid);
            if (result.error) {
              console.error(`Error fetching tasklist ${tasklist.guid}:`, result.error);
              return { tasks: [], error: result.error };
            }
            return {
              tasks: result.tasks.map(t => transformTask(t, tasklist.guid, tasklist.name)),
            };
          } catch (e) {
            console.error(`Error fetching tasklist ${tasklist.guid}:`, e);
            return { tasks: [], error: e.message };
          }
        })
      );

      allTasks = results.flatMap(r => r.tasks);
      errors = results.filter(r => r.error).map(r => r.error);
    }

    // Optionally fetch comments for each task
    if (includeComments && allTasks.length > 0) {
      const tasksWithComments = await Promise.all(
        allTasks.map(async (task) => {
          const comments = await fetchTaskComments(userAccessToken, task.guid);
          return { ...task, comments };
        })
      );
      allTasks = tasksWithComments;
    }

    // Calculate stats
    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      overdue: allTasks.filter(t => t.status === 'overdue').length,
    };

    return new Response(JSON.stringify({
      success: true,
      tasks: allTasks,
      tasklists: tasklistsToFetch,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      hint: 'Make sure you have authorized the app and have valid tokens',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
