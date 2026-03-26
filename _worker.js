export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Static file extensions — these get long-cache headers
    const STATIC_EXTENSIONS = ['.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.ogg', '.mov', '.avi', '.html'];
    const isStaticFile = STATIC_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));

    // SPA routes (e.g. /feedback, /privacybeleid) — serve index.html directly
    // This bypasses Pages' "pretty URLs" which would try to match stale .html files
    if (!isStaticFile && pathname !== '/') {
      const indexReq = new Request(`${url.origin}/index.html`, request);
      const response = await env.ASSETS.fetch(indexReq);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(response.body, { status: response.status, headers });
    }

    // Serve the actual requested file (static assets, /, index.html)
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    if (pathname === '/' || pathname.endsWith('.html')) {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (pathname.match(/\/static\//)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return new Response(response.body, { status: response.status, headers });
  },
};
