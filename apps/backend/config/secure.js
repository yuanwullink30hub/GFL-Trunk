/**
 * Fail closed: in production, an insecure configuration refuses to run instead of running insecurely.
 *
 * Before this, missing secrets degraded silently. JWT_SECRET fell back to 'dev-secret-change-me', which
 * would let anyone mint a session for any account; an unset ENCRYPTION_KEY turned field encryption into a
 * plaintext pass-through, so emails and names would have been written to the database in the clear.
 * Neither said anything beyond a log line.
 *
 * productionConfigProblems() lists what is wrong; server.js refuses to start in production when the list
 * is not empty. Outside production nothing is enforced, so local development keeps working as before.
 * The values themselves are never logged — only which setting is wrong and why.
 */
const DEV_JWT_SECRETS = new Set(['dev-secret-change-me', 'change-me-to-a-long-random-string']);

/**
 * @param {object} config  the loaded config/index.js
 * @param {object} [env]   process.env
 * @returns {{ fatal: string[], warnings: string[] }}
 */
function productionConfigProblems(config, env = process.env) {
  const fatal = [];
  const warnings = [];

  const jwt = String(env.JWT_SECRET || '');
  if (!jwt) fatal.push('JWT_SECRET is not set — sessions would be signed with a public default and could be forged.');
  else if (DEV_JWT_SECRETS.has(jwt)) fatal.push('JWT_SECRET is a known placeholder value — sessions could be forged.');
  else if (jwt.length < 32) warnings.push(`JWT_SECRET is short (${jwt.length} characters); use at least 32 random characters.`);

  const key = String(env.ENCRYPTION_KEY || '');
  if (!key) {
    fatal.push('ENCRYPTION_KEY is not set — personal data (emails, names) would be stored unencrypted.');
  } else {
    let bytes = 0;
    try { bytes = Buffer.from(key, 'base64').length; } catch { bytes = 0; }
    if (bytes !== 32) fatal.push(`ENCRYPTION_KEY must be 32 bytes, base64-encoded (it decodes to ${bytes}).`);
  }

  if (!/^https:\/\//.test(String(config.apiPublicUrl || ''))) {
    fatal.push('API_PUBLIC_URL must be an https:// URL in production — links sent by email point at it.');
  }

  return { fatal, warnings };
}

module.exports = { productionConfigProblems, DEV_JWT_SECRETS };
