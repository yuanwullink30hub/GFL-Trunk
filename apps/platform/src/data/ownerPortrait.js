/**
 * The owner's portrait on the policy pages (Eyedentity → Profiel): De Ronin, Rebel × Held.
 *
 * Kept apart from ownerProfile.js (the long first-person texts) so App can warm the portrait the moment the
 * landing is ready without pulling those texts into the main bundle: warmOwnerPortrait() fetches and decodes
 * the web copy and holds the decoded image, so a first pan to the page paints it straight from memory.
 */
import { getArchetypeImage } from '@gfl/assessment-core/data/archetypeImages';

// The owner's configuration. This page is one real person's profile, not a reader's, so the variant is
// fixed rather than left to DEFAULT_PORTRAIT_VARIANT ('female' — the neutral default for a reader).
export const OWNER_ARCHETYPES = { main: 'OUTLAW', support: 'HERO', shadow: 'Ruler', blindspot: 'Judge', portraitVariant: 'male' };

export const OWNER_PORTRAIT = getArchetypeImage(OWNER_ARCHETYPES.main, OWNER_ARCHETYPES.support, OWNER_ARCHETYPES.portraitVariant);

let held = null; // the decoded image, kept alive so the browser keeps its decoded pixels

/** Fetch + decode the portrait once; later calls do nothing. */
export function warmOwnerPortrait() {
  if (held || !OWNER_PORTRAIT) return;
  held = new Image();
  held.src = OWNER_PORTRAIT;
  held.decode?.().catch(() => { /* the <img> loads it again if this failed */ });
}
