import { useState } from 'react';
import { Filter, Search, RefreshCw, ExternalLink, ListTodo, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskList } from '../components/dashboard/TaskList';
import { useLarkTasks } from '../hooks/useLarkTasks';

const statusFilters = [
  { label: 'All', value: 'all', icon: ListTodo, color: 'primary' },
  { label: 'Completed', value: 'completed', icon: CheckCircle2, color: 'emerald' },
  { label: 'In Progress', value: 'in_progress', icon: Clock, color: 'amber' },
  { label: 'Pending', value: 'pending', icon: ListTodo, color: 'primary' },
  { label: 'Overdue', value: 'overdue', icon: AlertTriangle, color: 'rose' },
];

const statusColors = {
  completed: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  pending: 'bg-primary-500',
  overdue: 'bg-rose-500',
};

export function Tasks() {
  const { tasks, isLoading, refetch } = useLarkTasks();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort by created date (newest first)
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => (b.createdOn || 0) - (a.createdOn || 0)
  );

  const handleTaskClick = (task) => {
    if (task.link) {
      window.open(task.link, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ListTodo size={24} className="text-primary-500" />
            Tasks
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {isLoading ? 'Loading...' : `${tasks.length} tasks synced from Lark Base`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            onClick={() =>
              window.open(
                'https://gearvn-com.sg.larksuite.com/base/NpFFbydIXaskS8saNt1l6BP1gJf?table=tbluN453N5fhcNI0',
                '_blank'
              )
            }
          >
            <ExternalLink size={18} className="mr-2" />
            Open in Lark
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-stagger">
        {statusFilters.slice(1).map((item) => {
          const count = tasks.filter((t) => t.status === item.value).length;
          const Icon = item.icon;
          const isActive = filter === item.value;

          return (
            <button
              key={item.value}
              onClick={() => setFilter(filter === item.value ? 'all' : item.value)}
              className={`group relative p-5 rounded-2xl border transition-all duration-200
                ${isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                  : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600 hover:shadow-md'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-100 dark:bg-primary-800/30' : 'bg-surface-100 dark:bg-surface-700'}`}>
                  <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500'} />
                </div>
                <span className={`w-2 h-2 rounded-full ${statusColors[item.value]}`} />
              </div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums">{count}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 px-4 py-2.5 bg-surface-100 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
              <Search size={18} className="text-surface-400" />
              <input
                type="text"
                placeholder="Search tasks, projects, owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder-surface-400 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-surface-400 hover:text-surface-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter size={18} className="text-surface-400 flex-shrink-0" />
              <div className="flex gap-1.5">
                {statusFilters.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-xl transition-all whitespace-nowrap font-medium ${
                      filter === item.value
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                Showing {sortedTasks.length} of {tasks.length} tasks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-surface-400">Loading tasks from Lark...</span>
            </div>
          ) : (
            <TaskList tasks={sortedTasks} onTaskClick={handleTaskClick} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
