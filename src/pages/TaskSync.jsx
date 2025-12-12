// TaskSync page - Direct sync from Lark Task API v2
import { useState, useMemo } from 'react';
import {
  CloudDownload, Search, CheckCircle2, Clock, AlertCircle,
  ExternalLink, User, Calendar, ChevronDown, Users,
  LayoutGrid, LayoutList, RefreshCw, MessageSquare, Milestone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTasks } from '../hooks/useTasks';

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Completed' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'In Progress' },
  pending: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Pending' },
  overdue: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Overdue' },
};

export function TaskSync() {
  const { tasks, tasklists, stats, isLoading, isError, error, refetch } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasklist, setSelectedTasklist] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Get unique assignees for filter
  const assignees = useMemo(() => {
    const set = new Set();
    tasks.forEach(task => {
      (task.assignees || []).forEach(a => set.add(a));
    });
    return Array.from(set).sort();
  }, [tasks]);

  const [selectedAssignee, setSelectedAssignee] = useState('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = !searchTerm ||
        task.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTasklist = selectedTasklist === 'all' || task.tasklistGuid === selectedTasklist;
      const matchStatus = selectedStatus === 'all' || task.status === selectedStatus;
      const matchAssignee = selectedAssignee === 'all' ||
        (task.assignees || []).includes(selectedAssignee);

      return matchSearch && matchTasklist && matchStatus && matchAssignee;
    });
  }, [tasks, searchTerm, selectedTasklist, selectedStatus, selectedAssignee]);

  // Group tasks by tasklist
  const groupedByTasklist = useMemo(() => {
    const groups = {};
    filteredTasks.forEach(task => {
      const key = task.tasklistGuid || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          guid: key,
          name: task.tasklistName || 'Unknown',
          tasks: [],
        };
      }
      groups[key].tasks.push(task);
    });
    return Object.values(groups);
  }, [filteredTasks]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTasklist('all');
    setSelectedStatus('all');
    setSelectedAssignee('all');
  };

  const hasActiveFilters = searchTerm || selectedTasklist !== 'all' ||
    selectedStatus !== 'all' || selectedAssignee !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500">Syncing from Lark Tasks...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              Failed to sync tasks
            </h3>
            <p className="text-surface-500 mb-4">{error?.message}</p>
            <p className="text-sm text-surface-400 mb-4">
              Make sure the app has <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">task:tasklist:read</code> permission
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <CloudDownload className="text-primary-500" />
            Task Sync
          </h1>
          <p className="text-surface-500 mt-1">
            Direct sync from Lark Tasks API v2 • {stats.total} tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-surface-700 shadow-sm' : ''}`}
            >
              <LayoutGrid size={18} className={viewMode === 'grid' ? 'text-primary-500' : 'text-surface-500'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-surface-700 shadow-sm' : ''}`}
            >
              <LayoutList size={18} className={viewMode === 'list' ? 'text-primary-500' : 'text-surface-500'} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={16} className="mr-1" />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500">Total</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-emerald-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-amber-500">In Progress</p>
          <p className="text-2xl font-bold text-amber-500">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-blue-500">Pending</p>
          <p className="text-2xl font-bold text-blue-500">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-rose-500">Overdue</p>
          <p className="text-2xl font-bold text-rose-500">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle icon={Search}>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>

            {/* Assignee Filter */}
            <div className="relative">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-surface-500">
                Showing {filteredTasks.length} of {stats.total} tasks
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Lists */}
      {groupedByTasklist.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CloudDownload size={48} className="mx-auto text-surface-400 mb-4" />
            <p className="text-surface-500">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByTasklist.map(group => (
            <Card key={group.guid}>
              <CardHeader>
                <CardTitle>
                  {group.name}
                  <span className="ml-2 text-sm font-normal text-surface-500">
                    ({group.tasks.length} tasks)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.tasks.map(task => {
                      const status = statusConfig[task.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={task.id}
                          className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 border border-surface-200 dark:border-surface-700 hover:border-primary-500/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <StatusIcon size={18} className={`${status.color} mt-0.5 flex-shrink-0`} />
                            <h4 className="text-sm font-medium text-surface-900 dark:text-white line-clamp-2">
                              {task.summary}
                            </h4>
                          </div>
                          {task.isMilestone && (
                            <div className="flex items-center gap-1 mb-2">
                              <Milestone size={12} className="text-purple-400" />
                              <span className="text-xs text-purple-400">Milestone</span>
                            </div>
                          )}
                          <div className="space-y-2 text-xs">
                            {task.assignees?.length > 0 && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <Users size={12} className="text-cyan-400" />
                                <span className="truncate">{task.assignees.join(', ')}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <Calendar size={12} className="text-pink-400" />
                                <span>{task.dueDate}</span>
                              </div>
                            )}
                            {task.comments?.length > 0 && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <MessageSquare size={12} className="text-green-400" />
                                <span>{task.comments.length} comments</span>
                              </div>
                            )}
                          </div>
                          {task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink size={12} /> Open in Lark
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-700">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Task</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Assignees</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Due Date</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.tasks.map(task => {
                          const status = statusConfig[task.status] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          return (
                            <tr key={task.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                                  <StatusIcon size={12} />
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {task.isMilestone && <Milestone size={14} className="text-purple-400" />}
                                  <span className="text-sm text-surface-900 dark:text-white">{task.summary}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-surface-500">
                                  {task.assignees?.join(', ') || '-'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-surface-500">{task.dueDate || '-'}</span>
                              </td>
                              <td className="py-3 px-4">
                                {task.link && (
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-500 hover:text-primary-600 text-sm"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
