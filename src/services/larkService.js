// Lark Service - Fetches tasks via Cloudflare Function proxy to bypass CORS

// Use the Cloudflare Function proxy
const API_URL = '/api/lark';

// Main function to get all tasks from Lark via proxy
export async function getLarkTasks() {
  const response = await fetch(API_URL);
  const data = await response.json();

  if (data.success) {
    return data.tasks;
  }

  throw new Error(data.error || 'Failed to fetch tasks');
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
