import { useState } from 'react';
import { FolderKanban, ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function TaskLists() {
  const { tasks, projectData, isLoading } = useLarkTasks();
  const [expandedLists, setExpandedLists] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Group tasks by task list
  const tasksByList = {};
  tasks.forEach((task) => {
    const listName = task.project || 'Unknown List';
    if (!tasksByList[listName]) {
      tasksByList[listName] = [];
    }
    tasksByList[listName].push(task);
  });

  // Sort task lists by number of tasks
  const sortedLists = [...projectData].sort((a, b) => b.tasks - a.tasks);

  // Toggle expand/collapse
  const toggleList = (listName) => {
    setExpandedLists((prev) => ({
      ...prev,
      [listName]: !prev[listName],
    }));
  };

  // Expand all
  const expandAll = () => {
    const all = {};
    sortedLists.forEach((list) => {
      all[list.name] = true;
    });
    setExpandedLists(all);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedLists({});
  };

  // Filter tasks
  const filterTasks = (taskList) => {
    return taskList.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.owner?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && task.status === 'completed') ||
        (statusFilter === 'in_progress' && task.status === 'in_progress') ||
        (statusFilter === 'pending' && task.status === 'pending');

      return matchesSearch && matchesStatus;
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <Clock size={12} />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
            <AlertTriangle size={12} />
            Pending
          </span>
        );
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-surface-400">Loading task lists...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <FolderKanban size={24} className="text-primary-500" />
            Task Lists
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Browse tasks organized by task list ({sortedLists.length} lists, {tasks.length} tasks)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search tasks by title or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-surface-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <div className="space-y-4">
        {sortedLists.map((list) => {
          const listTasks = tasksByList[list.name] || [];
          const filteredTasks = filterTasks(listTasks);
          const isExpanded = expandedLists[list.name];
          const progress = list.tasks > 0 ? Math.round((list.completed / list.tasks) * 100) : 0;

          return (
            <Card key={list.name} className="overflow-hidden">
              {/* List Header - Clickable */}
              <button
                onClick={() => toggleList(list.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-surface-400" />
                  ) : (
                    <ChevronRight size={20} className="text-surface-400" />
                  )}
                  <FolderKanban size={20} className="text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{list.name}</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {list.completed}/{list.tasks} completed
                      {searchQuery || statusFilter !== 'all'
                        ? ` (${filteredTasks.length} matching)`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress === 100
                            ? 'bg-emerald-500'
                            : progress >= 50
                            ? 'bg-primary-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-surface-600 dark:text-surface-400 w-10 text-right">
                      {progress}%
                    </span>
                  </div>
                  {/* Task count badge */}
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                    {list.tasks}
                  </span>
                </div>
              </button>

              {/* Expanded Task List */}
              {isExpanded && (
                <div className="border-t border-surface-200 dark:border-surface-700">
                  {filteredTasks.length === 0 ? (
                    <div className="p-6 text-center text-surface-400">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No tasks match your filters'
                        : 'No tasks in this list'}
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-800">
                      {filteredTasks.map((task, index) => (
                        <div
                          key={task.id || index}
                          className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(task.status)}
                                {task.priority && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      task.priority === 'high'
                                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                        : task.priority === 'medium'
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-surface-900 dark:text-white truncate">
                                {task.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-surface-500 dark:text-surface-400">
                                {task.owner && <span>Owner: {task.owner}</span>}
                                {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
                                {task.startDate && <span>Start: {formatDate(task.startDate)}</span>}
                              </div>
                            </div>
                            {task.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(task.link, '_blank')}
                                className="shrink-0"
                              >
                                <ExternalLink size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {sortedLists.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban size={48} className="mx-auto text-surface-300 dark:text-surface-600 mb-4" />
            <p className="text-surface-500 dark:text-surface-400">No task lists found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
