// Sync tasks from Lark Base to D1 - Simplified inline version

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
  baseId: 'NpFFbydIXaskS8saNt1l6BP1gJf',
};

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

  if (!context.env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'D1 database not configured',
    }), { status: 500, headers: corsHeaders });
  }

  const db = context.env.DB;

  try {
    // Step 1: Get token
    const tokenResponse = await fetch(`${LARK_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: LARK_CONFIG.appId,
        app_secret: LARK_CONFIG.appSecret,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.code !== 0) {
      throw new Error(`Token error: ${tokenData.msg}`);
    }
    const token = tokenData.tenant_access_token;

    // Step 2: Get all tables
    const tablesResponse = await fetch(
      `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tablesData = await tablesResponse.json();
    if (tablesData.code !== 0) {
      throw new Error(`Tables error: ${tablesData.msg}`);
    }
    const tables = tablesData.data.items;

    let totalSynced = 0;
    const errors = [];
    const now = Date.now();

    // Step 3: Process each table
    for (const table of tables) {
      try {
        // Fetch records with pagination
        let pageToken = null;
        do {
          let url = `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${table.table_id}/records?page_size=100`;
          if (pageToken) url += `&page_token=${encodeURIComponent(pageToken)}`;

          const recordsResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const recordsData = await recordsResponse.json();

          if (recordsData.code !== 0) {
            errors.push(`Table ${table.name}: API error ${recordsData.msg}`);
            break;
          }

          const records = recordsData.data.items || [];

          // Process each record
          for (const record of records) {
            try {
              const fields = record.fields || {};

              // Extract title
              let title = 'Untitled';
              if (fields['Task title']) {
                if (typeof fields['Task title'] === 'object') {
                  title = fields['Task title'].text || 'Untitled';
                } else {
                  title = String(fields['Task title']);
                }
              }

              // Extract description
              let description = '';
              if (fields['Task description']) {
                if (typeof fields['Task description'] === 'object') {
                  description = fields['Task description'].text || '';
                } else {
                  description = String(fields['Task description'] || '');
                }
              }

              // Extract dates
              const dueDate = typeof fields['Due date'] === 'number' ? fields['Due date'] : null;
              const startDate = typeof fields['Start date'] === 'number' ? fields['Start date'] : null;
              const createdAt = typeof fields['Created on'] === 'number' ? fields['Created on'] : now;
              const completedAt = typeof fields['Completed on'] === 'number' ? fields['Completed on'] : null;

              // Determine status
              const isCompleted = fields['Completion status'] === true;
              let status = 'pending';
              if (isCompleted) {
                status = 'completed';
              } else if (dueDate && dueDate < now) {
                status = 'overdue';
              } else if (startDate || fields['Sub-task progress']) {
                status = 'in_progress';
              }

              // Extract priority
              let priority = 'medium';
              const priorityField = String(fields['Priority'] || '').toLowerCase();
              if (priorityField.includes('p1') || priorityField.includes('high')) {
                priority = 'high';
              } else if (priorityField.includes('p3') || priorityField.includes('low')) {
                priority = 'low';
              }

              // Extract project name
              let projectName = table.name;
              if (fields['Project']) {
                if (typeof fields['Project'] === 'string') {
                  projectName = fields['Project'];
                } else if (typeof fields['Project'] === 'object') {
                  projectName = fields['Project'].text || fields['Project'].name || table.name;
                }
              } else if (fields['Custom Group']) {
                if (typeof fields['Custom Group'] === 'string') {
                  projectName = fields['Custom Group'];
                } else if (typeof fields['Custom Group'] === 'object') {
                  projectName = fields['Custom Group'].text || fields['Custom Group'].name || table.name;
                }
              }

              // Extract link
              let link = null;
              if (fields['Task title'] && typeof fields['Task title'] === 'object') {
                link = fields['Task title'].link || null;
              }

              const taskId = `bitable_${record.record_id}`;

              // Insert into D1
              await db.prepare(`
                INSERT OR REPLACE INTO tasks (
                  id, lark_guid, bitable_record_id, title, description, status, priority,
                  project_name, tasklist_guid, due_date, start_date, completed_at, created_at,
                  updated_at, is_all_day, is_milestone, repeat_rule, link, api_source, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                taskId, null, record.record_id, title, description,
                status, priority, projectName, table.table_id,
                dueDate, startDate, completedAt, createdAt,
                now, 0, 0, null,
                link, 'bitable', now
              ).run();

              totalSynced++;

            } catch (recordError) {
              errors.push(`Record ${record.record_id}: ${recordError.message}`);
            }
          }

          pageToken = recordsData.data.has_more ? recordsData.data.page_token : null;
        } while (pageToken);

      } catch (tableError) {
        errors.push(`Table ${table.name}: ${tableError.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${totalSynced} tasks from Lark Base`,
      tableCount: tables.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { status: 500, headers: corsHeaders });
  }
}
