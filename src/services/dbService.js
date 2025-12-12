// Service for reading from D1 database APIs

const DB_API_URL = '/api/db';
const SYNC_API_URL = '/api/sync';

// Get tasks from D1
export async function getTasksFromDB(options = {}) {
  const params = new URLSearchParams();

  if (options.status) params.set('status', options.status);
  if (options.project) params.set('project', options.project);
  if (options.source) params.set('source', options.source);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const url = params.toString()
    ? `${DB_API_URL}/tasks?${params}`
    : `${DB_API_URL}/tasks`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    return {
      tasks: data.tasks,
      total: data.total,
      stats: data.stats,
    };
  }

  throw new Error(data.error || 'Failed to fetch tasks from D1');
}

// Get comments from D1
export async function getCommentsFromDB(taskId) {
  const response = await fetch(`${DB_API_URL}/comments?taskId=${encodeURIComponent(taskId)}`);
  const data = await response.json();

  if (data.success) {
    return {
      comments: data.comments,
      total: data.total,
    };
  }

  throw new Error(data.error || 'Failed to fetch comments from D1');
}

// Search tasks (uses Vectorize if available, falls back to text search)
export async function searchTasks(query, options = {}) {
  const response = await fetch(`${DB_API_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: options.limit || 10,
      status: options.status || null,
    }),
  });

  const data = await response.json();

  if (data.success) {
    return {
      tasks: data.tasks,
      total: data.total,
      searchType: data.searchType, // 'semantic' or 'text'
    };
  }

  throw new Error(data.error || 'Search failed');
}

// Trigger sync
export async function triggerSync(type = 'all') {
  let endpoint = `${SYNC_API_URL}/${type}`;

  const response = await fetch(endpoint, { method: 'POST' });
  const data = await response.json();

  return data;
}

// Save tokens to D1 for scheduled sync
export async function saveTokensToDB(tokens) {
  const response = await fetch(`${SYNC_API_URL}/save-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokens),
  });

  const data = await response.json();
  return data;
}

// Calculate task stats
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

export default {
  getTasksFromDB,
  getCommentsFromDB,
  searchTasks,
  triggerSync,
  saveTokensToDB,
  calculateTaskStats,
};
