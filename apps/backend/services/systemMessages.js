/**
 * System messages — Berichten from Garden for Life itself (not from another user).
 *
 * Stored in the normal `messages` collection with fromUserId 'system', a `kind` (the client words
 * known kinds from i18n, in the reader's language; title/body are the Dutch fallback, encrypted
 * like any message) and an optional `action` the inbox renders as a button.
 * Each kind lands at most once per user.
 */
const { getDB } = require('../db');
const { encrypt } = require('./encryption');

const SYSTEM_SENDER = 'system';

const KINDS = {
  // First message of every new account: guides the user to Profiel → Werkruimte, where the private
  // folder (desktop app) is set up — the tools stay locked until it is.
  'welcome-workspace': {
    title: 'Welkom — richt eerst je privé-map in',
    // Same text as i18n shell.desktop.systemMessages['welcome-workspace'] (the client words it from there).
    body: 'Welkom Tuinierder,\n\n'
      + "Zoals eerder vermeld slaan wij zo min mogelijk privé-data van jou op, om gebruik te maken van het volledige platform en al haar programma's moet je eerst een werkmap downloaden.\n"
      + 'Zonder deze map werken de meeste modellen niet — het is heel simpel, klik de knop onderaan het bericht, lees de instructies in de werkruimte en download de software.\n\n'
      + 'Wij hebben het volste vertrouwen dat je de weg tussen de sterren snel hebt gevonden, is de nebulae te dik? raadpleeg dan de FAQ of reik uit naar een moderator in het netwerk.\n\n\n'
      + "— Voluntas Amor, Elefthéros Fati",
    action: { type: 'workspace' },
  },
};

const messagesCol = () => getDB().collection('messages');

/**
 * Put system message `kind` in the user's inbox (no-op when it is already there).
 * Never throws: a failed welcome message must not fail the action that triggered it.
 */
async function sendSystemMessage(userId, kind) {
  const def = KINDS[kind];
  if (!def || !userId) return false;
  try {
    const now = new Date();
    const r = await messagesCol().updateOne(
      { toUserId: String(userId), fromUserId: SYSTEM_SENDER, kind },
      {
        $setOnInsert: {
          toUserId: String(userId),
          fromUserId: SYSTEM_SENDER,
          kind,
          title: encrypt(def.title),
          body: encrypt(def.body),
          ...(def.action ? { action: def.action } : {}),
          at: now,
          read: false,
        },
      },
      { upsert: true },
    );
    return r.upsertedCount === 1;
  } catch (e) {
    console.warn(`[systemMessages] ${kind} failed:`, e.message);
    return false;
  }
}

module.exports = { sendSystemMessage, SYSTEM_SENDER, SYSTEM_KINDS: Object.keys(KINDS) };
