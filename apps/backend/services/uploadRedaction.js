/**
 * Upload redaction — strips who a user-uploaded personality report belongs to before anything
 * reads it (human ruling 2026-09-16: "always leave out names before we parse the uploaded pdf").
 *
 * The report is decoupled from the person: the model, the OCEAN parser and the server logs only
 * ever see the scrubbed text under a neutral file label. What is removed:
 *   - names in labelled places ("Naam: …", "Report for …", "Resultaten van …", "Beste …,",
 *     "John's results") — and every later occurrence of those name words anywhere in the text;
 *   - e-mail addresses, phone numbers, Dutch postcodes, birth dates.
 * Scores, dimension and facet names and the prose about them are left intact.
 */

const NAME_TOKEN = String.raw`\p{Lu}[\p{L}'’-]*`;
const PARTICLE = String.raw`(?:van|de|der|den|het|ter|ten|te|von|zu|di|da|du|le|la|el|al|bin|ben|'t|’t)`;
// 1–4 capitalised words with optional lowercase particles in between ("Jan van der Berg").
const NAME = String.raw`${NAME_TOKEN}(?:[ \t]+(?:${PARTICLE}[ \t]+)*${NAME_TOKEN}){0,3}`;

// Words that are never a name, so "Report for Big Five" or "Profile of Achievement Striving" stay whole.
const NOT_A_NAME = new Set([
  'big', 'five', 'ocean', 'test', 'tests', 'report', 'rapport', 'results', 'result', 'resultaat', 'resultaten',
  'profile', 'profiel', 'personality', 'persoonlijkheid', 'persoonlijkheidstest', 'persoonlijkheidsrapport',
  'openness', 'openheid', 'conscientiousness', 'consciëntieusheid', 'conscientieusheid', 'ordelijkheid',
  'extraversion', 'extraversie', 'agreeableness', 'meegaandheid', 'neuroticism', 'neuroticisme',
  'emotional', 'stability', 'emotionele', 'stabiliteit', 'experience', 'ervaring', 'ervaringen', 'voor', 'for',
  'the', 'de', 'het', 'een', 'a', 'an', 'your', 'jouw', 'uw', 'you', 'je', 'u', 'all', 'alle', 'score', 'scores',
  'facet', 'facets', 'facetten', 'dimension', 'dimensions', 'dimensies', 'trait', 'traits', 'eigenschappen',
  'hoog', 'laag', 'gemiddeld', 'high', 'low', 'average', 'date', 'datum', 'page', 'pagina', 'summary', 'samenvatting',
  // Big Five facets (NEO-PI-R / IPIP-NEO, EN + NL)
  'fantasy', 'aesthetics', 'feelings', 'actions', 'ideas', 'values', 'trust', 'straightforwardness', 'altruism',
  'compliance', 'modesty', 'tender-mindedness', 'competence', 'order', 'dutifulness', 'achievement', 'striving',
  'self-discipline', 'deliberation', 'warmth', 'gregariousness', 'assertiveness', 'activity', 'excitement',
  'seeking', 'excitement-seeking', 'positive', 'emotions', 'anxiety', 'angry', 'hostility', 'depression',
  'self-consciousness', 'impulsiveness', 'vulnerability', 'imagination', 'artistic', 'interests', 'emotionality',
  'adventurousness', 'intellect', 'liberalism', 'self-efficacy', 'orderliness', 'cautiousness', 'friendliness',
  'cheerfulness', 'morality', 'cooperation', 'sympathy', 'anger', 'immoderation', 'level', 'activity-level',
  'fantasie', 'esthetiek', 'gevoelens', 'handelingen', 'ideeën', 'waarden', 'vertrouwen', 'oprechtheid',
  'altruïsme', 'inschikkelijkheid', 'bescheidenheid', 'competentie', 'orde', 'plichtsbetrouwbaarheid',
  'prestatiestreven', 'zelfdiscipline', 'bedachtzaamheid', 'hartelijkheid', 'sociabiliteit', 'assertiviteit',
  'activiteit', 'avonturisme', 'vrolijkheid', 'angst', 'ergernis', 'depressie', 'schaamte', 'impulsiviteit',
  'kwetsbaarheid', 'verbeelding', 'emotionaliteit', 'zelfbewustzijn', 'vriendelijkheid', 'samenwerking', 'moraliteit',
]);

// A label followed by the name ("Naam: Jan Jansen").
const LABELS = [
  String.raw`(?:volledige[ \t]+)?naam`, 'voornaam', 'achternaam',
  String.raw`(?:full[ \t]+|first[ \t]+|last[ \t]+|given[ \t]+|family[ \t]+)?name`,
  'kandidaat', 'candidate', 'deelnemer', 'participant', 'respondent', String.raw`cli[eë]nt`,
  String.raw`test[ \t]*taker`, 'medewerker', 'employee',
];
// A phrase that leads straight into the name ("Report for Jan Jansen", "Beste Jan,").
const LEAD_INS = [
  String.raw`(?:prepared|created|generated|made|written)[ \t]+for`,
  String.raw`(?:report|results?|profile|scores?)[ \t]+(?:for|of)`,
  String.raw`(?:opgesteld|gemaakt|gegenereerd|samengesteld)[ \t]+voor`,
  String.raw`(?:rapport|rapportage|resultaten|resultaat|profiel|scores?|uitslag)[ \t]+(?:voor|van)`,
  String.raw`persoonlijkheids(?:profiel|rapport)[ \t]+van`,
  '(?:beste|geachte|hallo|hoi|dear|hello|hi|hey|welkom|welcome)',
];
const RESULT_WORDS = String.raw`big[ \t]+five|personality|results?|report|profile|scores?|resultaten|rapport|profiel|persoonlijkheid`;

