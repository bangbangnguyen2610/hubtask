// Debug endpoint to test Lark API connectivity

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

  const results = {
    step1_tokenRequest: null,
    step2_tokenParsed: null,
    step3_tablesRequest: null,
    step4_tablesParsed: null,
    step5_recordsRequest: null,
    step6_recordsParsed: null,
    d1Available: !!context.env.DB,
    error: null,
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
    const tokenText = await tokenResponse.text();
    results.step1_tokenRequest = { status: tokenResponse.status, length: tokenText.length, preview: tokenText.substring(0, 100) };

    const tokenData = JSON.parse(tokenText);
    results.step2_tokenParsed = { code: tokenData.code, hasToken: !!tokenData.tenant_access_token };

    if (tokenData.code !== 0) {
      throw new Error(`Token error: ${tokenData.msg}`);
    }

    const token = tokenData.tenant_access_token;

    // Step 2: Get tables
    const tablesResponse = await fetch(
      `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tablesText = await tablesResponse.text();
    results.step3_tablesRequest = { status: tablesResponse.status, length: tablesText.length, preview: tablesText.substring(0, 100) };

    const tablesData = JSON.parse(tablesText);
    results.step4_tablesParsed = { code: tablesData.code, tableCount: tablesData.data?.items?.length || 0 };

    if (tablesData.code !== 0) {
      throw new Error(`Tables error: ${tablesData.msg}`);
    }

    // Step 3: Get records from first table
    const firstTableId = tablesData.data.items[0].table_id;
    const recordsResponse = await fetch(
      `${LARK_CONFIG.baseUrl}/bitable/v1/apps/${LARK_CONFIG.baseId}/tables/${firstTableId}/records?page_size=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const recordsText = await recordsResponse.text();
    results.step5_recordsRequest = { status: recordsResponse.status, length: recordsText.length, preview: recordsText.substring(0, 200) };

    const recordsData = JSON.parse(recordsText);
    results.step6_recordsParsed = { code: recordsData.code, recordCount: recordsData.data?.items?.length || 0, total: recordsData.data?.total || 0 };

  } catch (error) {
    results.error = error.message;
  }

  return new Response(JSON.stringify(results, null, 2), { headers: corsHeaders });
}
