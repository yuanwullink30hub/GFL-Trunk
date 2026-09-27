/**
 * Password policy and hashing cost — one place for registration and password changes.
 *
 *   length      at least MIN_LENGTH characters. The old floor was 6.
 *   strength    zxcvbn score >= MIN_SCORE, with the English and Dutch dictionaries (the users are Dutch:
 *               "wachtwoord1" and "amsterdam123" are caught), and the person's own details plus the
 *               site's name as inputs a password may not lean on. Scored locally: nothing about the
 *               password leaves the server. A breach-corpus lookup (e.g. HIBP) was the alternative; it
 *               is a third-party call on every registration, which the privacy policy does not cover.
 *   bcrypt cap  at most MAX_BYTES bytes. bcrypt silently ignores everything past 72 bytes, so a longer
 *               password would be accepted but only partly checked — refused instead, with a reason.
 *
 * BCRYPT_COST is 12 (was 10). Existing hashes keep verifying — the cost is stored in each hash — and a
 * login with an older, cheaper hash upgrades it (needsRehash).
 */
const { ZxcvbnFactory } = require('@zxcvbn-ts/core');
const common = require('@zxcvbn-ts/language-common');
const nlBe = require('@zxcvbn-ts/language-nl-be');

const MIN_LENGTH = 10;
const MIN_SCORE = 3;
const MAX_BYTES = 72;
const BCRYPT_COST = 12;
const SITE_WORDS = ['gardenforlife', 'garden for life', 'garden', 'deltawerken', 'eyedentity'];

let checker = null;
function zxcvbn() {
  if (!checker) {
    checker = new ZxcvbnFactory({
      dictionary: { ...common.dictionary, ...nlBe.dictionary },
      graphs: common.adjacencyGraphs,
    });
  }
  return checker;
}

/**
 * @param {string} password
 * @param {string[]} [personal] the person's email, display name… (things a password must not be built on)
 * @returns {null | { code: string, message: string }} null when acceptable
 */
function checkPassword(password, personal = []) {
  const pw = String(password || '');
  if ([...pw].length < MIN_LENGTH) {
    return { code: 'too_short', message: `Kies een wachtwoord van minstens ${MIN_LENGTH} tekens.` };
  }
  if (Buffer.byteLength(pw, 'utf8') > MAX_BYTES) {
    return { code: 'too_long', message: `Kies een wachtwoord van hoogstens ${MAX_BYTES} tekens (minder als je veel speciale tekens gebruikt).` };
  }
  const inputs = [...SITE_WORDS];
  for (const p of personal) {
    const s = String(p || '').trim().toLowerCase();
    if (!s) continue;
    inputs.push(s);
    if (s.includes('@')) inputs.push(s.split('@')[0]); // the part people reuse
  }
  const { score } = zxcvbn().check(pw, inputs);
  if (score < MIN_SCORE) {
    return {
      code: 'too_weak',
      message: 'Dit wachtwoord is te makkelijk te raden. Gebruik een langere zin of een mix die niet op een woord, naam of jaartal lijkt.',
    };
  }
  return null;
}

/** True when a stored bcrypt hash was made with a lower cost than today's. */
function needsRehash(storedHash) {
  const m = /^\$2[aby]\$(\d{2})\$/.exec(String(storedHash || ''));
  return !!m && Number(m[1]) < BCRYPT_COST;
}

module.exports = { checkPassword, needsRehash, BCRYPT_COST, MIN_LENGTH, MIN_SCORE, MAX_BYTES };
