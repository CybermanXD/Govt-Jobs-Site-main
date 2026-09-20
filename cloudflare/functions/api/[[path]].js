const ACTIONS = {
  jobs: 'jobs',
  snapshot: 'snapshot',
  details_snapshot: 'details_snapshot',
  job_details: 'job_details',
  meta: 'meta',
  health: 'health'
};

// Bump this whenever the job-details parser/response contract changes. The
// forced upstream query value changes Cloudflare's cache key immediately,
// without exposing or accepting overrides for upstream configuration values.
const DETAIL_CACHE_VERSION = 'detail-parser-v2';
const DETAIL_CACHE_SECONDS = 300;

function jsonError(error, status, headers = {}) {
  return Response.json(
    {ok: false, error},
    {
      status,
      headers: {
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
        ...headers
      }
    }
  );
}

function getUpstreamUrl(env) {
  if (!env.APPS_SCRIPT_API_URL) return null;

  try {
    const url = new URL(env.APPS_SCRIPT_API_URL);
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function proxyRequest(context) {
  const {env, params, request} = context;
  const path = Array.isArray(params.path) ? params.path : [params.path];
  const route = path.filter(Boolean).join('/');
  const action = ACTIONS[route];
  if (!action) return jsonError('Unknown API route', 404);

  const upstreamUrl = getUpstreamUrl(env);
  if (!upstreamUrl) {
    const error = env.APPS_SCRIPT_API_URL
      ? 'Backend configuration is invalid'
      : 'APPS_SCRIPT_API_URL is not configured';
    return jsonError(error, 500);
  }

  const incomingUrl = new URL(request.url);
  const target = new URL(upstreamUrl);
  incomingUrl.searchParams.forEach((value, key) => {
    // Preserve configured upstream parameters (including any secret) and keep
    // routing/cache controls server-owned.
    if (key !== 'action' && key !== 'detail_version' && !target.searchParams.has(key)) {
      target.searchParams.set(key, value);
    }
  });
  target.searchParams.set('action', action);
  if (action === 'job_details') {
    target.searchParams.set('detail_version', DETAIL_CACHE_VERSION);
  }

  const cacheSeconds = action === 'job_details' ? DETAIL_CACHE_SECONDS : action === 'health' ? 15 : action === 'meta' ? 60 : 300;

  try {
    const response = await fetch(target.toString(), {
      redirect: 'follow',
      cf: {cacheEverything: true, cacheTtl: cacheSeconds}
    });
    const body = await response.text();

    return new Response(body, {
      status: response.ok ? 200 : 502,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${cacheSeconds}`,
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer'
      }
    });
  } catch (error) {
    console.error('Apps Script upstream request failed', error);
    return jsonError('Backend unavailable', 502);
  }
}

export function onRequest(context) {
  if (context.request.method !== 'GET') {
    return jsonError('Method not allowed', 405, {Allow: 'GET'});
  }
  return proxyRequest(context);
}
