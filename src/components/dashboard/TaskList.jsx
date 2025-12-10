import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

const statusIcons = {
  completed: { icon: CheckCircle2, color: 'text-green-500' },
  in_progress: { icon: Clock, color: 'text-yellow-500' },
  pending: { icon: Circle, color: 'text-gray-400' },
  overdue: { icon: AlertCircle, color: 'text-red-500' },
};

const priorityColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function TaskList({ tasks = [], onTaskClick }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No tasks found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {tasks.map((task) => {
        const StatusIcon = statusIcons[task.status]?.icon || Circle;
        const statusColor = statusIcons[task.status]?.color || 'text-gray-400';

        return (
          <div
            key={task.id}
            className="py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
            onClick={() => onTaskClick?.(task)}
          >
            <StatusIcon size={20} className={statusColor} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {task.title}
              </p>
              {task.project && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {task.project}
                </p>
              )}
            </div>
            {task.priority && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
            )}
            {task.dueDate && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {task.dueDate}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
