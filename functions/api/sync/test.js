// Simple sync test endpoint

const LARK_CONFIG = {
  appId: 'cli_a9aab0f22978deed',
  appSecret: 'qGF9xiBcIcZrqzpTS8wV3fB7ouywulDV',
  baseUrl: 'https://open.larksuite.com/open-apis',
  baseId: 'NpFFbydIXaskS8saNt1l6BP1gJf',
};

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

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
    const token = tokenData.tenant_access_token;

    // Step 2: Get tables
    const tablesResponse = await fetch(
      `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tablesData = await tablesResponse.json();
    const tables = tablesData.data.items;

    // Step 3: Get records from first table only
    const firstTable = tables[0];
    const recordsResponse = await fetch(
      `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${firstTable.table_id}/records?page_size=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const recordsData = await recordsResponse.json();

    // Step 4: Try to insert one record into D1
    if (!context.env.DB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'D1 not available',
        tables: tables.length,
        records: recordsData.data?.items?.length || 0,
      }), { headers: corsHeaders });
    }

    const db = context.env.DB;
    const record = recordsData.data.items[0];
    const fields = record.fields || {};

    // Get title
    let title = 'Test Task';
    if (fields['Task title']) {
      if (typeof fields['Task title'] === 'object') {
        title = fields['Task title'].text || 'Test Task';
      } else {
        title = String(fields['Task title']);
      }
    }

    const taskId = `test_${record.record_id}`;
    const now = Date.now();

    // Insert into D1
    await db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, lark_guid, bitable_record_id, title, description, status, priority,
        project_name, tasklist_guid, due_date, start_date, completed_at, created_at,
        updated_at, is_all_day, is_milestone, repeat_rule, link, api_source, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId, null, record.record_id, title, '',
      'pending', 'medium', firstTable.name, firstTable.table_id,
      null, null, null, now,
      now, 0, 0, null,
      null, 'bitable', now
    ).run();

    // Verify
    const result = await db.prepare('SELECT COUNT(*) as count FROM tasks').first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Test sync completed',
      taskInserted: taskId,
      totalTasksInDB: result.count,
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
    }), { status: 500, headers: corsHeaders });
  }
}
