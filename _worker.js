import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Try to serve the requested file
      const response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
        }
      );

      // Set cache headers: never cache index.html, long-cache hashed assets
      const headers = new Headers(response.headers);
      if (pathname === '/' || pathname.endsWith('.html')) {
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (pathname.match(/\/static\//)) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return new Response(response.body, { status: response.status, headers });
    } catch (e) {
      if (e instanceof NotFoundError) {
        // Check if the requested path is a static file
        const STATIC_EXTENSIONS = ['.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.ogg', '.mov', '.avi'];
        const isStaticFile = STATIC_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));
        
        // For client-side routing, serve index.html for all non-file requests
        if (!isStaticFile) {
          try {
            const fallback = await getAssetFromKV(
              {
                request: new Request(`${url.origin}/index.html`, request),
                waitUntil: ctx.waitUntil.bind(ctx),
              },
              {
                ASSET_NAMESPACE: env.__STATIC_CONTENT,
              }
            );
            const headers = new Headers(fallback.headers);
            headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            return new Response(fallback.body, { status: fallback.status, headers });
          } catch (error) {
            return new Response('Not found', { status: 404 });
          }
        }
        return new Response('Not found', { status: 404 });
      } else if (e instanceof MethodNotAllowedError) {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
