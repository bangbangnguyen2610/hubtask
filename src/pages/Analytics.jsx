import { RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function Analytics() {
  const { tasks, stats, statusChartData, weeklyData, projectData, isLoading, refetch } = useLarkTasks();

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

  // Project chart data
  const projectChartData = projectData
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Detailed insights from Lark Base
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {isLoading ? '...' : `${stats.completionRate}%`}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="text-3xl font-bold text-primary-500 mt-1">
              {isLoading ? '...' : stats.total}
            </p>
            <p className="text-xs text-gray-400 mt-2">from Lark Base</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {isLoading ? '...' : stats.inProgress}
            </p>
            <p className="text-xs text-gray-400 mt-2">active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Projects</p>
            <p className="text-3xl font-bold text-purple-500 mt-1">
              {isLoading ? '...' : projectData.length}
            </p>
            <p className="text-xs text-gray-400 mt-2">unique groups</p>
          </CardContent>
        </Card>
      </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : teamPerformance.length > 0 ? (
              <BarChartComponent data={teamPerformance} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No owner data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : projectChartData.length > 0 ? (
              <BarChartComponent data={projectChartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Owner Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading...</div>
          ) : teamPerformance.length > 0 ? (
            <div className="space-y-3">
              {teamPerformance.map((owner, index) => (
                <div
                  key={owner.name}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 w-8">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{owner.name}</p>
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
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
          ) : (
            <div className="py-8 text-center text-gray-400">No owner data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
