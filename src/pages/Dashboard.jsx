import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/dashboard/StatCard';
import { TaskList } from '../components/dashboard/TaskList';
import { ProgressChart } from '../components/charts/ProgressChart';
import { TimelineChart } from '../components/charts/TimelineChart';
import { BurndownChart } from '../components/charts/BurndownChart';

const mockTasks = [
  { id: 1, title: 'Setup CI/CD pipeline', status: 'completed', priority: 'high', project: 'DevOps', dueDate: 'Dec 8' },
  { id: 2, title: 'Review PR #234', status: 'in_progress', priority: 'medium', project: 'Frontend', dueDate: 'Dec 10' },
  { id: 3, title: 'Update documentation', status: 'pending', priority: 'low', project: 'Docs', dueDate: 'Dec 12' },
  { id: 4, title: 'Fix authentication bug', status: 'overdue', priority: 'high', project: 'Backend', dueDate: 'Dec 5' },
  { id: 5, title: 'Design new landing page', status: 'in_progress', priority: 'medium', project: 'Design', dueDate: 'Dec 15' },
];

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your task progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value="124"
          change={12}
          changeType="increase"
          icon={ListTodo}
          color="primary"
        />
        <StatCard
          title="Completed"
          value="89"
          change={8}
          changeType="increase"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="In Progress"
          value="28"
          change={5}
          changeType="decrease"
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value="7"
          change={2}
          changeType="increase"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineChart />
          </CardContent>
        </Card>
      </div>

      {/* Burndown and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sprint Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <BurndownChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <a href="/tasks" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </a>
          </CardHeader>
          <CardContent>
            <TaskList tasks={mockTasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
