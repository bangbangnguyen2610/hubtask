import { CheckCircle2, Clock, ListTodo, AlertTriangle, RefreshCw, Target, ArrowUpRight, Sparkles, PieChart, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { StatCard } from '../components/dashboard/StatCard';
import { TaskList } from '../components/dashboard/TaskList';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { Button } from '../components/ui/Button';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function Dashboard() {
  const { tasks, stats, statusChartData, weeklyData, isLoading, isError, refetch } = useLarkTasks();

  // Get recent tasks (last 5)
  const recentTasks = [...tasks]
    .sort((a, b) => (b.createdOn || 0) - (a.createdOn || 0))
    .slice(0, 5);

  // Get overdue tasks
  const overdueTasks = tasks.filter(t => t.status === 'overdue').slice(0, 3);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        <p className="text-surface-600 dark:text-surface-400">Failed to load tasks from Lark</p>
        <Button onClick={() => refetch()}>
          <RefreshCw size={18} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Sparkles size={24} className="text-primary-500" />
            Dashboard
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Overview of your task progress from Lark Base
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="self-start">
          <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard
          title="Total Tasks"
          value={isLoading ? '...' : stats.total}
          subtitle="from Lark Base"
          icon={ListTodo}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={isLoading ? '...' : stats.completed}
          subtitle={`${stats.completionRate}% completion rate`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={isLoading ? '...' : stats.inProgress}
          subtitle="active tasks"
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={isLoading ? '...' : stats.overdue}
          subtitle="needs attention"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Completion Progress - Hero Card */}
      {!isLoading && (
        <Card variant="gradient" className="overflow-hidden">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-surface-200 dark:text-surface-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${stats.completionRate * 2.51} 251`}
                      strokeLinecap="round"
                      className="text-primary-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-surface-900 dark:text-white">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <Target size={20} className="text-primary-500" />
                    Completion Rate
                  </h3>
                  <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
                    {stats.completed} of {stats.total} tasks completed
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      On track
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-6 md:gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums">{stats.pending}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500 tabular-nums">{stats.inProgress}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-500 tabular-nums">{stats.completed}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Done</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid - Bento Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={PieChart}>Task Distribution</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-surface-400">Loading chart...</span>
                </div>
              </div>
            ) : (
              <ProgressChart data={statusChartData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={Activity}>Weekly Activity</CardTitle>
            <CardDescription>Tasks created vs completed</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-surface-400">Loading chart...</span>
                </div>
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
          <div>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </div>
          <a
            href="/tasks"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            View all ({tasks.length})
            <ArrowUpRight size={14} />
          </a>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-surface-400">Loading tasks...</span>
            </div>
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
