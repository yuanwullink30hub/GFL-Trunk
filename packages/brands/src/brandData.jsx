// Brand data configuration for the 12 Gardens
// Each brand corresponds to a slide in the Gardens slideshow
//
// All 12 slots are template placeholders (expandable when real brands are added).
// Translatable fields are { nl, en } objects so they flip with the language toggle
// via the i18n `t()` helper (t accepts a { nl, en } object directly). Real brands
// added later should follow the same { nl, en } shape.

// The six axes of each brand's analysis wheel (owner, 14 Oct), bilingual like every brand field. The values
// are still placeholders (random) until the leading archetype profile of the brand's branch feeds them.
const METRIC_LABELS = [
  { nl: 'Prijsperceptie', en: 'Price perception' },
  { nl: 'Leverbaarheid', en: 'Availability' },
  { nl: 'Nazorg', en: 'Aftercare' },
  { nl: 'Levensduur', en: 'Lifespan' },
  { nl: 'Communicatie', en: 'Communication' },
  { nl: 'Expertise', en: 'Expertise' },
];
const generateMetrics = () => METRIC_LABELS.map((label) => ({ label, value: Math.floor(Math.random() * 50) + 50 }));

/**
 * A filler unit's own analysis wheel (owner, 14 Oct): a unique shape per unit number, so picking another unit in
 * the Gardens stream visibly changes the wheel. Seeded (mulberry32), so a unit always shows the same shape.
 */
export const fillerMetrics = (unit) => {
  let a = (unit * 0x9e3779b9) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return METRIC_LABELS.map((label) => ({ label, value: Math.floor(rnd() * 70) + 30 }));
};

// Shared placeholder copy (bilingual)
const PH = {
  name: { nl: 'Naam/Merk/Bedrijf', en: 'Name/Brand/Company' },
  tagline: { nl: 'Jouw merk introductie, spreuk of uitnodiging.', en: 'Your brand introduction, motto or invitation.' },
  description: {
    nl: 'Jouw bedrijfsprofiel wordt hier weergegeven. Als partner van Garden for Life deel je hier jouw verhaal, je aanbod en je visie met de community. Neem contact met ons team op om je brandpagina te activeren en je merk zichtbaar te maken.',
    en: 'Your company profile will be shown here. As a Garden for Life partner, this is where you share your story, your offering and your vision with the community. Get in touch with our team to activate your brand page and make your brand visible.'
  },
  introduction: { nl: 'Introductie', en: 'Introduction' },
  productA: { nl: 'Product / Dienst A', en: 'Product / Service A' },
  productB: { nl: 'Product / Dienst B', en: 'Product / Service B' },
  onRequest: { nl: 'Op aanvraag', en: 'On request' },
  specDescription: { nl: 'Beschrijving', en: 'Description' },
  specTbd: { nl: 'Nader te bepalen', en: 'To be determined' },
  eventA: { nl: 'Evenement / Activiteit A', en: 'Event / Activity A' },
  eventB: { nl: 'Evenement / Activiteit B', en: 'Event / Activity B' },
  tbd: { nl: 'Nader te bepalen', en: 'To be determined' },
  locationTbd: { nl: 'Locatie volgt', en: 'Location to follow' },
  review1: { nl: 'Reviews worden hier weergegeven zodra de pagina live is.', en: 'Reviews will appear here once the page is live.' },
  review2: { nl: 'Jouw klanten kunnen hier hun ervaringen delen.', en: 'Your customers can share their experiences here.' },
  // The three purple tags (owner, 14 Oct): niche, location, and — the longest, last — the product or service.
  tagNiche: { nl: 'Niche', en: 'Niche' },
  tagLocation: { nl: 'Locatie', en: 'Location' },
  tagProduct: { nl: 'Product of service naam', en: 'Product or service name' },
};

