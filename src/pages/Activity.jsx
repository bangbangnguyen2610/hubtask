import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  User,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Activity as ActivityIcon,
  Reply,
  AlertCircle,
  LogIn,
  CloudDownload,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CommentsSidePanel } from '../components/dashboard/CommentsSidePanel';
import { isAuthenticated, getLoginUrl } from '../services/taskService';

const statusColors = {
  completed: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  pending: 'bg-primary-500',
  overdue: 'bg-rose-500',
};

export function Activity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Check auth status
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/db/activity?limit=100');
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
      } else {
        setError(data.error || 'Failed to load activities');
      }
    } catch (e) {
      setError(e.message || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleSyncComments = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/sync/comments', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSyncResult({ success: true, message: data.message });
        // Refresh activities after sync
        await fetchActivities();
      } else {
        // Check if needs login
        const needsLogin = data.error?.includes('login') || data.error?.includes('OAuth') || data.error?.includes('token');
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
          needsLogin
        });
      }
    } catch (e) {
      setSyncResult({ success: false, message: e.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleTaskClick = (task) => {
    if (task?.id) {
      setSelectedTask({
        ...task,
        guid: task.guid,
        title: task.title,
        summary: task.title,
      });
      setIsPanelOpen(true);
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedTask(null);
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ActivityIcon size={24} className="text-primary-500" />
            Activity
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {isLoading ? 'Loading...' : `${activities.length} recent comments`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchActivities} disabled={isLoading}>
            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auth & Sync Card */}
      <Card className="border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Auth Status */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">Lark Connected</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Ready to sync comments</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <LogIn size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">Login Required</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Connect Lark to sync comments</p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isLoggedIn ? (
                <Button onClick={handleLogin} className="bg-primary-500 hover:bg-primary-600 text-white">
                  <LogIn size={18} className="mr-2" />
                  Login with Lark
                </Button>
              ) : (
                <Button
                  onClick={handleSyncComments}
                  disabled={isSyncing}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  {isSyncing ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <CloudDownload size={18} className="mr-2" />
                  )}
                  {isSyncing ? 'Syncing...' : 'Sync Comments'}
                </Button>
              )}
            </div>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              syncResult.success
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {syncResult.success ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span className="text-sm font-medium">{syncResult.message}</span>
                </div>
                {syncResult.needsLogin && (
                  <Button
                    onClick={handleLogin}
                    size="sm"
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    <LogIn size={14} className="mr-1" />
                    Login Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-500" />
            Recent Comments
          </CardTitle>
          <CardDescription>
            Click on a comment to view the full task details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-surface-400">Loading activities...</span>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertCircle size={24} className="text-rose-500" />
              </div>
              <p className="text-rose-500 font-medium">{error}</p>
              <Button variant="outline" onClick={fetchActivities}>
                <RefreshCw size={16} className="mr-2" />
                Retry
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <MessageSquare size={24} className="text-surface-400" />
              </div>
              <p className="text-surface-600 dark:text-surface-300 font-medium">No comments yet</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
                {isLoggedIn
                  ? 'Click "Sync Comments" to fetch comments from Lark'
                  : 'Login with Lark and sync to see comments'}
              </p>
              {isLoggedIn && (
                <Button onClick={handleSyncComments} disabled={isSyncing} className="mt-2">
                  <CloudDownload size={16} className="mr-2" />
                  Sync Now
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-surface-500 dark:text-surface-400">
                      {dateKey}
                    </span>
                    <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
                  </div>

                  {/* Activities for this date */}
                  <div className="space-y-3">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={() => handleTaskClick(activity.task)}
                        className="group p-4 rounded-xl border border-surface-200 dark:border-surface-700
                          hover:border-primary-300 dark:hover:border-primary-700
                          hover:bg-surface-50 dark:hover:bg-surface-800/50
                          cursor-pointer transition-all duration-200"
                      >
                        <div className="flex gap-3">
                          {/* Avatar */}
                          {activity.creator?.avatarUrl ? (
                            <img
                              src={activity.creator.avatarUrl}
                              alt={activity.creator.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                              <User size={20} className="text-primary-600 dark:text-primary-400" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-surface-900 dark:text-white">
                                {activity.creator?.name || 'Unknown User'}
                              </span>
                              <span className="text-surface-400 dark:text-surface-500 text-sm">
                                commented
                              </span>
                              {activity.isReply && (
                                <span className="flex items-center gap-1 text-xs text-surface-400">
                                  <Reply size={12} />
                                  reply
                                </span>
                              )}
                              <span className="text-surface-400 dark:text-surface-500 text-sm ml-auto flex-shrink-0">
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>

                            {/* Comment Content */}
                            <p className="text-surface-700 dark:text-surface-300 text-sm line-clamp-2 mb-2">
                              {activity.content}
                            </p>

                            {/* Task Info */}
                            {activity.task?.title && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-100 dark:bg-surface-800 group-hover:bg-surface-200 dark:group-hover:bg-surface-700 transition-colors">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[activity.task.status] || 'bg-surface-400'}`} />
                                <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate flex-1">
                                  {activity.task.title}
                                </span>
                                {activity.task.projectName && (
                                  <span className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[120px]">
                                    {activity.task.projectName}
                                  </span>
                                )}
                                <ChevronRight size={16} className="text-surface-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
