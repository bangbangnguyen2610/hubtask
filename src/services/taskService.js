// Service for Lark Task API v2 (native tasks, not Bitable)
// Uses OAuth user_access_token with auto-refresh

const API_URL = '/api/tasks';
const TOKEN_STORAGE_KEY = 'lark_tokens';

// Get stored tokens from localStorage
export function getStoredTokens() {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading stored tokens:', e);
  }
  return null;
}

// Save tokens to localStorage
export function saveTokens(tokens) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
      ...tokens,
      savedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Error saving tokens:', e);
  }
}

// Clear stored tokens
export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Check if tokens are expired (with 5 min buffer)
export function isTokenExpired(tokens) {
  if (!tokens || !tokens.savedAt || !tokens.expires_in) {
    return true;
  }
  const expiresAt = tokens.savedAt + (tokens.expires_in * 1000) - (5 * 60 * 1000);
  return Date.now() > expiresAt;
}

// Check if user is authenticated
export function isAuthenticated() {
  const tokens = getStoredTokens();
  return tokens && tokens.user_access_token;
}

// Get OAuth login URL
export function getLoginUrl() {
  return '/api/oauth/login';
}

export async function getTasks(options = {}) {
  const tokens = getStoredTokens();

  const params = new URLSearchParams();
  if (options.tasklist) {
    params.set('tasklist', options.tasklist);
  }
  if (options.includeComments) {
    params.set('comments', 'true');
  }

  const url = params.toString() ? `${API_URL}?${params}` : API_URL;

  // Build headers with tokens
  const headers = {
    'Content-Type': 'application/json',
  };

  if (tokens) {
    if (tokens.user_access_token && !isTokenExpired(tokens)) {
      headers['Authorization'] = `Bearer ${tokens.user_access_token}`;
    }
    if (tokens.refresh_token) {
      headers['X-Refresh-Token'] = tokens.refresh_token;
    }
  }

  const response = await fetch(url, { headers });
  const data = await response.json();

  // Check for new tokens in response headers (after refresh)
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');
  if (newAccessToken && newRefreshToken) {
    saveTokens({
      user_access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 7200, // Default 2 hours
    });
  }

  // Handle auth needed
  if (data.needsAuth) {
    return {
      tasks: [],
      tasklists: [],
      stats: {},
      needsAuth: true,
      authUrl: data.authUrl,
    };
  }

  if (data.success) {
    return {
      tasks: data.tasks,
      tasklists: data.tasklists || [],
      stats: data.stats || {},
      errors: data.errors,
    };
  }

  throw new Error(data.error || 'Failed to fetch tasks');
}

export function calculateTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const overdue = tasks.filter(t => t.status === 'overdue').length;

  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function groupTasksByTasklist(tasks) {
  const groups = {};
  tasks.forEach(task => {
    const key = task.tasklistGuid || 'unknown';
    if (!groups[key]) {
      groups[key] = {
        guid: key,
        name: task.tasklistName || 'Unknown',
        tasks: [],
      };
    }
    groups[key].tasks.push(task);
  });
  return Object.values(groups);
}

export function groupTasksByAssignee(tasks) {
  const groups = {};
  tasks.forEach(task => {
    const assignees = task.assignees || [];
    if (assignees.length === 0) {
      const key = 'unassigned';
      if (!groups[key]) {
        groups[key] = { name: 'Unassigned', tasks: [] };
      }
      groups[key].tasks.push(task);
    } else {
      assignees.forEach(assignee => {
        if (!groups[assignee]) {
          groups[assignee] = { name: assignee, tasks: [] };
        }
        groups[assignee].tasks.push(task);
      });
    }
  });
  return Object.values(groups);
}

// Fetch comments for a task by taskId (guid)
export async function getTaskComments(taskId) {
  const tokens = getStoredTokens();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (tokens) {
    if (tokens.user_access_token && !isTokenExpired(tokens)) {
      headers['Authorization'] = `Bearer ${tokens.user_access_token}`;
    }
    if (tokens.refresh_token) {
      headers['X-Refresh-Token'] = tokens.refresh_token;
    }
  }

  const response = await fetch(`/api/comments?taskId=${encodeURIComponent(taskId)}`, { headers });
  const data = await response.json();

  // Check for new tokens in response headers (after refresh)
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');
  if (newAccessToken && newRefreshToken) {
    saveTokens({
      user_access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 7200,
    });
  }

  if (data.needsAuth) {
    return {
      comments: [],
      needsAuth: true,
      authUrl: data.authUrl,
    };
  }

  if (data.success) {
    return {
      comments: data.comments,
      total: data.total,
    };
  }

  throw new Error(data.error || 'Failed to fetch comments');
}
