const express = require('express');
const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// GET /api/ai/chat - simple health/info for testing in browser
router.get('/chat', (req, res) => {
  console.log('Received GET /api/ai/chat');
  const apiKeySet = !!process.env.OPENROUTER_API_KEY;
  return res.json({ ok: true, message: 'AI proxy endpoint (use POST with body)', apiKeyConfigured: apiKeySet });
});

console.log('aiRoutes registered');

// POST /api/ai/chat
// Body: forward request body directly to OpenRouter (model, messages, response_format, etc.)
router.post('/chat', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: OPENROUTER_API_KEY not set' });
  }

  const payload = req.body;

  try {
    // Use global fetch if available (Node 18+), otherwise import node-fetch dynamically
    const fetchFn = globalThis.fetch || (await import('node-fetch')).default;

    const response = await fetchFn(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OpenRouter error', details: data });
    }

    return res.json(data);
  } catch (err) {
    console.error('AI proxy error:', err);
    // If node-fetch is missing on older Node versions, give actionable message
    if (err && (err.code === 'ERR_MODULE_NOT_FOUND' || /node-fetch/.test(err.message || ''))) {
      return res.status(500).json({ error: 'Server misconfiguration: missing node-fetch. Run `npm install` in backend.' });
    }
    return res.status(500).json({ error: 'AI proxy failed', details: err.message });
  }
});

module.exports = router;
