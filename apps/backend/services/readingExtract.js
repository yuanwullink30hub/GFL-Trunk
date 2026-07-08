/**
 * Reading extraction — pulls the ALLOWLISTED card fields out of a report's text
 * (profile_card_extraction_spec.md §2.1). One extraction, allowlist-only; the caller
 * discards the source text afterwards and this module never logs or returns raw text.
 *
 * Parsed from the report's machine-readable PROFIEL DATA block:
 *   -- IDENTITEIT --
 *   Main:    De Rebel (6) | Groep: CHAOS | ...
 *   Support: De Heerser (12) | Groep: RULING
 *   -- SCORES (12-PUNTS WIEL) --
 *   Judge(1): 100 (Core: 57 | Bleed: 43)  …  Ruler(12): 102 (…)
 *
 * shapeVector12: the 12 wheel scores in wheel order (position 1 = Judge … 12 = Ruler),
 * normalized to the profile's own maximum (top archetype = 1.0), 3 decimals. Rendering
 * (the public radar) is SHAPE-ONLY per OD-1 — the raw totals never leave this function.
 */

// Wheel order is fixed by the model: position n = WHEEL[n-1].
const WHEEL = ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'];

function cleanName(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/** Extract the reading fields from raw report text. Returns null when nothing usable found. */
function extractReading(text) {
  const t = String(text || '');
  // Names tolerate PDF-extraction whitespace anywhere; stop at '(' (the wheel position).
  const main = t.match(/Main:\s*([^|(\n]+?)\s*\(\s*\d{1,2}\s*\)/);
  const support = t.match(/Support:\s*([^|(\n]+?)\s*\(\s*\d{1,2}\s*\)/);

  const raw = WHEEL.map((name, i) => {
    const m = t.match(new RegExp(`${name}\\s*\\(\\s*${i + 1}\\s*\\)\\s*:\\s*(\\d{1,4})`));
    return m ? Number(m[1]) : null;
  });
  let shapeVector12 = null;
  if (raw.every((v) => v != null)) {
    const max = Math.max(...raw);
    if (max > 0) shapeVector12 = raw.map((v) => Math.round((v / max) * 1000) / 1000);
  }

  // 5-mandje decomposition (owner-side wheel colours): per archetype the raw basket values
  //   Judge: nat_core 57 | green 21 | cult_core 0 | blue 14 | yellow 5 | purple 3
  // → baskets12[i] = [nat, green, cult, blue, yellow, purple] in wheel order.
  // NOTE: contribution vectors are DENIED on the public card (§3) — these travel to the
  // OWNER only (GET /me), never into buildCardPayload.
  const baskets = WHEEL.map((name) => {
    const m = t.match(new RegExp(
      `${name}:\\s*nat_core\\s*(\\d{1,4})\\s*\\|\\s*green\\s*(\\d{1,4})\\s*\\|\\s*cult_core\\s*(\\d{1,4})\\s*\\|\\s*blue\\s*(\\d{1,4})\\s*\\|\\s*yellow\\s*(\\d{1,4})\\s*\\|\\s*purple\\s*(\\d{1,4})`
    ));
    return m ? [1, 2, 3, 4, 5, 6].map((g) => Number(m[g])) : null;
  });
  const baskets12 = baskets.every((b) => b != null) ? baskets : null;

  // Per-profile texts from the EXTENDED ARCHETYPE PROFIEL block — the reading's own
  // levensles (the page-1 quote), gift and curse. These fill the card's tendens line and
  // expressieprofiel body until the twelve authored text pairs land (which then win).
  // NOTE: curse/trigger is extracted but kept OFF the public card (§3 denies triggers);
  // it's stored for owner-side surfaces only.
  const cleanText = (s, max) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const gift = t.match(/Gift:\s*([^\n]+)/);
  const curse = t.match(/Curse\s*\/\s*Trigger:\s*([^\n]+)/);
  const levensles = t.match(/Levensles:\s*"([^"]+)"/);

  // AI-authored card fields (KAART MICROCOPY block) — base64-marked like ORB::/ARCH::
  // so they survive PDF text-layer line wrapping. giftMicro = in-depth gift description;
  // geomSummary = geometry summary in canon language.
  const strippedT = t.replace(/\s+/g, '');
  const b64utf8 = (b) => { try { return Buffer.from(b, 'base64').toString('utf8'); } catch { return ''; } };
  const giftMicroM = strippedT.match(/CGIFT::([A-Za-z0-9+/=]+)::CGIFT/);
  const geomM = strippedT.match(/CGEO::([A-Za-z0-9+/=]+)::CGEO/);

  const out = {};
  if (main) out.archetypeMainId = cleanName(main[1]);
  if (support) out.archetypeSupportId = cleanName(support[1]);
  if (shapeVector12) out.shapeVector12 = shapeVector12;
  if (baskets12) out.baskets12 = baskets12;
  if (levensles) out.levensles = cleanText(levensles[1], 600);
  if (gift) out.gift = cleanText(gift[1], 300);
  if (curse) out.curse = cleanText(curse[1], 300);
  if (giftMicroM) { const v = cleanText(b64utf8(giftMicroM[1]), 800); if (v) out.giftMicro = v; }
  if (geomM) { const v = cleanText(b64utf8(geomM[1]), 1500); if (v) out.geomSummary = v; }
  return Object.keys(out).length ? out : null;
}

/** Clamp a client-supplied reading object down to the allowlist — never trust wire input. */
function sanitizeReading(r) {
  if (!r || typeof r !== 'object') return null;
  const out = {};
  if (r.archetypeMainId) out.archetypeMainId = cleanName(r.archetypeMainId);
  if (r.archetypeSupportId) out.archetypeSupportId = cleanName(r.archetypeSupportId);
  if (Array.isArray(r.shapeVector12) && r.shapeVector12.length === 12) {
    const v = r.shapeVector12.map((x) => Number(x));
    if (v.every((x) => Number.isFinite(x) && x >= 0 && x <= 1)) {
      out.shapeVector12 = v.map((x) => Math.round(x * 1000) / 1000);
    }
  }
  if (Array.isArray(r.baskets12) && r.baskets12.length === 12) {
    const b = r.baskets12.map((row) => (Array.isArray(row) && row.length === 6 ? row.map(Number) : null));
    if (b.every((row) => row && row.every((x) => Number.isFinite(x) && x >= 0 && x <= 1000))) {
      out.baskets12 = b;
    }
  }
  const cleanText = (s, max) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
  if (r.levensles) out.levensles = cleanText(r.levensles, 600);
  if (r.gift) out.gift = cleanText(r.gift, 300);
  if (r.curse) out.curse = cleanText(r.curse, 300);
  if (r.giftMicro) out.giftMicro = cleanText(r.giftMicro, 800);
  if (r.geomSummary) out.geomSummary = cleanText(r.geomSummary, 1500);
  return Object.keys(out).length ? out : null;
}

/**
 * Kaart Microcopy — server-side extraction at GENERATION time (ai.js).
 * Pulls KAART_GIFT / KAART_GEOMETRIE out of the model's analysis and returns the
 * analysis with the section REMOVED, so the result card / report PDF never see it.
 * The fields are stashed keyed by the orb code's hash and merged into the reading's
 * orbHistory entry when the code is claimed (register / orb-link).
 */
function extractKaartSection(text) {
  const t = String(text || '');
  // Label delimiter is tolerant ( : or — / – / - ): the master prompt itself writes
  // "KAART_GEOMETRIE — [...]" and the model follows it literally — a colon-only match
  // let the gift capture swallow the geometry label + a truncated tail.
  const gift = t.match(/KAART_GIFT\s*[:—–-]\s*([\s\S]*?)(?=\s*KAART_GEOMETRIE\s*[:—–-]|\n#{2,3}\s|$)/);
  const geo = t.match(/KAART_GEOMETRIE\s*[:—–-]\s*([\s\S]*?)(?=\n#{2,3}\s|$)/);
  const clean = (m, max) => (m ? m[1].replace(/\s+/g, ' ').replace(/^\[|\]$/g, '').trim().slice(0, max) : '');
  const cleaned = t
    .replace(/^#{2,3}\s*(?:\d+[A-Za-z]?\.\s*)?kaart\s*microcopy\s*$[\s\S]*?(?=\n#{2,3}\s|$)/gim, '')
    .replace(/^\s*KAART_GIFT\s*[:—–-]\s*[\s\S]*?(?=\s*KAART_GEOMETRIE\s*[:—–-]|\n#{2,3}\s|$)/gim, '')
    .replace(/^\s*KAART_GEOMETRIE\s*[:—–-]\s*[\s\S]*?(?=\n#{2,3}\s|$)/gim, '');
  return { giftMicro: clean(gift, 800), geomSummary: clean(geo, 1500), cleaned };
}

module.exports = { extractReading, sanitizeReading, extractKaartSection, WHEEL };
