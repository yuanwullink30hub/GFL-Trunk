/**
 * Cloudflare R2 uploads from the backend, over R2's S3-compatible API with AWS Signature V4 — Node's own crypto
 * and fetch, no SDK. Used to publish public files (services/questionsPublisher.js) into the bucket that serves
 * https://downloads.gardenforlife.nl (the installers' bucket).
 *
 * Configuration (Render env; without the three keys nothing is uploaded and `r2Enabled()` is false):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY   an R2 API token, Object Read & Write on the bucket
 *   GFL_R2_BUCKET        default "gfl-downloads"   (same names as scripts/publish-portraits.mjs)
 *   GFL_R2_JURISDICTION  default "eu"
 */

'use strict';

const crypto = require('crypto');

const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data, enc) => crypto.createHmac('sha256', key).update(data).digest(enc);

/**
 * AWS Signature V4 for one request. Returns the Authorization header value.
 * @param {{method:string, path:string, query?:string, headers:Object<string,string>, payloadHash:string,
 *          region:string, service:string, accessKeyId:string, secret:string, amzDate:string}} r
 *   headers: lowercase names → values, all of them signed (include host and x-amz-date)
 */
function sigv4(r) {
  const names = Object.keys(r.headers).sort();
  const canonicalHeaders = names.map((k) => `${k}:${String(r.headers[k]).trim()}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [r.method, r.path, r.query || '', canonicalHeaders, signedHeaders, r.payloadHash].join('\n');
  const date = r.amzDate.slice(0, 8);
  const scope = `${date}/${r.region}/${r.service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', r.amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  let key = hmac(`AWS4${r.secret}`, date);
  key = hmac(key, r.region);
  key = hmac(key, r.service);
  key = hmac(key, 'aws4_request');
  const signature = hmac(key, stringToSign, 'hex');
  return `AWS4-HMAC-SHA256 Credential=${r.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function r2Config(env = process.env) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secret = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secret) return null;
  return {
    accountId,
    accessKeyId,
    secret,
    bucket: env.GFL_R2_BUCKET || 'gfl-downloads',
    jurisdiction: env.GFL_R2_JURISDICTION || 'eu',
  };
}

const r2Enabled = () => Boolean(r2Config());

/**
 * PUT one object.
 * @param {string} key  e.g. "questions/questions.json"
 * @param {string|Buffer} body
 * @param {{contentType?:string, cacheControl?:string}} [opts]
 */
async function putObject(key, body, { contentType = 'application/octet-stream', cacheControl = 'no-cache' } = {}) {
  const c = r2Config();
  if (!c) throw new Error('R2 is not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  const host = `${c.accountId}${c.jurisdiction && c.jurisdiction !== 'default' ? `.${c.jurisdiction}` : ''}.r2.cloudflarestorage.com`;
  const path = `/${encodeURIComponent(c.bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const payload = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  const payloadHash = sha256hex(payload);
  const headers = {
    'cache-control': cacheControl,
    'content-type': contentType,
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const authorization = sigv4({
    method: 'PUT', path, headers, payloadHash, region: 'auto', service: 's3',
    accessKeyId: c.accessKeyId, secret: c.secret, amzDate,
  });
  const { host: _host, ...sent } = headers; // fetch sets Host itself (the same value)
  const res = await fetch(`https://${host}${path}`, { method: 'PUT', headers: { ...sent, authorization }, body: payload });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 PUT ${key} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return { key, bytes: payload.length };
}

module.exports = { sigv4, putObject, r2Enabled, r2Config };
