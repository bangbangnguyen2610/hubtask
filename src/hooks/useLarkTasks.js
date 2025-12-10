import { useQuery } from '@tanstack/react-query';
import {
  getLarkTasks,
  calculateTaskStats,
  groupTasksByProject,
  getStatusChartData,
  getWeeklyActivityData,
} from '../services/larkService';

export function useLarkTasks() {
  const query = useQuery({
    queryKey: ['larkTasks'],
    queryFn: getLarkTasks,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });

  const tasks = query.data || [];
  const stats = calculateTaskStats(tasks);
  const projectData = groupTasksByProject(tasks);
  const statusChartData = getStatusChartData(tasks);
  const weeklyData = getWeeklyActivityData(tasks);

  return {
    tasks,
    stats,
    projectData,
    statusChartData,
    weeklyData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useLarkTasks;
