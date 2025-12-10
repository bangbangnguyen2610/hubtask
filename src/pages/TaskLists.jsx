// TaskLists page - Multi-table task management
import { useState, useMemo } from 'react';
import {
  List, Search, Filter, CheckCircle2, Clock, AlertCircle,
  ExternalLink, User, FolderOpen, Calendar, ChevronDown,
  LayoutGrid, LayoutList, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLarkTasks } from '../hooks/useLarkTasks';

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Completed' },
  in_progress: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'In Progress' },
  pending: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Pending' },
  overdue: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Overdue' },
};

export function TaskLists() {
  const { tasks, tables, isLoading, refetch } = useLarkTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const owners = new Set();
    const projects = new Set();

    tasks.forEach(task => {
      if (task.owner) owners.add(task.owner);
      if (task.project) projects.add(task.project);
    });

    return {
      owners: Array.from(owners).sort(),
      projects: Array.from(projects).sort(),
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTable = selectedTable === 'all' || task.tableId === selectedTable;
      const matchStatus = selectedStatus === 'all' || task.status === selectedStatus;
      const matchOwner = selectedOwner === 'all' || task.owner === selectedOwner;
      const matchProject = selectedProject === 'all' || task.project === selectedProject;

      return matchSearch && matchTable && matchStatus && matchOwner && matchProject;
    });
  }, [tasks, searchTerm, selectedTable, selectedStatus, selectedOwner, selectedProject]);

  // Group tasks by table
  const groupedByTable = useMemo(() => {
    const groups = {};
    filteredTasks.forEach(task => {
      const key = task.tableId || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          tableId: key,
          tableName: task.tableName || 'Unknown',
          tasks: [],
        };
      }
      groups[key].tasks.push(task);
    });
    return Object.values(groups);
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => t.status === 'overdue').length;
    return { total, completed, inProgress, overdue };
  }, [filteredTasks]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTable('all');
    setSelectedStatus('all');
    setSelectedOwner('all');
    setSelectedProject('all');
  };

  const hasActiveFilters = searchTerm || selectedTable !== 'all' || selectedStatus !== 'all' ||
    selectedOwner !== 'all' || selectedProject !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500">Loading task lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <List className="text-primary-500" />
            Task Lists
          </h1>
          <p className="text-surface-500 mt-1">
            {stats.total} tasks across {tables?.length || 0} lists
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
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500">Total Tasks</p>
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
          <p className="text-sm text-rose-500">Overdue</p>
          <p className="text-2xl font-bold text-rose-500">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle icon={<Filter size={18} />}>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Table Filter */}
            <div className="relative">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Lists</option>
                {tables?.map(table => (
                  <option key={table.id} value={table.id}>{table.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
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

            {/* Owner Filter */}
            <div className="relative">
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Owners</option>
                {filterOptions.owners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-surface-500">Active filters:</span>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Lists */}
      {groupedByTable.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <List size={48} className="mx-auto text-surface-400 mb-4" />
            <p className="text-surface-500">No tasks found matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByTable.map(group => (
            <Card key={group.tableId}>
              <CardHeader>
                <CardTitle>
                  {group.tableName}
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
                              {task.title}
                            </h4>
                          </div>
                          <div className="space-y-2 text-xs">
                            {task.project && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <FolderOpen size={12} className="text-orange-400" />
                                <span className="truncate">{task.project}</span>
                              </div>
                            )}
                            {task.owner && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <User size={12} className="text-cyan-400" />
                                <span className="truncate">{task.owner}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-surface-500">
                                <Calendar size={12} className="text-pink-400" />
                                <span>{task.dueDate}</span>
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
                              <ExternalLink size={12} /> Open
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
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Title</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Owner</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase">Project</th>
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
                                <span className="text-sm text-surface-900 dark:text-white">{task.title}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-surface-500">{task.owner || '-'}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-surface-500">{task.project || '-'}</span>
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
