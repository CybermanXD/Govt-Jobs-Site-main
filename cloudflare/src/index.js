const ACTIONS = {
  jobs: 'jobs',
  snapshot: 'snapshot',
  details_snapshot: 'details_snapshot',
  job_details: 'job_details',
  meta: 'meta',
  health: 'health'
};

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

async function proxyApi(request, env, route) {
  if (request.method !== 'GET') {
    return jsonError('Method not allowed', 405, {Allow: 'GET'});
  }

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
  target.searchParams.set('action', action);
  incomingUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const cacheSeconds = action === 'job_details' ? 3600 : action === 'health' ? 15 : action === 'meta' ? 60 : 300;

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

export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);
    const match = pathname.match(/^\/api\/([^/]+)\/?$/);

    if (match) return proxyApi(request, env, decodeURIComponent(match[1]));
    if (pathname === '/api' || pathname.startsWith('/api/')) return jsonError('Unknown API route', 404);

    return env.ASSETS.fetch(request);
  }
};
