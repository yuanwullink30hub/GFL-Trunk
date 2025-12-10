export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Try to serve the requested file
    let asset = env.ASSETS.get(pathname);
    
    if (!asset) {
      // If asset doesn't exist, serve index.html for client-side routing
      if (!pathname.startsWith('/api')) {
        asset = env.ASSETS.get('/index.html');
      }
    }

    if (asset) {
      return new Response(asset.body, {
        headers: {
          ...asset.metadata.httpMetadata,
          'Cache-Control': pathname.endsWith('.html') 
            ? 'no-cache' 
            : 'public, max-age=31536000'
        },
        status: asset.metadata.httpStatus,
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
