import { useState, useCallback } from 'react';
import { Filter, RefreshCw, ExternalLink, ListTodo, CheckCircle2, Clock, AlertTriangle, Database, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskList } from '../components/dashboard/TaskList';
import { CommentsSidePanel } from '../components/dashboard/CommentsSidePanel';
import { SearchBar } from '../components/SearchBar';
import { useLarkTasks } from '../hooks/useLarkTasks';
import { triggerSync } from '../services/dbService';

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
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle search results from SearchBar
  const handleSearchResults = useCallback((results, type) => {
    setSearchResults(results);
    setSearchType(type);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchType(null);
  }, []);

  // Trigger D1 sync
  const handleSyncToD1 = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerSync('all');
      console.log('Sync result:', result);

      // Show detailed result
      const bitableCount = result.results?.bitable?.message || 'Unknown';
      if (result.success) {
        alert(`Sync completed!\n\n${bitableCount}`);
      } else {
        alert(`Sync partially completed:\n\n${bitableCount}\n\nSome features require OAuth login.`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Use search results if available, otherwise use tasks from Lark
  const displayTasks = searchResults || tasks;

  const filteredTasks = displayTasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesFilter;
  });

  // Sort by created date (newest first)
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => (b.createdOn || 0) - (a.createdOn || 0)
  );

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedTask(null);
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
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSyncToD1} disabled={isSyncing}>
            <Database size={18} className={`mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            Sync to D1
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
          <div className="flex flex-col gap-4">
            {/* AI-Powered Search */}
            <div className="flex-1">
              <SearchBar
                onResults={handleSearchResults}
                onClear={handleClearSearch}
                placeholder="Search tasks with AI (semantic search)..."
              />
              {searchResults && (
                <div className="mt-2 flex items-center gap-2 text-sm text-surface-500">
                  <Sparkles size={14} className="text-purple-500" />
                  Found {searchResults.length} results
                  {searchType === 'semantic' && ' using AI search'}
                </div>
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

      {/* Comments Side Panel */}
      <CommentsSidePanel
        task={selectedTask}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </div>
  );
}
