const ACTIONS = {
  jobs: 'jobs',
  snapshot: 'snapshot',
  details_snapshot: 'details_snapshot',
  job_details: 'job_details',
  meta: 'meta',
  health: 'health'
};

export async function onRequestGet(context) {
  const upstream = context.env.APPS_SCRIPT_API_URL;
  if (!upstream) return Response.json({ok: false, error: 'APPS_SCRIPT_API_URL is not configured'}, {status: 500});
  let upstreamUrl;
  try {
    upstreamUrl = new URL(upstream);
  } catch {
    return Response.json({ok: false, error: 'Backend configuration is invalid'}, {status: 500});
  }
  if (upstreamUrl.protocol !== 'https:' || upstreamUrl.hostname !== 'script.google.com' || !upstreamUrl.pathname.endsWith('/exec')) {
    return Response.json({ok: false, error: 'Backend configuration is invalid'}, {status: 500});
  }
  const path = context.params.path;
  const route = Array.isArray(path) ? path.join('/') : String(path || '');
  const action = ACTIONS[route];
  if (!action) return Response.json({ok: false, error: 'Unknown API route'}, {status: 404});
  const incoming = new URL(context.request.url);
  const target = new URL(upstreamUrl);
  target.searchParams.set('action', action);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  const cacheSeconds = action === 'job_details' ? 3600 : action === 'health' ? 15 : action === 'meta' ? 60 : 300;
  try {
    const response = await fetch(target.toString(), {redirect: 'follow', cf: {cacheEverything: true, cacheTtl: cacheSeconds}});
    const body = await response.text();
    return new Response(body, {status: response.ok ? 200 : 502, headers: {'content-type': 'application/json; charset=utf-8','cache-control': `public, max-age=${cacheSeconds}`,'access-control-allow-origin': '*','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
  } catch (error) {
    console.error('Apps Script upstream request failed', error);
    return Response.json({ok: false, error: 'Backend unavailable'}, {status: 502});
  }
}

export function onRequest(context) {
  if (context.request.method !== 'GET') return Response.json({ok: false, error: 'Method not allowed'}, {status: 405, headers: {Allow: 'GET'}});
  return onRequestGet(context);
}
