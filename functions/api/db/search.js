// Semantic search using Cloudflare Vectorize + Workers AI

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = context.env.DB;
  const vectorize = context.env.VECTORIZE;
  const ai = context.env.AI;

  // Check for required bindings
  if (!db) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  // Parse request
  let query = '';
  let limit = 10;
  let status = null;

  if (context.request.method === 'POST') {
    const body = await context.request.json();
    query = body.query || '';
    limit = body.limit || 10;
    status = body.status || null;
  } else {
    const url = new URL(context.request.url);
    query = url.searchParams.get('q') || url.searchParams.get('query') || '';
    limit = parseInt(url.searchParams.get('limit') || '10');
    status = url.searchParams.get('status');
  }

  if (!query.trim()) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing search query',
    }), { status: 400, headers: corsHeaders });
  }

  try {
    // Always use text search for now (Vectorize embeddings not yet populated)
    // TODO: Enable semantic search once embeddings are generated
    // if (vectorize && ai) {
    //   return await semanticSearch(context, query, limit, status, corsHeaders);
    // }

    // Use text search in D1
    return await textSearch(db, query, limit, status, corsHeaders);

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}

// Semantic search using Vectorize
async function semanticSearch(context, query, limit, status, corsHeaders) {
  const { DB: db, VECTORIZE: vectorize, AI: ai } = context.env;

  try {
    // Generate embedding for the query
    const embeddingResponse = await ai.run('@cf/baai/bge-small-en-v1.5', {
      text: query,
    });

    const queryVector = embeddingResponse.data[0];

    // Search in Vectorize
    const searchOptions = {
      topK: limit * 2, // Get more to allow filtering
      returnMetadata: true,
    };

    const vectorResults = await vectorize.query(queryVector, searchOptions);

    // Get task IDs from results
    const taskIds = vectorResults.matches.map(m => m.id);

    if (taskIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        tasks: [],
        total: 0,
        searchType: 'semantic',
      }), { headers: corsHeaders });
    }

    // Fetch full task data from D1
    const placeholders = taskIds.map(() => '?').join(',');
    let tasksQuery = `SELECT * FROM tasks WHERE id IN (${placeholders})`;
    const params = [...taskIds];

    if (status) {
      tasksQuery += ' AND status = ?';
      params.push(status);
    }

    const result = await db.prepare(tasksQuery).bind(...params).all();
    const tasks = result.results || [];

    // Sort by vector similarity score
    const scoreMap = new Map(vectorResults.matches.map(m => [m.id, m.score]));
    tasks.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));

    // Transform and add scores
    const tasksWithScores = tasks.slice(0, limit).map(task => ({
      ...task,
      title: task.title,
      summary: task.title,
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : null,
      dueDateRaw: task.due_date,
      projectName: task.project_name,
      project: task.project_name,
      guid: task.lark_guid,
      relevanceScore: scoreMap.get(task.id) || 0,
    }));

    return new Response(JSON.stringify({
      success: true,
      tasks: tasksWithScores,
      total: tasksWithScores.length,
      searchType: 'semantic',
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Semantic search error:', error);
    // Fallback to text search
    return await textSearch(db, query, limit, status, corsHeaders);
  }
}

// Text search fallback using D1 LIKE
async function textSearch(db, query, limit, status, corsHeaders) {
  // Split query into words for better matching
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  let tasksQuery = `
    SELECT *,
      (
        CASE WHEN LOWER(title) LIKE ? THEN 10 ELSE 0 END +
        CASE WHEN LOWER(description) LIKE ? THEN 5 ELSE 0 END +
        CASE WHEN LOWER(project_name) LIKE ? THEN 3 ELSE 0 END
      ) as relevance_score
    FROM tasks
    WHERE (
      LOWER(title) LIKE ? OR
      LOWER(description) LIKE ? OR
      LOWER(project_name) LIKE ?
    )
  `;

  const searchPattern = `%${query.toLowerCase()}%`;
  const params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];

  if (status) {
    tasksQuery += ' AND status = ?';
    params.push(status);
  }

  tasksQuery += ' ORDER BY relevance_score DESC, updated_at DESC LIMIT ?';
  params.push(limit);

  const result = await db.prepare(tasksQuery).bind(...params).all();
  const tasks = result.results || [];

  // Transform for frontend
  const transformedTasks = tasks.map(task => ({
    ...task,
    title: task.title,
    summary: task.title,
    dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : null,
    dueDateRaw: task.due_date,
    projectName: task.project_name,
    project: task.project_name,
    guid: task.lark_guid,
    relevanceScore: task.relevance_score || 0,
  }));

  return new Response(JSON.stringify({
    success: true,
    tasks: transformedTasks,
    total: transformedTasks.length,
    searchType: 'text',
  }), { headers: corsHeaders });
}
