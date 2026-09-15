// Cloudflare Pages middleware — sets the starting language from the visitor's IP country.
//
// Cloudflare already resolves the country for every request it serves (request.cf.country),
// so no extra lookup, third party or delay is involved. Only the resulting language code is
// written into the page as <html data-geo-lang="nl|en">; the country itself never reaches
// the browser and nothing is stored. The platform's head script (apps/platform/index.html)
// and @gfl/i18n's LanguageProvider read it; a language picked with the NL/EN toggle still
// wins. _routes.json keeps static files out of this function, so it runs on page loads only.

const DUTCH_COUNTRIES = ['NL'];

export async function onRequest({ request, next }) {
  const response = await next();

  const country = request.cf && request.cf.country;
  const contentType = response.headers.get('Content-Type') || '';
  if (!country || !contentType.includes('text/html')) return response;

  const geoLang = DUTCH_COUNTRIES.includes(country) ? 'nl' : 'en';

  // The HTML now differs per visitor, so no cache may hand one visitor's copy to another.
  const headers = new Headers(response.headers);
  headers.delete('ETag');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  return new HTMLRewriter()
    .on('html', { element(el) { el.setAttribute('data-geo-lang', geoLang); } })
    .transform(new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }));
}
