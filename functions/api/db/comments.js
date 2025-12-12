// Read comments from D1 database

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
  const taskId = url.searchParams.get('taskId');
  const taskGuid = url.searchParams.get('taskGuid');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!taskId && !taskGuid) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing taskId or taskGuid parameter',
    }), { status: 400, headers: corsHeaders });
  }

  try {
    // Build query
    let query = 'SELECT * FROM comments WHERE ';
    const params = [];

    if (taskId) {
      query += 'task_id = ?';
      params.push(taskId);
    } else {
      query += 'task_guid = ?';
      params.push(taskGuid);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    const comments = result.results || [];

    // Transform for frontend
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      taskId: comment.task_id,
      taskGuid: comment.task_guid,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      creator: {
        id: comment.creator_id,
        name: comment.creator_name,
        avatarUrl: comment.creator_avatar_url,
      },
      replyToCommentId: comment.reply_to_comment_id,
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM comments WHERE ';
    if (taskId) {
      countQuery += 'task_id = ?';
    } else {
      countQuery += 'task_guid = ?';
    }

    const countResult = await db.prepare(countQuery).bind(taskId || taskGuid).first();
    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      success: true,
      comments: transformedComments,
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