const LOGO_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23ffffff08' stroke='%23ffffff20' stroke-width='2'/%3E%3Ctext x='50' y='62' text-anchor='middle' fill='%23ffffff25' font-size='42' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";
// Gallery placeholder as a function of language, so the label baked into the
// inline SVG follows the language toggle. Default 'nl' keeps old call sites working.
// Under the label an image and a video symbol side by side (owner, 14 Oct): this sector is for the brand's
// own photos and videos. Drawn in the same SVG, so they scale with the label.
const MEDIA_ICON = "fill='none' stroke='#ffffff25' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'";
const IMAGE_ICON = `<g transform='translate(128 100)' ${MEDIA_ICON}><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></g>`;
const VIDEO_ICON = `<g transform='translate(168 100)' ${MEDIA_ICON}><rect x='2' y='6' width='14' height='12' rx='2'/><path d='m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5'/></g>`;
export const galleryUrl = (lang = 'nl') => {
  const label = (lang === 'en' || lang === 'EN') ? 'COMING SOON' : 'BINNENKORT';
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><rect width='320' height='180' fill='#ffffff05'/>"
    + `<text x='160' y='88' text-anchor='middle' fill='#ffffff25' font-size='15' font-family='monospace'>${label}</text>`
    + IMAGE_ICON + VIDEO_ICON + '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Back-compat: the original constant (Dutch label).
const GALLERY_URL = galleryUrl('nl');
const GALLERY_URL_I18N = { nl: galleryUrl('nl'), en: galleryUrl('en') };

// Build one placeholder/template brand. id/slug differ; everything else is shared.
const makeTemplate = (id, slug) => ({
  id,
  slug,
  // An empty slot: the Gardens search never lists or matches it (its texts are placeholders).
  isTemplate: true,
  name: PH.name,
  tagline: PH.tagline,
  description: PH.description,
  // Placeholders ({ nl, en }) until a brand fills in its own (owner, 14 Oct); a real brand gives plain strings.
  foundedYear: { nl: 'Oprichting', en: 'Founded' },
  origin: { nl: 'Locatie', en: 'Location' },
  logoUrl: LOGO_URL,
  heroImageUrl: '',
  accentColor: '#00ff9d',
  metrics: generateMetrics(),
  gallery: [{ id: '1', type: 'image', url: GALLERY_URL, urlI18n: GALLERY_URL_I18N, title: PH.introduction }],
  featuredProducts: [
    { id: 'p1', name: PH.productA, price: PH.onRequest, specs: [PH.specDescription, PH.specTbd] },
    { id: 'p2', name: PH.productB, price: PH.onRequest, specs: [PH.specDescription, PH.specTbd] },
  ],
  events: [
    { id: 'e1', date: PH.tbd, title: PH.eventA, location: PH.locationTbd },
    { id: 'e2', date: PH.tbd, title: PH.eventB, location: PH.locationTbd },
  ],
  reviews: [
    { id: 'r1', user: 'Partner_01', rating: 5, comment: PH.review1 },
    { id: 'r2', user: 'Partner_02', rating: 5, comment: PH.review2 },
  ],
  tags: [PH.tagNiche, PH.tagLocation, PH.tagProduct],
  // What the Gardens search filters read (GeneralBrandPage UnitSearch). Empty on the template, so a template
  // never matches a filter: a brand fills in niche (a NICHES key), country + municipality, and its price range
  // in euros ({ min, max }).
  niche: null,
  country: null,
  municipality: null,
  price: null,
  // Shown in the contact footer: a filler until a brand fills in its own (owner, 14 Oct). The mail buttons send
  // to `mailTo` instead, so a visitor's mail never goes to the filler's domain.
  email: 'Jouw@email-adres.nl',
  mailTo: 'contact@gardenforlife.nl',
  socialLinks: [
    { platform: 'web', url: '#' },
    { platform: 'insta', url: '#' },
    { platform: 'linkedin', url: '#' },
  ],
});

export const BRANDS = [
  makeTemplate('01', 'template-01'),
  makeTemplate('02', 'template-02'),
  makeTemplate('03', 'template-03'),
  makeTemplate('04', 'template-04'),
  makeTemplate('05', 'template'),
  makeTemplate('06', 'template-06'),
  makeTemplate('07', 'template-07'),
  makeTemplate('08', 'template-08'),
  makeTemplate('09', 'template-09'),
  makeTemplate('10', 'template-10'),
  makeTemplate('11', 'template-11'),
  makeTemplate('12', 'template-12'),
];

export default BRANDS;
