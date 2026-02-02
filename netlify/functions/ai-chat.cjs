const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

exports.handler = async function (event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  // Simple GET for health/info
  if (event.httpMethod === 'GET') {
    const apiKeySet = !!process.env.OPENROUTER_API_KEY;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: 'AI proxy function (POST to call)', apiKeyConfigured: apiKeySet }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: OPENROUTER_API_KEY not set' }) };
  }

  let payload;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const fetchFn = globalThis.fetch || (await import('node-fetch')).then(m => m.default);

    const response = await fetchFn(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    const statusCode = response.ok ? 200 : (response.status || 500);
    return { statusCode, headers, body: JSON.stringify(data) };
  } catch (err) {
    console.error('AI proxy function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI proxy failed', details: err.message }) };
  }
};