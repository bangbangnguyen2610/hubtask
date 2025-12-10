import { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskList } from '../components/dashboard/TaskList';

const mockTasks = [
  { id: 1, title: 'Setup CI/CD pipeline', status: 'completed', priority: 'high', project: 'DevOps', dueDate: 'Dec 8' },
  { id: 2, title: 'Review PR #234', status: 'in_progress', priority: 'medium', project: 'Frontend', dueDate: 'Dec 10' },
  { id: 3, title: 'Update documentation', status: 'pending', priority: 'low', project: 'Docs', dueDate: 'Dec 12' },
  { id: 4, title: 'Fix authentication bug', status: 'overdue', priority: 'high', project: 'Backend', dueDate: 'Dec 5' },
  { id: 5, title: 'Design new landing page', status: 'in_progress', priority: 'medium', project: 'Design', dueDate: 'Dec 15' },
  { id: 6, title: 'Implement user notifications', status: 'pending', priority: 'high', project: 'Backend', dueDate: 'Dec 18' },
  { id: 7, title: 'Write unit tests', status: 'in_progress', priority: 'medium', project: 'QA', dueDate: 'Dec 11' },
  { id: 8, title: 'Optimize database queries', status: 'pending', priority: 'high', project: 'Backend', dueDate: 'Dec 20' },
  { id: 9, title: 'Create API documentation', status: 'completed', priority: 'low', project: 'Docs', dueDate: 'Dec 6' },
  { id: 10, title: 'Setup monitoring alerts', status: 'pending', priority: 'medium', project: 'DevOps', dueDate: 'Dec 22' },
];

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
];

export function Tasks() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = mockTasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your tasks</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Add Task
        </Button>
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
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <div className="flex gap-1">
                {statusFilters.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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

      {/* Task List */}
      <Card>
        <CardContent>
          <TaskList tasks={filteredTasks} />
        </CardContent>
      </Card>
    </div>
  );
}
