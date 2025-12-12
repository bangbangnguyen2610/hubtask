import { useState, useEffect } from 'react';
import { X, MessageSquare, User, Clock, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { getTaskComments } from '../../services/taskService';

export function CommentsSidePanel({ task, isOpen, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task?.guid) {
      fetchComments();
    }
  }, [isOpen, task?.guid]);

  const fetchComments = async () => {
    if (!task?.guid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getTaskComments(task.guid);
      if (result.needsAuth) {
        setError('Please login to view comments');
      } else {
        setComments(result.comments || []);
      }
    } catch (e) {
      setError(e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-surface-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-5 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-1">
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Comments</span>
              </div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white line-clamp-2">
                {task?.title || task?.summary || 'Task'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <X size={20} className="text-surface-500" />
            </button>
          </div>

          {/* Task meta */}
          <div className="flex items-center gap-4 mt-3 text-sm text-surface-500 dark:text-surface-400">
            {task?.owner && (
              <span className="flex items-center gap-1">
                <User size={14} />
                {task.owner}
              </span>
            )}
            {task?.dueDate && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {task.dueDate}
              </span>
            )}
            {task?.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <ExternalLink size={14} />
                Open in Lark
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-120px)] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="text-primary-500 animate-spin mb-3" />
              <p className="text-surface-500 dark:text-surface-400">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
                <MessageSquare size={24} className="text-rose-500" />
              </div>
              <p className="text-rose-500 font-medium mb-2">Error</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 text-center">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <MessageSquare size={24} className="text-surface-400" />
              </div>
              <p className="text-surface-600 dark:text-surface-300 font-medium">No comments yet</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Be the first to comment on Lark</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {comments.map((comment) => (
                <div key={comment.id} className="px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  {/* Comment header */}
                  <div className="flex items-center gap-3 mb-2">
                    {comment.creator?.avatarUrl ? (
                      <img
                        src={comment.creator.avatarUrl}
                        alt={comment.creator.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <User size={16} className="text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white text-sm">
                        {comment.creator?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Comment content */}
                  <div className="ml-11 text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </div>

                  {/* Reply indicator */}
                  {comment.replyToCommentId && (
                    <div className="ml-11 mt-2 text-xs text-surface-400 dark:text-surface-500 italic">
                      (Reply to a comment)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchComments}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
