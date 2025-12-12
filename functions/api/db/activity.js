// Get recent activity (comments) with task info from D1

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
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Get recent comments with task info using JOIN
    const query = `
      SELECT
        c.id as comment_id,
        c.content,
        c.creator_id,
        c.creator_name,
        c.creator_avatar_url,
        c.created_at as comment_created_at,
        c.reply_to_comment_id,
        t.id as task_id,
        t.lark_guid as task_guid,
        t.title as task_title,
        t.status as task_status,
        t.priority as task_priority,
        t.project_name,
        t.due_date,
        t.link as task_link
      FROM comments c
      LEFT JOIN tasks t ON c.task_id = t.id OR c.task_guid = t.lark_guid
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.prepare(query).bind(limit, offset).all();
    const activities = result.results || [];

    // Transform for frontend
    const transformedActivities = activities.map(item => ({
      id: item.comment_id,
      type: 'comment',
      content: item.content,
      createdAt: item.comment_created_at,
      isReply: !!item.reply_to_comment_id,
      creator: {
        id: item.creator_id,
        name: item.creator_name,
        avatarUrl: item.creator_avatar_url,
      },
      task: {
        id: item.task_id,
        guid: item.task_guid,
        title: item.task_title,
        status: item.task_status,
        priority: item.task_priority,
        projectName: item.project_name,
        dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : null,
        dueDateRaw: item.due_date,
        link: item.task_link,
      },
    }));

    // Get total count
    const countResult = await db.prepare('SELECT COUNT(*) as count FROM comments').first();
    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      activities: transformedActivities,
      total,
      limit,
      offset,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
