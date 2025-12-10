import { useState } from 'react';
import { Plus, Filter, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskList } from '../components/dashboard/TaskList';
import { useLarkTasks } from '../hooks/useLarkTasks';

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? 'Loading...' : `${tasks.length} tasks from Lark Base`}
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

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, projects, owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter size={18} className="text-gray-400 flex-shrink-0" />
              <div className="flex gap-1">
                {statusFilters.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                      filter === item.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusFilters.slice(1).map((item) => {
          const count = tasks.filter((t) => t.status === item.value).length;
          return (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`p-4 rounded-xl border transition-all ${
                filter === item.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading tasks from Lark...
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No tasks found matching your criteria
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Showing {sortedTasks.length} of {tasks.length} tasks
              </div>
              <TaskList tasks={sortedTasks} onTaskClick={handleTaskClick} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
