/**
 * getReadingThumb — the reading-chip render interface (OD-6, OPEN — do not resolve implicitly).
 *
 * Each individuatiepad chip needs a mini-orb render. The backend question — (a) persist
 * rendered thumbnails per reading vs (b) persist configuration vectors and re-render on
 * demand — is unresolved (interacts with OD-3). Chips are therefore built against THIS
 * interface only; either backend resolution changes this file and nothing else.
 *
 * Current resolution order (from the opaque `orbRenderRef` inside the payload):
 *   1. stored thumbnail image (data-URL, captured client-side at snapshot time)
 *   2. render-only orb config (chip renders a static mini OrbSphere3D)
 *   3. null → chip renders an empty crystal slot
 *
 * @param {{ readingId: string, orbRenderRef?: { image?: string|null, orb?: object|null } }} reading
 * @returns {{ kind: 'image'|'orb'|'empty', image: string|null, orb: object|null }}
 */
export function getReadingThumb(reading) {
  const ref = reading?.orbRenderRef || {};
  if (ref.image) return { kind: 'image', image: ref.image, orb: null };
  if (ref.orb) return { kind: 'orb', image: null, orb: ref.orb };
  return { kind: 'empty', image: null, orb: null };
}
