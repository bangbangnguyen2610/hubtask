import { CheckCircle2, Clock, ListTodo, AlertTriangle, RefreshCw, Target, Sparkles, PieChart, Activity, Users, FolderKanban, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { StatCard } from '../components/dashboard/StatCard';
import { TaskList } from '../components/dashboard/TaskList';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { Button } from '../components/ui/Button';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function Dashboard() {
  const { tasks, stats, statusChartData, weeklyData, projectData, isLoading, isError, refetch } = useLarkTasks();

  // Get recent tasks (last 5)
  const recentTasks = [...tasks]
    .sort((a, b) => (b.createdOn || 0) - (a.createdOn || 0))
    .slice(0, 5);

  // Get unique owners with their task counts
  const ownerStats = {};
  tasks.forEach((task) => {
    if (task.owner) {
      const owners = task.owner.split(', ');
      owners.forEach((owner) => {
        if (!ownerStats[owner]) {
          ownerStats[owner] = { name: owner, tasks: 0, completed: 0 };
        }
        ownerStats[owner].tasks++;
        if (task.status === 'completed') {
          ownerStats[owner].completed++;
        }
      });
    }
  });
  const teamPerformance = Object.values(ownerStats)
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 6);

  // Project chart data (top 5 for chart)
  const projectChartData = [...projectData]
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 5);

  // Full task list summary (all task lists)
  const taskListSummary = [...projectData]
    .sort((a, b) => b.tasks - a.tasks);

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

      {/* Charts Grid - Row 1 */}
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

      {/* Charts Grid - Row 2: Team & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle icon={Users}>Team Performance</CardTitle>
            <CardDescription>Tasks by team member</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-surface-400">Loading chart...</span>
                </div>
              </div>
            ) : teamPerformance.length > 0 ? (
              <BarChartComponent data={teamPerformance} />
            ) : (
              <div className="h-64 flex items-center justify-center text-surface-400">
                No owner data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={FolderKanban}>Tasks by Project</CardTitle>
            <CardDescription>Top 5 projects</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-surface-400">Loading chart...</span>
                </div>
              </div>
            ) : projectChartData.length > 0 ? (
              <BarChartComponent data={projectChartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-surface-400">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Leaderboard */}
      {!isLoading && teamPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle icon={Users}>Team Leaderboard</CardTitle>
            <CardDescription>Top performers by completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamPerformance.map((owner, index) => (
                <div
                  key={owner.name}
                  className="flex items-center gap-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                >
                  <span className="text-2xl font-bold text-surface-300 dark:text-surface-600 w-8">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">{owner.name}</p>
                    <div className="flex gap-4 text-sm text-surface-500 dark:text-surface-400">
                      <span>{owner.tasks} tasks</span>
                      <span>{owner.completed} completed</span>
                      <span>
                        {owner.tasks > 0
                          ? Math.round((owner.completed / owner.tasks) * 100)
                          : 0}
                        % rate
                      </span>
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            owner.tasks > 0
                              ? Math.round((owner.completed / owner.tasks) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List Summary */}
      {!isLoading && taskListSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle icon={Layers}>Task List Summary</CardTitle>
            <CardDescription>All task lists with completion status ({taskListSummary.length} lists)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-surface-600 dark:text-surface-400">Task List</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-surface-600 dark:text-surface-400">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-surface-600 dark:text-surface-400">Completed</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-surface-600 dark:text-surface-400">Remaining</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-surface-600 dark:text-surface-400">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {taskListSummary.map((list) => {
                    const remaining = list.tasks - list.completed;
                    const progress = list.tasks > 0 ? Math.round((list.completed / list.tasks) * 100) : 0;
                    return (
                      <tr key={list.name} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FolderKanban size={16} className="text-primary-500" />
                            <span className="font-medium text-surface-900 dark:text-white">{list.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
                            {list.tasks}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            {list.completed}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-medium ${
                            remaining > 0
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {remaining}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 w-24 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progress === 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-primary-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-surface-600 dark:text-surface-400 w-10 text-right">
                              {progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-50 dark:bg-surface-800/50">
                    <td className="py-3 px-4 font-semibold text-surface-900 dark:text-white">Total</td>
                    <td className="text-center py-3 px-4 font-semibold text-surface-900 dark:text-white">{stats.total}</td>
                    <td className="text-center py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{stats.completed}</td>
                    <td className="text-center py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">{stats.total - stats.completed}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-24 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-surface-900 dark:text-white w-10 text-right">
                          {stats.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest updates from your team ({tasks.length} total)</CardDescription>
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
