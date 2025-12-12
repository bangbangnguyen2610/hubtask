// Service for Lark Task API v2 (native tasks, not Bitable)

const API_URL = '/api/tasks';

export async function getTasks(options = {}) {
  const params = new URLSearchParams();

  if (options.tasklist) {
    params.set('tasklist', options.tasklist);
  }
  if (options.includeComments) {
    params.set('comments', 'true');
  }

  const url = params.toString() ? `${API_URL}?${params}` : API_URL;
  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    return {
      tasks: data.tasks,
      tasklists: data.tasklists || [],
      stats: data.stats || {},
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
