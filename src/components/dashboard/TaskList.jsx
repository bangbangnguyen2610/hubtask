import { CheckCircle2, Circle, Clock, AlertCircle, ExternalLink, Calendar, User, FolderOpen } from 'lucide-react';

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Completed'
  },
  in_progress: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    label: 'In Progress'
  },
  pending: {
    icon: Circle,
    color: 'text-surface-400',
    bg: 'bg-surface-100 dark:bg-surface-700/50',
    label: 'Pending'
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    label: 'Overdue'
  },
};

const priorityConfig = {
  high: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500'
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  low: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
};

export function TaskList({ tasks = [], onTaskClick, compact = false }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-700 mx-auto flex items-center justify-center mb-3">
          <FolderOpen size={24} className="text-surface-400" />
        </div>
        <p className="text-surface-500 dark:text-surface-400 font-medium">No tasks found</p>
        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Tasks will appear here once added</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const status = statusConfig[task.status] || statusConfig.pending;
        const priority = priorityConfig[task.priority];
        const StatusIcon = status.icon;

        return (
          <div
            key={task.id}
            className="group relative p-4 rounded-xl bg-surface-50/50 dark:bg-surface-800/30
              hover:bg-surface-100 dark:hover:bg-surface-700/50
              border border-transparent hover:border-surface-200 dark:hover:border-surface-600
              cursor-pointer transition-all duration-200"
            onClick={() => onTaskClick?.(task)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={`mt-0.5 p-1.5 rounded-lg ${status.bg} transition-transform group-hover:scale-110`}>
                <StatusIcon size={16} className={status.color} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {task.title}
                  </p>
                  {task.link && (
                    <ExternalLink size={14} className="text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  )}
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500 dark:text-surface-400">
                  {task.project && (
                    <span className="inline-flex items-center gap-1">
                      <FolderOpen size={12} />
                      {task.project}
                    </span>
                  )}
                  {task.owner && (
                    <span className="inline-flex items-center gap-1">
                      <User size={12} />
                      {task.owner}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`inline-flex items-center gap-1 ${task.status === 'overdue' ? 'text-rose-500' : ''}`}>
                      <Calendar size={12} />
                      {task.dueDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority Badge */}
              {priority && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                  {task.priority}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TaskListCompact({ tasks = [], onTaskClick }) {
  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {tasks.map((task) => {
        const status = statusConfig[task.status] || statusConfig.pending;
        const StatusIcon = status.icon;

        return (
          <div
            key={task.id}
            className="py-3 flex items-center gap-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
            onClick={() => onTaskClick?.(task)}
          >
            <StatusIcon size={16} className={status.color} />
            <p className="flex-1 text-sm font-medium text-surface-900 dark:text-white truncate">
              {task.title}
            </p>
            {task.dueDate && (
              <span className="text-xs text-surface-400">{task.dueDate}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
