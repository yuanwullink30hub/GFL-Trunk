/**
 * The Gardens search's filter options (GeneralBrandPage UnitSearch; owner, 14 Oct).
 *
 * NICHES     every niche branch a brand can choose (a brand stores the key in `niche`)
 * COUNTRIES  the countries a brand can be in (a brand stores the code in `country`); municipalities are not a
 *            fixed list here — the location filter lists the municipalities brands actually fill in
 * PRICE      the cost slider's scale in euros; the top of the scale means "and up"
 */

export const NICHES = [
  { key: 'retail', nl: 'Retail', en: 'Retail' },
  { key: 'detailhandel', nl: 'Detailhandel', en: 'Retail trade' },
  { key: 'groothandel', nl: 'Groothandel', en: 'Wholesale' },
  { key: 'logistiek', nl: 'Logistiek', en: 'Logistics' },
  { key: 'mobiliteit', nl: 'Mobiliteit & transport', en: 'Mobility & transport' },
  { key: 'horeca', nl: 'Horeca', en: 'Hospitality' },
  { key: 'voeding', nl: 'Voeding & dranken', en: 'Food & drink' },
  { key: 'landbouw', nl: 'Land- & tuinbouw', en: 'Agriculture & horticulture' },
  { key: 'artiesten', nl: 'Artiesten', en: 'Artists' },
  { key: 'muziek', nl: 'Muziek', en: 'Music' },
  { key: 'kunst', nl: 'Kunst & design', en: 'Art & design' },
  { key: 'fotografie', nl: 'Fotografie & film', en: 'Photography & film' },
  { key: 'ambacht', nl: 'Ambacht', en: 'Crafts' },
  { key: 'mode', nl: 'Mode & textiel', en: 'Fashion & textiles' },
  { key: 'beauty', nl: 'Beauty & verzorging', en: 'Beauty & care' },
  { key: 'gezondheid', nl: 'Gezondheid & welzijn', en: 'Health & wellbeing' },
  { key: 'zorg', nl: 'Zorg', en: 'Care' },
  { key: 'sport', nl: 'Sport & fitness', en: 'Sport & fitness' },
  { key: 'coaching', nl: 'Coaching & persoonlijke ontwikkeling', en: 'Coaching & personal growth' },
  { key: 'spiritualiteit', nl: 'Spiritualiteit', en: 'Spirituality' },
  { key: 'onderwijs', nl: 'Onderwijs & training', en: 'Education & training' },
  { key: 'consultancy', nl: 'Advies & consultancy', en: 'Advice & consultancy' },
  { key: 'financien', nl: 'Financiën & verzekeringen', en: 'Finance & insurance' },
  { key: 'juridisch', nl: 'Juridisch', en: 'Legal' },
  { key: 'media', nl: 'Marketing & media', en: 'Marketing & media' },
  { key: 'it', nl: 'IT & software', en: 'IT & software' },
  { key: 'techniek', nl: 'Techniek & industrie', en: 'Engineering & industry' },
  { key: 'bouw', nl: 'Bouw & installatie', en: 'Construction & installation' },
  { key: 'vastgoed', nl: 'Vastgoed & wonen', en: 'Real estate & living' },
  { key: 'interieur', nl: 'Interieur', en: 'Interior' },
  { key: 'duurzaam', nl: 'Duurzaamheid & energie', en: 'Sustainability & energy' },
  { key: 'evenementen', nl: 'Evenementen', en: 'Events' },
  { key: 'toerisme', nl: 'Toerisme & recreatie', en: 'Tourism & leisure' },
  { key: 'dieren', nl: 'Dieren & huisdieren', en: 'Animals & pets' },
  { key: 'nonprofit', nl: 'Non-profit & goede doelen', en: 'Non-profit & charity' },
];

export const COUNTRIES = [
  { code: 'NL', nl: 'Nederland', en: 'Netherlands' },
  { code: 'BE', nl: 'België', en: 'Belgium' },
  { code: 'DE', nl: 'Duitsland', en: 'Germany' },
  { code: 'LU', nl: 'Luxemburg', en: 'Luxembourg' },
  { code: 'FR', nl: 'Frankrijk', en: 'France' },
  { code: 'GB', nl: 'Verenigd Koninkrijk', en: 'United Kingdom' },
  { code: 'IE', nl: 'Ierland', en: 'Ireland' },
  { code: 'ES', nl: 'Spanje', en: 'Spain' },
  { code: 'PT', nl: 'Portugal', en: 'Portugal' },
  { code: 'IT', nl: 'Italië', en: 'Italy' },
  { code: 'AT', nl: 'Oostenrijk', en: 'Austria' },
  { code: 'CH', nl: 'Zwitserland', en: 'Switzerland' },
  { code: 'DK', nl: 'Denemarken', en: 'Denmark' },
  { code: 'SE', nl: 'Zweden', en: 'Sweden' },
  { code: 'NO', nl: 'Noorwegen', en: 'Norway' },
  { code: 'FI', nl: 'Finland', en: 'Finland' },
  { code: 'PL', nl: 'Polen', en: 'Poland' },
  { code: 'US', nl: 'Verenigde Staten', en: 'United States' },
  { code: 'CA', nl: 'Canada', en: 'Canada' },
];

export const PRICE = { min: 0, max: 2500, step: 25 };
