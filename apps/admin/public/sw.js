/**
 * The service worker of the installed management app (gardenforlife.nl/admin-dashboard on a phone).
 * It caches nothing and never touches API calls: page loads go to the network, so the app is always the
 * latest deploy, and only when the phone is offline does it answer with a short notice.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0510;color:#FFFEF0;font-family:sans-serif;text-align:center;padding:1rem">'
      + '<p>Geen verbinding. Probeer het opnieuw zodra je online bent.</p></body>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )),
  );
});
