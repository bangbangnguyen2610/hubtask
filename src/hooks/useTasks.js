// Hook for Lark Task API v2 (native tasks, not Bitable)

import { useQuery } from '@tanstack/react-query';
import {
  getTasks,
  calculateTaskStats,
  groupTasksByTasklist,
  groupTasksByAssignee,
} from '../services/taskService';

export function useTasks(options = {}) {
  const query = useQuery({
    queryKey: ['tasks', options],
    queryFn: () => getTasks(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });

  const data = query.data || {};
  const tasks = data.tasks || [];
  const tasklists = data.tasklists || [];
  const stats = calculateTaskStats(tasks);
  const tasklistGroups = groupTasksByTasklist(tasks);
  const assigneeGroups = groupTasksByAssignee(tasks);

  return {
    tasks,
    tasklists,
    stats,
    tasklistGroups,
    assigneeGroups,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useTasks;
