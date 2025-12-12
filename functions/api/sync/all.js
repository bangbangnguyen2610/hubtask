// Trigger full sync: tasks (bitable + task_v2) + comments + embeddings
// Can be called by external cron service or manually

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional: Check for secret key for cron security
  const url = new URL(context.request.url);
  const cronSecret = url.searchParams.get('secret');
  const expectedSecret = context.env.CRON_SECRET; // Set in Cloudflare dashboard

  if (expectedSecret && cronSecret !== expectedSecret) {
    // Also check Authorization header
    const authHeader = context.request.headers.get('Authorization');
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
      }), { status: 401, headers: corsHeaders });
    }
  }

  const results = {
    bitable: null,
    taskv2: null,
    comments: null,
    embeddings: null,
    errors: [],
  };

  const baseUrl = new URL(context.request.url).origin;

  // 1. Sync tasks from Bitable
  try {
    const bitableRes = await fetch(`${baseUrl}/api/sync/tasks`, {
      method: 'POST',
    });
    results.bitable = await bitableRes.json();
  } catch (error) {
    results.errors.push(`Bitable sync: ${error.message}`);
  }

  // 2. Sync tasks from Task API v2
  try {
    const taskv2Res = await fetch(`${baseUrl}/api/sync/taskv2`, {
      method: 'POST',
    });
    results.taskv2 = await taskv2Res.json();
  } catch (error) {
    results.errors.push(`Task v2 sync: ${error.message}`);
  }

  // 3. Sync comments
  try {
    const commentsRes = await fetch(`${baseUrl}/api/sync/comments`, {
      method: 'POST',
    });
    results.comments = await commentsRes.json();
  } catch (error) {
    results.errors.push(`Comments sync: ${error.message}`);
  }

  // 4. Generate embeddings (only if Vectorize is configured)
  if (context.env.VECTORIZE && context.env.AI) {
    try {
      const embeddingsRes = await fetch(`${baseUrl}/api/sync/embeddings`, {
        method: 'POST',
      });
      results.embeddings = await embeddingsRes.json();
    } catch (error) {
      results.errors.push(`Embeddings sync: ${error.message}`);
    }
  }

  const allSuccess = results.errors.length === 0 &&
    results.bitable?.success !== false &&
    results.taskv2?.success !== false;

  return new Response(JSON.stringify({
    success: allSuccess,
    message: allSuccess ? 'Full sync completed' : 'Sync completed with errors',
    results,
    timestamp: new Date().toISOString(),
  }), {
    status: allSuccess ? 200 : 207,
    headers: corsHeaders,
  });
}
