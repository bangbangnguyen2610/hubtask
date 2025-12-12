// Read tasks from D1 database

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!context.env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  const db = context.env.DB;
  const url = new URL(context.request.url);

  // Query params
  const status = url.searchParams.get('status');
  const project = url.searchParams.get('project');
  const source = url.searchParams.get('source'); // 'bitable' | 'task_v2'
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Build query
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (project) {
      query += ' AND project_name LIKE ?';
      params.push(`%${project}%`);
    }

    if (source) {
      query += ' AND api_source = ?';
      params.push(source);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    const tasks = result.results || [];

    // Get members for each task
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        const membersResult = await db.prepare(
          'SELECT * FROM task_members WHERE task_id = ?'
        ).bind(task.id).all();

        const members = membersResult.results || [];
        const assignees = members.filter(m => m.role === 'assignee' || m.role === 'owner');
        const followers = members.filter(m => m.role === 'follower');

        return {
          ...task,
          // Transform for frontend compatibility
          title: task.title,
          summary: task.title,
          dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : null,
          dueDateRaw: task.due_date,
          startDate: task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : null,
          startDateRaw: task.start_date,
          completedAt: task.completed_at,
          projectName: task.project_name,
          tasklistGuid: task.tasklist_guid,
          isAllDay: !!task.is_all_day,
          isMilestone: !!task.is_milestone,
          repeatRule: task.repeat_rule,
          apiSource: task.api_source,
          guid: task.lark_guid,
          assignees: assignees.map(a => a.user_name),
          followers: followers.map(f => f.user_name),
          owner: assignees[0]?.user_name || 'Unassigned',
          project: task.project_name,
        };
      })
    );

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM tasks WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (project) {
      countQuery += ' AND project_name LIKE ?';
      countParams.push(`%${project}%`);
    }
    if (source) {
      countQuery += ' AND api_source = ?';
      countParams.push(source);
    }

    const countStmt = db.prepare(countQuery);
    const countResult = await countStmt.bind(...countParams).first();
    const total = countResult?.count || 0;

    // Calculate stats
    const statsResult = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
      FROM tasks
    `).first();

    return new Response(JSON.stringify({
      success: true,
      tasks: tasksWithMembers,
      total,
      limit,
      offset,
      stats: {
        total: statsResult?.total || 0,
        completed: statsResult?.completed || 0,
        inProgress: statsResult?.in_progress || 0,
        pending: statsResult?.pending || 0,
        overdue: statsResult?.overdue || 0,
      },
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
