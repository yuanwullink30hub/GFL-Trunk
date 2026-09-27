/**
 * Test harness for the security tests. Every test file gets its OWN in-memory mongod and its own
 * config — nothing here can reach the production database, because MONGODB_URI is overwritten with the
 * in-memory server's address before config/index.js is first required.
 *
 * Usage (at the very top of a test file, before requiring anything from the backend):
 *   const h = require('./helpers');
 *   before(h.start); after(h.stop);
 */
const path = require('path');

// The real apps/backend/.env holds production credentials (the database, Stripe, the model API). dotenv
// never overrides a variable that is already set, but anything NOT pinned below would still load from it —
// so dotenv is switched off for the test process entirely. require() hands config/index.js this same
// module object, so its `require('dotenv').config()` becomes a no-op.
require('dotenv').config = () => ({ parsed: {} });
for (const k of Object.keys(process.env)) {
  if (/^(STRIPE_|ANTHROPIC_|OPENAI_|GROK_|SMTP_|MONGODB_|EDGE_SECRET|API_PUBLIC_URL|PAYMENTS_)/.test(k)) delete process.env[k];
}

// Config is read once, at first require. Pin a safe test environment before anything loads it.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-tests-0123456789';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
// dotenv never overrides a variable that is already set, so the real .env cannot leak in.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/unset-until-start';

let mongod;
const servers = [];

async function start() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('gfl-test');
  // config/index.js may already be cached by a require above — point it at the in-memory server too.
  require('../config').mongoUri = process.env.MONGODB_URI;
  await require('../db').connectDB();
}

async function stop() {
  for (const s of servers) { s.closeAllConnections?.(); await new Promise((r) => s.close(r)); }
  await require('../db').closeDB().catch(() => {});
  if (mongod) await mongod.stop();
}

/** Mount routers on a fresh express app and listen on an ephemeral port. Returns the base URL. */
async function serve(mounts, { jsonLimit = '1mb' } = {}) {
  const express = require('express');
  const app = express();
  app.use(express.json({ limit: jsonLimit }));
  for (const [at, router] of mounts) app.use(at, router);
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

/** POST JSON; returns { status, body }. */
async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body || {}),
  });
  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body: json, headers: res.headers };
}

module.exports = { start, stop, serve, post, root: path.resolve(__dirname, '..') };
