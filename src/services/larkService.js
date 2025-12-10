import axios from 'axios';

// Lark API Configuration
const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseId: 'NpFFbydIXaskS8saNt1l6BP1gJf',
  tableId: 'tbluN453N5fhcNI0',
  baseUrl: 'https://open.larksuite.com/open-apis',
};

let cachedToken = null;
let tokenExpiry = 0;

// Get tenant access token
export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post(
    `${LARK_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`,
    {
      app_id: LARK_CONFIG.appId,
      app_secret: LARK_CONFIG.appSecret,
    }
  );

  if (response.data.code === 0) {
    cachedToken = response.data.tenant_access_token;
    tokenExpiry = Date.now() + (response.data.expire - 60) * 1000; // Refresh 1 min before expiry
    return cachedToken;
  }

  throw new Error('Failed to get Lark access token');
}

// Fetch records from Lark Base
export async function fetchLarkRecords(pageToken = null) {
  const token = await getAccessToken();

  const url = `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${LARK_CONFIG.tableId}/records`;

  const params = { page_size: 100 };
  if (pageToken) params.page_token = pageToken;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  if (response.data.code === 0) {
    return response.data.data;
  }

  throw new Error('Failed to fetch Lark records');
}

// Fetch all records (with pagination)
export async function fetchAllLarkTasks() {
  let allItems = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchLarkRecords(pageToken);
    allItems = [...allItems, ...data.items];
    hasMore = data.has_more;
    pageToken = data.page_token;
  }

  return allItems;
}

// Transform Lark record to task format
export function transformLarkTask(record) {
  const fields = record.fields;

  // Determine status
  let status = 'pending';
  if (fields['Completion status'] === true) {
    status = 'completed';
  } else if (fields['Due date'] && fields['Due date'] < Date.now() && !fields['Completion status']) {
    status = 'overdue';
  } else if (fields['Start date'] || fields['Sub-task progress']) {
    status = 'in_progress';
  }

  // Determine priority
  let priority = 'medium';
  const priorityField = fields['Priority'];
  if (priorityField) {
    if (priorityField.includes('P1') || priorityField.toLowerCase().includes('quan trọng')) {
      priority = 'high';
    } else if (priorityField.includes('P3') || priorityField.toLowerCase().includes('thấp')) {
      priority = 'low';
    }
  }

  // Get owner names
  const owners = fields['Owner'] || [];
  const ownerNames = owners.map(o => o.name || o.en_name).join(', ');

  // Get project
  const projects = fields['Project'] || [];
  const projectName = projects.length > 0 ? projects.join(', ') : (fields['Custom Group'] || 'General');

  // Format due date
  let dueDate = null;
  if (fields['Due date']) {
    const date = new Date(fields['Due date']);
    dueDate = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }

  return {
    id: record.record_id,
    taskId: fields['Task ID'],
    title: fields['Task title']?.text || 'Untitled',
    description: fields['Task description'] || '',
    status,
    priority,
    project: projectName,
    owner: ownerNames,
    ownerAvatars: owners.map(o => o.avatar_url),
    dueDate,
    dueDateRaw: fields['Due date'],
    completedOn: fields['Completed on'],
    createdOn: fields['Created on'],
    subTaskCount: parseInt(fields['Sub-task count']) || 0,
    subTaskProgress: fields['Sub-task progress'],
    module: fields['MODULE'] || [],
    taskListName: fields['Task list']?.text || '',
    link: fields['Task title']?.link || '',
  };
}

// Main function to get all tasks
export async function getLarkTasks() {
  const records = await fetchAllLarkTasks();
  return records.map(transformLarkTask);
}

// Get task statistics
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

// Get tasks grouped by project
export function groupTasksByProject(tasks) {
  const groups = {};
  tasks.forEach(task => {
    const project = task.project || 'General';
    if (!groups[project]) {
      groups[project] = { name: project, tasks: 0, completed: 0 };
    }
    groups[project].tasks++;
    if (task.status === 'completed') {
      groups[project].completed++;
    }
  });
  return Object.values(groups);
}

// Get tasks grouped by status for chart
export function getStatusChartData(tasks) {
  const stats = calculateTaskStats(tasks);
  return [
    { name: 'Completed', value: stats.completed, color: '#22c55e' },
    { name: 'In Progress', value: stats.inProgress, color: '#eab308' },
    { name: 'Pending', value: stats.pending, color: '#3b82f6' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ];
}

// Get weekly activity data
export function getWeeklyActivityData(tasks) {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

    const created = tasks.filter(t => t.createdOn >= dayStart && t.createdOn <= dayEnd).length;
    const completed = tasks.filter(t => t.completedOn >= dayStart && t.completedOn <= dayEnd).length;

    weekData.push({
      name: days[date.getDay()],
      created,
      completed,
    });
  }

  return weekData;
}

export default {
  getLarkTasks,
  calculateTaskStats,
  groupTasksByProject,
  getStatusChartData,
  getWeeklyActivityData,
};
