// Cloudflare Pages Function - Lark API Proxy
// This bypasses CORS by proxying requests through Cloudflare

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseId: 'NpFFbydIXaskS8saNt1l6BP1gJf',
  baseUrl: 'https://open.larksuite.com/open-apis',
  tableIds: ['tbluN453N5fhcNI0', 'tbl5U9O7SDw7YEa0', 'tblL1zhrNqW9zM3Q'],
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

// Fetch table metadata (name) from Lark
async function fetchTableInfo(token, tableId) {
  const url = `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${tableId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (data.code === 0 && data.data?.table) {
    return {
      id: tableId,
      name: data.data.table.name || 'Unnamed Table',
    };
  }
  return { id: tableId, name: 'Unknown Table' };
}

// Fetch all records from a specific table
async function fetchTableRecords(token, tableId) {
  let allItems = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '100');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.code === 0 && data.data?.items) {
      allItems = [...allItems, ...data.data.items];
      hasMore = data.data.has_more;
      pageToken = data.data.page_token;
    } else {
      hasMore = false;
    }
  }

  return allItems;
}

// Transform Lark record to task format
function transformTask(record, tableId, tableName) {
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
    if (priorityField.includes('P1') || priorityField.toLowerCase?.().includes('quan trọng')) {
      priority = 'high';
    } else if (priorityField.includes('P3') || priorityField.toLowerCase?.().includes('thấp')) {
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
    taskListName: fields['Task list']?.text || tableName,
    tableId,
    tableName,
    link: fields['Task title']?.link || '',
  };
}

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

  try {
    const url = new URL(context.request.url);
    const tableIdParam = url.searchParams.get('tableId');

    const token = await getAccessToken();

    let tableIds = LARK_CONFIG.tableIds;

    // If specific tableId requested, only fetch that one
    if (tableIdParam) {
      tableIds = tableIds.filter(id => id === tableIdParam);
    }

    // Fetch table info (names) and records in parallel
    const tableInfoPromises = tableIds.map(id => fetchTableInfo(token, id));
    const tables = await Promise.all(tableInfoPromises);

    // Create a map for quick lookup
    const tableMap = {};
    tables.forEach(t => { tableMap[t.id] = t.name; });

    // Fetch records from all tables in parallel
    const results = await Promise.all(
      tableIds.map(async (tableId) => {
        try {
          const records = await fetchTableRecords(token, tableId);
          const tableName = tableMap[tableId] || 'Unknown';
          return records.map(r => transformTask(r, tableId, tableName));
        } catch (e) {
          console.error(`Error fetching table ${tableId}:`, e);
          return [];
        }
      })
    );

    const allTasks = results.flat();

    return new Response(JSON.stringify({
      success: true,
      tasks: allTasks,
      tables: tables,
    }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
