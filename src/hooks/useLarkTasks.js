import { useQuery } from '@tanstack/react-query';
import { getTasks, calculateTaskStats } from '../services/taskService';

export function useLarkTasks() {
  const query = useQuery({
    queryKey: ['larkTasks'],
    queryFn: () => getTasks({ all: true }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });

  const data = query.data || {};
  const tasks = (data.tasks || []).map(task => ({
    ...task,
    // Map fields for TaskList component compatibility
    title: task.summary || task.title || 'Untitled',
    project: task.tasklistName || 'Unknown List',
    owner: task.assignees?.[0] || 'Unassigned',
    priority: task.priority || null,
    createdOn: task.startDateRaw || 0,
    completedOn: task.completedAt || null,
    link: task.link,
  }));

  const stats = calculateTaskStats(tasks);

  // Group tasks by project/tasklist
  const projectData = groupTasksByProject(tasks);
  const statusChartData = getStatusChartData(tasks);
  const weeklyData = getWeeklyActivityData(tasks);

  return {
    tasks,
    tasklists: data.tasklists || [],
    stats,
    projectData,
    statusChartData,
    weeklyData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    needsAuth: data.needsAuth,
    authUrl: data.authUrl,
    refetch: query.refetch,
  };
}

// Get tasks grouped by project
function groupTasksByProject(tasks) {
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
function getStatusChartData(tasks) {
  const stats = calculateTaskStats(tasks);
  return [
    { name: 'Completed', value: stats.completed, color: '#22c55e' },
    { name: 'In Progress', value: stats.inProgress, color: '#eab308' },
    { name: 'Pending', value: stats.pending, color: '#3b82f6' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ];
}

// Get weekly activity data
function getWeeklyActivityData(tasks) {
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

export default useLarkTasks;
