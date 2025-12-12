// Generate embeddings for tasks and sync to Vectorize
// Should be called after syncing tasks to D1

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

  if (!db) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  if (!vectorize || !ai) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Vectorize or AI not configured. Make sure VECTORIZE and AI bindings are set.',
    }), { status: 500, headers: corsHeaders });
  }

  try {
    // Get all tasks from D1
    const result = await db.prepare(`
      SELECT id, title, description, status, project_name, priority
      FROM tasks
      ORDER BY updated_at DESC
      LIMIT 1000
    `).all();

    const tasks = result.results || [];

    if (tasks.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No tasks to embed',
        count: 0,
      }), { headers: corsHeaders });
    }

    // Process in batches of 100
    const batchSize = 100;
    let totalEmbedded = 0;
    const errors = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      // Generate text for embedding
      const texts = batch.map(task => {
        const parts = [task.title || 'Untitled'];
        if (task.description) parts.push(task.description);
        if (task.project_name) parts.push(`Project: ${task.project_name}`);
        if (task.status) parts.push(`Status: ${task.status}`);
        if (task.priority) parts.push(`Priority: ${task.priority}`);
        return parts.join(' | ');
      });

      try {
        // Generate embeddings using Workers AI
        const embeddingResults = await Promise.all(
          texts.map(text => ai.run('@cf/baai/bge-small-en-v1.5', { text }))
        );

        // Prepare vectors for Vectorize
        const vectors = batch.map((task, idx) => ({
          id: task.id,
          values: embeddingResults[idx].data[0],
          metadata: {
            title: task.title,
            status: task.status,
            project: task.project_name,
            priority: task.priority,
          },
        }));

        // Upsert to Vectorize
        await vectorize.upsert(vectors);
        totalEmbedded += vectors.length;

      } catch (error) {
        console.error(`Error embedding batch ${i}:`, error);
        errors.push(`Batch ${i}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Embedded ${totalEmbedded} tasks`,
      total: tasks.length,
      embedded: totalEmbedded,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
