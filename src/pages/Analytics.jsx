import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { BurndownChart } from '../components/charts/BurndownChart';
import { BarChartComponent } from '../components/charts/BarChartComponent';

const teamPerformance = [
  { name: 'Alice', tasks: 28, completed: 25 },
  { name: 'Bob', tasks: 22, completed: 18 },
  { name: 'Charlie', tasks: 35, completed: 30 },
  { name: 'Diana', tasks: 18, completed: 17 },
  { name: 'Eve', tasks: 24, completed: 20 },
];

const monthlyData = [
  { name: 'Week 1', completed: 32, created: 45 },
  { name: 'Week 2', completed: 48, created: 38 },
  { name: 'Week 3', completed: 55, created: 42 },
  { name: 'Week 4', completed: 41, created: 35 },
];

export function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed insights and metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
            <p className="text-3xl font-bold text-green-500 mt-1">72%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Time to Complete</p>
            <p className="text-3xl font-bold text-primary-500 mt-1">2.4d</p>
            <p className="text-xs text-gray-400 mt-2">-0.3d from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tasks This Month</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">156</p>
            <p className="text-xs text-gray-400 mt-2">+23 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
            <p className="text-3xl font-bold text-purple-500 mt-1">8</p>
            <p className="text-xs text-gray-400 mt-2">2 ending this week</p>
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
            <ProgressChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={teamPerformance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sprint Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <BurndownChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
