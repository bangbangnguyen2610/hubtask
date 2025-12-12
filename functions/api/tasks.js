// Cloudflare Pages Function - Lark Task API v2 Proxy
// Fetches tasks directly from Lark Task Lists (not Bitable)

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
  // Tasklist GUIDs from Lark Tasks
  tasklists: [
    { guid: '9f97563c-dcdc-4dca-8db5-bea0ae002b08', name: '200Lab x Gearvn' },
    // Add more tasklists here when available
  ],
};

// Get Lark tenant access token
async function getAccessToken() {
  const response = await fetch(`${LARK_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: LARK_CONFIG.appId,
      app_secret: LARK_CONFIG.appSecret,
    }),
  });

  const data = await response.json();
  if (data.code === 0) {
    return data.tenant_access_token;
  }
  throw new Error(`Failed to get access token: ${data.msg}`);
}

// Fetch tasks from a tasklist using Lark Task API v2
async function fetchTasklistTasks(token, tasklistGuid) {
  let allTasks = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/task/v2/tasklists/${tasklistGuid}/tasks`);
    url.searchParams.set('page_size', '100');
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
      console.error(`Error fetching tasklist ${tasklistGuid}:`, data);
      hasMore = false;
    }
  }

  return allTasks;
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(context.request.url);
    const tasklistGuidParam = url.searchParams.get('tasklist');
    const includeComments = url.searchParams.get('comments') === 'true';

    const token = await getAccessToken();

    let tasklistsToFetch = LARK_CONFIG.tasklists;

    // If specific tasklist requested, only fetch that one
    if (tasklistGuidParam) {
      tasklistsToFetch = tasklistsToFetch.filter(t => t.guid === tasklistGuidParam);
    }

    // Fetch tasks from all tasklists in parallel
    const results = await Promise.all(
      tasklistsToFetch.map(async (tasklist) => {
        try {
          const tasks = await fetchTasklistTasks(token, tasklist.guid);
          return tasks.map(t => transformTask(t, tasklist.guid, tasklist.name));
        } catch (e) {
          console.error(`Error fetching tasklist ${tasklist.guid}:`, e);
          return [];
        }
      })
    );

    let allTasks = results.flat();

    // Optionally fetch comments for each task
    if (includeComments && allTasks.length > 0) {
      const tasksWithComments = await Promise.all(
        allTasks.map(async (task) => {
          const comments = await fetchTaskComments(token, task.guid);
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
    }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      hint: 'Make sure the app has task:tasklist:read permission',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
