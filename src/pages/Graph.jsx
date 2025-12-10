import { ArrowLeft, Share2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { KnowledgeGraph } from '../components/charts/KnowledgeGraph';
import { useLarkTasks } from '../hooks/useLarkTasks';

export function Graph() {
  const { tasks, isLoading, refetch } = useLarkTasks();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="primary" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Share2 size={20} className="text-primary-500" />
            <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
              Knowledge Graph + Metadata
            </h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Graph Container */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center bg-surface-900">
            <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-surface-400">Loading graph data...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-surface-900">
            <Share2 size={48} className="text-surface-600 mb-4" />
            <p className="text-surface-400">No tasks available to visualize</p>
          </div>
        ) : (
          <KnowledgeGraph tasks={tasks} />
        )}
      </div>
    </div>
  );
}
