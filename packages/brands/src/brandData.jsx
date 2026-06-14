// Brand data configuration for the 12 Gardens
// Each brand corresponds to a slide in the Gardens slideshow
//
// All 12 slots are template placeholders (expandable when real brands are added).
// Translatable fields are { nl, en } objects so they flip with the language toggle
// via the i18n `t()` helper (t accepts a { nl, en } object directly). Real brands
// added later should follow the same { nl, en } shape.

// Generate metrics for each brand
const generateMetrics = () => [
  { label: "Innovation", value: Math.floor(Math.random() * 50) + 50, description: "Tech score" },
  { label: "Design", value: Math.floor(Math.random() * 50) + 50, description: "Aesthetics" },
  { label: "Utility", value: Math.floor(Math.random() * 50) + 50, description: "Usability" },
  { label: "Price", value: Math.floor(Math.random() * 50) + 50, description: "Market value" },
  { label: "Sustain", value: Math.floor(Math.random() * 50) + 50, description: "Eco impact" },
  { label: "Performance", value: Math.floor(Math.random() * 50) + 50, description: "Raw output" },
];

// Shared placeholder copy (bilingual)
const PH = {
  name: { nl: 'BINNENKORT', en: 'COMING SOON' },
  tagline: { nl: 'Jouw brandpagina op het platform', en: 'Your brand page on the platform' },
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
  tagCategory: { nl: 'Jouw categorie', en: 'Your category' },
  tagNiche: { nl: 'Jouw niche', en: 'Your niche' },
  tagGfl: { nl: 'Garden for Life', en: 'Garden for Life' },
};

const LOGO_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23ffffff08' stroke='%23ffffff20' stroke-width='2'/%3E%3Ctext x='50' y='62' text-anchor='middle' fill='%23ffffff25' font-size='42' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";
const GALLERY_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23ffffff05'/%3E%3Ctext x='160' y='98' text-anchor='middle' fill='%23ffffff25' font-size='15' font-family='monospace'%3EBINNENKORT%3C/text%3E%3C/svg%3E";

// Build one placeholder/template brand. id/slug differ; everything else is shared.
const makeTemplate = (id, slug) => ({
  id,
  slug,
  name: PH.name,
  tagline: PH.tagline,
  description: PH.description,
  foundedYear: '——',
  origin: '——',
  logoUrl: LOGO_URL,
  heroImageUrl: '',
  accentColor: '#00ff9d',
  metrics: generateMetrics(),
  gallery: [{ id: '1', type: 'image', url: GALLERY_URL, title: PH.introduction }],
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
  tags: [PH.tagCategory, PH.tagNiche, PH.tagGfl],
  email: 'contact@gardenforlife.nl',
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

// Get brand by index (0-11)
export const getBrandByIndex = (index) => {
  return BRANDS[index % BRANDS.length];
};

// Get brand by slug
export const getBrandBySlug = (slug) => {
  return BRANDS.find(brand => brand.slug === slug);
};

// Get brand by ID
export const getBrandById = (id) => {
  return BRANDS.find(brand => brand.id === id);
};

export default BRANDS;
