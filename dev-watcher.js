/**
 * GFL Dev Watcher — tracks code editing sessions
 *
 * Watches src/ and backend/ for file changes and logs "edit" activity
 * events to the backend API. Debounced to max 1 event per 60 seconds.
 *
 * Usage:  node dev-watcher.js
 *   (run alongside your dev server)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const API_URL = process.env.GFL_API_URL || 'http://localhost:8080/api';
const DEBOUNCE_MS = 60_000; // 1 event per minute max
const WATCH_DIRS = ['src', 'backend'];

let lastLogged = 0;
let pending = null;

function logEdit(file) {
  const now = Date.now();
  const remaining = DEBOUNCE_MS - (now - lastLogged);

  if (remaining <= 0) {
    sendActivity(file);
  } else if (!pending) {
    // Schedule for when debounce window expires
    pending = setTimeout(() => {
      pending = null;
      sendActivity(file);
    }, remaining);
  }
}

function sendActivity(file) {
  lastLogged = Date.now();
  const rel = path.relative(__dirname, file).replace(/\\/g, '/');
  const body = JSON.stringify({ type: 'edit', message: rel });

  const url = new URL(`${API_URL}/admin/sessions/activity`);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  };

  const mod = url.protocol === 'https:' ? require('https') : http;
  const req = mod.request(options, (res) => {
    res.resume(); // drain
    if (res.statusCode === 200) {
      console.log(`  ✏️  edit logged: ${rel}`);
    }
  });
  req.on('error', () => {}); // silently ignore if backend is down
  req.write(body);
  req.end();
}

// Watch directories recursively
let watchCount = 0;
for (const dir of WATCH_DIRS) {
  const abs = path.join(__dirname, dir);
  if (!fs.existsSync(abs)) continue;

  fs.watch(abs, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    // Ignore non-code files and common noise
    if (/node_modules|\.git|build|\.map$|\.log$/.test(filename)) return;
    if (!/\.(js|jsx|ts|tsx|css|json|html|md)$/.test(filename)) return;

    logEdit(path.join(abs, filename));
  });
  watchCount++;
}

if (watchCount === 0) {
  console.error('No watch directories found. Run from the project root.');
  process.exit(1);
}

console.log(`\n🔍 GFL Dev Watcher active — tracking edits in: ${WATCH_DIRS.join(', ')}`);
console.log(`   Logging to: ${API_URL}`);
console.log(`   Debounce: ${DEBOUNCE_MS / 1000}s\n`);
