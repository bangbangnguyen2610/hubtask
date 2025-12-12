-- HubTask D1 Database Schema
-- Tasks synced from Lark Base + Task API v2

-- Tasks table (unified from Bitable + Task API v2)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  lark_guid TEXT UNIQUE,
  bitable_record_id TEXT,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),

  -- Organization
  project_name TEXT,
  tasklist_guid TEXT,

  -- Dates (Unix timestamp ms)
  due_date INTEGER,
  start_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  -- Metadata
  is_all_day INTEGER DEFAULT 0,
  is_milestone INTEGER DEFAULT 0,
  repeat_rule TEXT,
  link TEXT,

  -- Sync tracking
  api_source TEXT CHECK(api_source IN ('bitable', 'task_v2')),
  last_synced_at INTEGER NOT NULL
);

-- Task members (assignees, followers, owners)
CREATE TABLE IF NOT EXISTS task_members (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('assignee', 'follower', 'owner')),
  avatar_url TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  task_guid TEXT,

  -- Content
  content TEXT NOT NULL,

  -- Creator info
  creator_id TEXT,
  creator_name TEXT,
  creator_avatar_url TEXT,

  -- Threading
  reply_to_comment_id TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  last_synced_at INTEGER NOT NULL,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Sync logs for tracking
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  sync_type TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  status TEXT CHECK(status IN ('running', 'success', 'failed')),
  items_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- OAuth tokens storage (for scheduled worker)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY DEFAULT 'default',
  user_access_token TEXT,
  refresh_token TEXT,
  expires_in INTEGER,
  saved_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_name);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_lark_guid ON tasks(lark_guid);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_members_task_id ON task_members(task_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type);