/**
 * Case-insensitive version of a regex source, without the `i` flag and without inline modifiers
 * ((?i:…) needs Node 23+; production runs Node 22). Every letter outside an escape becomes a class
 * of both cases; letters inside an existing class get their other case added.
 */
function anyCase(src) {
  let out = '';
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '\\') { out += ch + (src[i + 1] || ''); i += 1; continue; }
    if (ch === '[') {
      let j = i + 1; let cls = '';
      while (j < src.length && src[j] !== ']') {
        if (src[j] === '\\') { cls += src[j] + (src[j + 1] || ''); j += 2; continue; }
        const c = src[j]; const u = c.toUpperCase(); const l = c.toLowerCase();
        cls += c + (u !== c ? u : l !== c ? l : '');
        j += 1;
      }
      out += `[${cls}]`; i = j; continue;
    }
    const u = ch.toUpperCase(); const l = ch.toLowerCase();
    out += u !== l ? `[${l}${u}]` : ch;
  }
  return out;
}

// Labels, lead-ins and result words match in any case; the name itself must be capitalised.
const LABEL_RE = new RegExp(String.raw`(^|\n)([ \t]*(?:${anyCase(LABELS.join('|'))})[ \t]*[:：\-–—][ \t]*)(${NAME})`, 'gu');
const LEAD_IN_RE = new RegExp(String.raw`(?<!\p{L})((?:${anyCase(LEAD_INS.join('|'))}))([ \t,:]+)(${NAME})`, 'gu');
const POSSESSIVE_RE = new RegExp(String.raw`(${NAME})['’]s?(?=[ \t]+(?:${anyCase(RESULT_WORDS)}))`, 'gu');
const LEAD_WORD_RE = new RegExp(String.raw`^(?:${LEAD_INS.join('|')})$`, 'iu');

const EMAIL_RE = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
const PHONE_RE = /(?<![\p{N}.,])(?:\+|00)?\d(?:[ .()-]{0,2}\d){8,13}(?!\p{N})/gu;
const POSTCODE_RE = /\b[1-9]\d{3}[ \t]?[A-Z]{2}\b/g;
const BIRTH_RE = /((?:geboortedatum|geboren(?:[ \t]+op)?|date[ \t]+of[ \t]+birth|birth[ \t]*date|born(?:[ \t]+on)?|DOB)[ \t]*[:\-–—]?[ \t]*)([^\n]+)/giu;

const NAME_MARK = '[naam]';

function nameWords(candidate) {
  return String(candidate || '')
    .split(/[ \t]+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w.replace(/['’]s$/u, '').replace(/[,.;:!?]+$/u, ''))
    .filter((w) => w.length >= 2 && !NOT_A_NAME.has(w.toLowerCase()) && !LEAD_WORD_RE.test(w));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Scrub one uploaded text. Returns { text, removed } — `removed` counts replacements only
 * (never the removed values), so it is safe to log.
 */
function redactUploadText(input) {
  let text = String(input || '');
  const found = new Set();
  let removed = 0;
  // A candidate counts as a name only when every capitalised word in it is name-like
  // ("Openheid Voor Ervaringen" is not; "Jan Jansen" is).
  const take = (candidate) => {
    const caps = String(candidate).split(/[ \t]+/).filter((w) => /^\p{Lu}/u.test(w));
    const words = nameWords(candidate);
    if (!words.length || words.length !== caps.length) return false;
    words.forEach((w) => found.add(w));
    return true;
  };

  text = text.replace(EMAIL_RE, () => { removed++; return '[e-mail]'; });
  text = text.replace(BIRTH_RE, (_m, label) => { removed++; return `${label}[datum]`; });

  text = text.replace(LABEL_RE, (m, start, label, name) => {
    if (!take(name)) return m;
    removed++;
    return `${start}${label}${NAME_MARK}`;
  });
  text = text.replace(LEAD_IN_RE, (m, lead, gap, name) => {
    if (!take(name)) return m;
    removed++;
    return `${lead}${gap}${NAME_MARK}`;
  });
  text = text.replace(POSSESSIVE_RE, (m, name) => {
    if (!take(name)) return m;
    removed++;
    return NAME_MARK;
  });

  // Every later mention of a found name word, anywhere ("Jan scoort hoog op …").
  for (const word of [...found].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(String.raw`(?<![\p{L}\p{N}])${escapeRe(word)}(?:['’]s)?(?![\p{L}\p{N}])`, 'gu');
    text = text.replace(re, () => { removed++; return NAME_MARK; });
  }
  // "[naam] van der [naam]" from a full name → one mark.
  text = text.replace(new RegExp(String.raw`\[naam\](?:[ \t]+(?:${PARTICLE}[ \t]+)*\[naam\])+`, 'gu'), NAME_MARK);

  text = text.replace(PHONE_RE, (m) => {
    // Score rows ("72 64 88 51 90") are not phone numbers; a phone number starts with + or 0.
    if (!/^(?:\+|0)/.test(m) && /\d{1,3}[ \t]+\d{1,3}[ \t]+\d{1,3}/.test(m)) return m;
    removed++;
    return '[telefoon]';
  });
  text = text.replace(POSTCODE_RE, () => { removed++; return '[postcode]'; });

  return { text, removed };
}

/**
 * The name a file is shown under to the model and in logs — never the user's own file name
 * ("Jan_Jansen_BigFive.pdf" names the person). Extension kept so the reader knows the source kind.
 */
function neutralFileName(originalName, index) {
  const ext = (String(originalName || '').match(/\.([a-z0-9]{1,5})$/i) || [])[1];
  return `Persoonlijkheidsrapport ${index + 1}${ext ? `.${ext.toLowerCase()}` : ''}`;
}

module.exports = { redactUploadText, neutralFileName, NAME_MARK };
