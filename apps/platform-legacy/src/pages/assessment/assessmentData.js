/**
 * Garden for Life — Assessment Data (Level: Leerling — Neurobiological Edition)
 *
 * 36 questions × 6 answers × 2 picks = 72 datapunten
 * 5 subjects: Zelf/Zonde (Q1-Q9), Ander/Attentie (Q10-Q18),
 *             Massa/Macht (Q19-Q24), Wereld/Wijsheid (Q25-Q30),
 *             Mysterie/Magie (Q31-Q36)
 *
 * ─── Neuraal Schakelbord v3 — 6 Numbered Rotation Keys (1-6) ───
 *
 * Archetype Nummering (1-12 op het wiel):
 *   1=Judge(G1)  2=Lover(G2)  3=Caregiver(G2)  4=Innocent(G3)
 *   5=Explorer(G3)  6=Outlaw(G4)  7=Trickster(G4)  8=Sage(G5)
 *   9=Artist(G5)  10=Magician(G6)  11=Hero(G6)  12=Ruler(G1)
 *
 * 6 Rotation Keys (Slot A→F per key):
 *   Key 1: Judge(1), Trickster(7), Lover(2),     Sage(8),      Innocent(4),  Hero(11)
 *   Key 2: Explorer(5), Artist(9), Judge(1),      Trickster(7), Lover(2),     Magician(10)
 *   Key 3: Caregiver(3), Hero(11), Innocent(4),   Artist(9),    Judge(1),     Trickster(7)
 *   Key 4: Lover(2), Ruler(12),    Explorer(5),   Hero(11),     Outlaw(6),    Sage(8)
 *   Key 5: Innocent(4), Magician(10), Outlaw(6),  Ruler(12),    Caregiver(3), Artist(9)
 *   Key 6: Outlaw(6), Sage(8),     Caregiver(3),  Magician(10), Explorer(5),  Ruler(12)
 *
 * N/C Routing (PER SLOT, not per question):
 *   Standard (S): Slot A,C,E = Nature; Slot B,D,F = Culture
 *   Mirror   (M): Slot A,C,E = Culture; Slot B,D,F = Nature
 *
 * Mode per question follows 36Q rotation matrix:
 *   Block 0 (Q1-Q6):   S,M,S,M,S,M    Block 3 (Q19-Q24): M,S,M,S,M,S
 *   Block 1 (Q7-Q12):  M,S,M,S,M,S    Block 4 (Q25-Q30): S,M,S,M,S,M
 *   Block 2 (Q13-Q18): S,M,S,M,S,M    Block 5 (Q31-Q36): M,S,M,S,M,S
 *
 * Dual-Pick scoring per question (1st = Identity, 2nd = Navigation):
 *   Core: 1st pick +9(Nature)/+7(Culture), 2nd pick +6(Nature)/+4(Culture)
 *   Shadow Drip: 1st pick + Nature slot only → +1 to 180° partner
 *   Relations (between pick 1 & pick 2): Green +4, Blue +3, Purple +5, Yellow +2×2, Red +1
 *
 * Beheersing Counter: +7 per question where both picks share a bio group (Green+Blue)
 * Harmony Counter: +5 per question where picks are 180° shadow opposites (Purple)
 * Frictie Counter: +1 per question where picks are Red Line pairs
 *
 * Symmetrie: each archetype has exactly 9 Nature + 9 Culture appearances = 50/50
 */

// ──────── 6 Rotation Keys (Neuraal Schakelbord v3) ────────
// Each key maps slots A-F (positions 0-5) to archetypes.
// Keys cycle 1→2→3→4→5→6 per block of 6 questions.
const ROTATION_KEYS = {
  1: ['JUDGE', 'TRICKSTER', 'LOVER', 'SAGE', 'INNOCENT', 'HERO'],
  2: ['EXPLORER', 'ARTIST', 'JUDGE', 'TRICKSTER', 'LOVER', 'MAGICIAN'],
  3: ['CAREGIVER', 'HERO', 'INNOCENT', 'ARTIST', 'JUDGE', 'TRICKSTER'],
  4: ['LOVER', 'RULER', 'EXPLORER', 'HERO', 'OUTLAW', 'SAGE'],
  5: ['INNOCENT', 'MAGICIAN', 'OUTLAW', 'RULER', 'CAREGIVER', 'ARTIST'],
  6: ['OUTLAW', 'SAGE', 'CAREGIVER', 'MAGICIAN', 'EXPLORER', 'RULER'],
};

/**
 * Get the rotation key number (1-6) for a given question number (1-based).
 * Keys cycle 1→2→3→4→5→6 repeatedly across all 36 questions.
 */
function getKeyForQuestion(questionNum) {
  return ((questionNum - 1) % 6) + 1;
}

/**
 * Get the Standard/Mirror mode for a given question number (1-based).
 * Based on a 2-factor pattern: block parity × position parity.
 *   Even blocks (0,2,4): even positions = Standard, odd = Mirror
 *   Odd  blocks (1,3,5): even positions = Mirror,   odd = Standard
 *
 * @returns {boolean} true = Standard, false = Mirror
 */
function isStandardMode(questionNum) {
  const block = Math.floor((questionNum - 1) / 6);
  const posInBlock = (questionNum - 1) % 6;
  return (posInBlock % 2) === (block % 2);
}

/**
 * Determine N/C routing for a specific answer SLOT within a question.
 * Standard: even slots (A=0, C=2, E=4) → Nature, odd slots (B=1, D=3, F=5) → Culture
 * Mirror:   reversed — even slots → Culture, odd slots → Nature
 *
 * @param {number} questionNum - 1-based question number
 * @param {number} slotPos     - 0-based answer slot position (0=A, 1=B, ..., 5=F)
 * @returns {boolean} true if this slot routes to Nature
 */
function isNatureSlot(questionNum, slotPos) {
  const standard = isStandardMode(questionNum);
  const isEvenSlot = slotPos % 2 === 0;
  return standard ? isEvenSlot : !isEvenSlot;
}

/**
 * Get the layer index for a given question number (1-based).
 * Layer 0: Q1-Q9, Layer 1: Q10-Q18, Layer 2: Q19-Q24,
 * Layer 3: Q25-Q30, Layer 4: Q31-Q36.
 */
function getLayerForQuestion(questionNum) {
  if (questionNum <= 9) return 0;
  if (questionNum <= 18) return 1;
  if (questionNum <= 24) return 2;
  if (questionNum <= 30) return 3;
  return 4;
}

/**
 * Legacy isNatureRouting — returns Nature status for the QUESTION overall.
 * In the new system, routing is per-slot. This returns Nature for Position 0 (Slot A).
 * @deprecated Use isNatureSlot(questionNum, slotPos) instead.
 */
function isNatureRouting(questionNum) {
  return isNatureSlot(questionNum, 0);
}


/**
 * Archetype rotation metadata � exported for scoring/analysis modules.
 */
export { ROTATION_KEYS, getKeyForQuestion, getLayerForQuestion, isStandardMode, isNatureRouting, isNatureSlot };
