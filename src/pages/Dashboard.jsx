import { CheckCircle2, Clock, ListTodo, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/dashboard/StatCard';
import { TaskList } from '../components/dashboard/TaskList';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { BurndownChart } from '../components/charts/BurndownChart';
import { Button } from '../components/ui/Button';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function Dashboard() {
  const { tasks, stats, statusChartData, weeklyData, isLoading, isError, refetch } = useLarkTasks();

  // Get recent tasks (last 5)
  const recentTasks = [...tasks]
    .sort((a, b) => (b.createdOn || 0) - (a.createdOn || 0))
    .slice(0, 5);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">Failed to load tasks from Lark</p>
        <Button onClick={() => refetch()}>
          <RefreshCw size={18} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your task progress from Lark Base
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={isLoading ? '...' : stats.total}
          icon={ListTodo}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={isLoading ? '...' : stats.completed}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={isLoading ? '...' : stats.inProgress}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={isLoading ? '...' : stats.overdue}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Completion Rate */}
      {!isLoading && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completion Rate
              </span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : (
              <ProgressChart data={statusChartData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : (
              <TimelineChart data={weeklyData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tasks</CardTitle>
          <a
            href="/tasks"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all ({tasks.length})
          </a>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading tasks...</div>
          ) : (
            <TaskList
              tasks={recentTasks}
              onTaskClick={(task) => {
                if (task.link) window.open(task.link, '_blank');
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
