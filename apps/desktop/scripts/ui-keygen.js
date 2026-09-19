/**
 * Create the Ed25519 key pair that signs the app's UI builds (see src/uiBundle.js).
 *
 *   node scripts/ui-keygen.js            → private key to ~/.gfl/ui-signing-key.pem, public key into src/uiKey.js
 *   node scripts/ui-keygen.js --out <f>  → the private key to <f> instead
 *   --force                              → replace an existing private key (every installed app keeps trusting
 *                                          only the OLD public key until it gets an app update — rotate with care)
 *
 * The private key never goes into the repository. Keep a backup somewhere safe: without it, no new UI can
 * reach installed apps until an app update pins a new public key. For automatic publishing, store the file's
 * content as the GitHub secret GFL_UI_SIGNING_KEY.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const outArg = process.argv.indexOf('--out');
const OUT = outArg >= 0 ? path.resolve(process.argv[outArg + 1]) : path.join(os.homedir(), '.gfl', 'ui-signing-key.pem');
const KEY_MODULE = path.join(__dirname, '..', 'src', 'uiKey.js');

if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
  console.error(`✘ ${OUT} already exists. Refusing to replace a signing key (add --force if you really mean to rotate it).`);
  process.exit(1);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });

const pub = publicKey.export({ type: 'spki', format: 'pem' }).trim();
fs.writeFileSync(KEY_MODULE, `/**
 * The public half of the key that signs the app's UI builds (scripts/ui-keygen.js). A downloaded UI build
 * runs only when its manifest verifies against this key (uiBundle.js). The private half stays with the
 * publisher — never in this repository.
 */
module.exports = {
  UI_PUBLIC_KEY_PEM: \`${pub}
\`,
};
`);

console.log(`✓ private key → ${OUT}  (back it up; never commit it)`);
console.log(`✓ public key  → ${path.relative(process.cwd(), KEY_MODULE)}`);
