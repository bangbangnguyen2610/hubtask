// Cloudflare Pages Function - Lark API Proxy
// This bypasses CORS by proxying requests through Cloudflare

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseId: 'NpFFbydIXaskS8saNt1l6BP1gJf',
  tableId: 'tbluN453N5fhcNI0',
  baseUrl: 'https://open.larksuite.com/open-apis',
};

// Get Lark access token
async function getAccessToken() {
  const response = await fetch(`${LARK_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: LARK_CONFIG.appId,
      app_secret: LARK_CONFIG.appSecret,
    }),
  });

  const data = await response.json();
  if (data.code === 0) {
    return data.tenant_access_token;
  }
  throw new Error('Failed to get access token');
}

// Fetch all records from Lark Base
async function fetchAllRecords(token) {
  let allItems = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${LARK_CONFIG.tableId}/records`);
    url.searchParams.set('page_size', '100');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0) {
      allItems = [...allItems, ...data.data.items];
      hasMore = data.data.has_more;
      pageToken = data.data.page_token;
    } else {
      throw new Error('Failed to fetch records');
    }
  }

  return allItems;
}

// Transform Lark record to task format
function transformTask(record) {
  const fields = record.fields;

  let status = 'pending';
  if (fields['Completion status'] === true) {
    status = 'completed';
  } else if (fields['Due date'] && fields['Due date'] < Date.now() && !fields['Completion status']) {
    status = 'overdue';
  } else if (fields['Start date'] || fields['Sub-task progress']) {
    status = 'in_progress';
  }

  let priority = 'medium';
  const priorityField = fields['Priority'];
  if (priorityField) {
    if (priorityField.includes('P1') || priorityField.toLowerCase().includes('quan trọng')) {
      priority = 'high';
    } else if (priorityField.includes('P3') || priorityField.toLowerCase().includes('thấp')) {
      priority = 'low';
    }
  }

  const owners = fields['Owner'] || [];
  const ownerNames = owners.map(o => o.name || o.en_name).join(', ');

  const projects = fields['Project'] || [];
  const projectName = projects.length > 0 ? projects.join(', ') : (fields['Custom Group'] || 'General');

  let dueDate = null;
  if (fields['Due date']) {
    const date = new Date(fields['Due date']);
    dueDate = date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  }

  return {
    id: record.record_id,
    taskId: fields['Task ID'],
    title: fields['Task title']?.text || 'Untitled',
    description: fields['Task description'] || '',
    status,
    priority,
    project: projectName,
    customGroup: fields['Custom Group'] || null,
    owner: ownerNames,
    ownerAvatars: owners.map(o => o.avatar_url),
    dueDate,
    dueDateRaw: fields['Due date'],
    completedOn: fields['Completed on'],
    createdOn: fields['Created on'],
    subTaskCount: parseInt(fields['Sub-task count']) || 0,
    subTaskProgress: fields['Sub-task progress'],
    module: fields['MODULE'] || [],
    taskListName: fields['Task list']?.text || '',
    link: fields['Task title']?.link || '',
  };
}

export async function onRequest(context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = await getAccessToken();
    const records = await fetchAllRecords(token);
    const tasks = records.map(transformTask);

    return new Response(JSON.stringify({ success: true, tasks }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
