const MODEL_CONFIG = {
  rembg: { endpoint: 'REMBG_ENDPOINT', token: 'REMBG_TOKEN', name: 'rembg' },
  realesrgan: { endpoint: 'REALESRGAN_ENDPOINT', token: 'REALESRGAN_TOKEN', name: 'Real-ESRGAN' },
  sam2: { endpoint: 'SAM2_ENDPOINT', token: 'SAM2_TOKEN', name: 'SAM 2' },
  flux: { endpoint: 'FLUX_ENDPOINT', token: 'FLUX_TOKEN', name: 'FLUX.1 Schnell' },
  sdxl: { endpoint: 'SDXL_ENDPOINT', token: 'SDXL_TOKEN', name: 'Stable Diffusion XL' }
};

const MAX_IMAGE_DATA = 8_000_000;

function modelStatus() {
  return Object.fromEntries(Object.entries(MODEL_CONFIG).map(([key, cfg]) => [key, {
    name: cfg.name,
    configured: Boolean(process.env[cfg.endpoint]),
    authConfigured: Boolean(process.env[cfg.token] || process.env.AI_PROVIDER_TOKEN)
  }]));
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function safeString(v, max = 4000) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

async function fetchWithTimeout(url, init, timeoutMs = 60_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function normalizeProviderResponse(response) {
  const type = response.headers.get('content-type') || '';
  if (type.startsWith('image/')) {
    const buf = Buffer.from(await response.arrayBuffer());
    return { imageDataUrl: `data:${type.split(';')[0]};base64,${buf.toString('base64')}` };
  }

  const text = await response.text();
  let json;
  try { json = JSON.parse(text); }
  catch { return { raw: text.slice(0, 20_000) }; }

  const direct = json.imageDataUrl || json.output?.imageDataUrl || json.result?.imageDataUrl;
  if (typeof direct === 'string') return { ...json, imageDataUrl: direct };

  const candidate = json.outputUrl || json.url || json.image_url || json.output?.url || json.result?.url || (typeof json.output === 'string' ? json.output : null);
  if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
    try {
      const image = await fetchWithTimeout(candidate, { headers: { Accept: 'image/*' } }, 30_000);
      const imageType = image.headers.get('content-type') || '';
      if (image.ok && imageType.startsWith('image/')) {
        const buf = Buffer.from(await image.arrayBuffer());
        return { ...json, imageDataUrl: `data:${imageType.split(';')[0]};base64,${buf.toString('base64')}` };
      }
    } catch {}
    return { ...json, outputUrl: candidate };
  }

  const base64 = json.image || json.output?.image || json.result?.image;
  if (typeof base64 === 'string' && base64.length > 128) {
    return { ...json, imageDataUrl: base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}` };
  }
  return json;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, {
      service: 'LUMI AI Model Gateway',
      version: '3.0',
      models: modelStatus(),
      privacy: 'Endpoints and tokens stay server-side. No image is sent unless the user explicitly starts an AI job.'
    });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return send(res, 400, { error: 'INVALID_JSON' }); }
  }
  body ||= {};

  const modelKey = safeString(body.model, 40);
  const cfg = MODEL_CONFIG[modelKey];
  if (!cfg) return send(res, 400, { error: 'INVALID_MODEL', message: 'Unknown AI model.' });

  const endpoint = process.env[cfg.endpoint];
  if (!endpoint) {
    return send(res, 503, {
      error: 'MODEL_NOT_CONFIGURED',
      message: `${cfg.name} backend is not configured. Add ${cfg.endpoint} to the Vercel Environment Variables.`,
      model: modelKey
    });
  }

  const imageDataUrl = safeString(body.imageDataUrl, MAX_IMAGE_DATA + 16);
  if (!imageDataUrl || imageDataUrl.length > MAX_IMAGE_DATA) {
    return send(res, 413, { error: 'IMAGE_REQUIRED_OR_TOO_LARGE', message: 'Use a preview image under the gateway request limit.' });
  }

  const token = process.env[cfg.token] || process.env.AI_PROVIDER_TOKEN || '';
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, image/*' };
  if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const payload = {
    model: modelKey,
    task: safeString(body.tool, 80),
    prompt: safeString(body.prompt, 2000),
    option: safeString(body.option, 120),
    imageDataUrl,
    metadata: {
      projectId: safeString(body.metadata?.projectId, 120),
      width: Number(body.metadata?.width) || undefined,
      height: Number(body.metadata?.height) || undefined,
      source: 'lumi-ai-pwa-v3'
    }
  };

  try {
    const response = await fetchWithTimeout(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    const output = await normalizeProviderResponse(response);
    if (!response.ok) {
      return send(res, response.status || 502, { error: 'PROVIDER_ERROR', message: output?.message || output?.error || `Provider returned ${response.status}`, model: modelKey });
    }
    return send(res, 200, { ok: true, model: modelKey, jobId: output.jobId || output.id || null, ...output });
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return send(res, timeout ? 504 : 502, { error: timeout ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE', message: timeout ? 'The AI provider did not finish in time.' : 'Could not reach the configured AI provider.', model: modelKey });
  }
};
