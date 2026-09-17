/**
 * The management app's releases: files in the `adminAppReleases` GridFS bucket (put there by
 * apps/admin-desktop/scripts/publish.js). Never on a public server, never in the web code.
 *
 * Served two ways, both only to a management account:
 *   - the app's private update feed  → routes/admin.js  GET /api/admin/app/update/:file
 *   - the website's management download → routes/files.js (single-use link)
 */
const { GridFSBucket } = require('mongodb');
const { getDB } = require('../db');

const BUCKET = 'adminAppReleases';
const SAFE_NAME = /^[A-Za-z0-9._-]{1,120}$/;

function bucket() {
  return new GridFSBucket(getDB(), { bucketName: BUCKET });
}

/** Newest upload of this exact file name, or null. */
async function findFile(filename) {
  if (!SAFE_NAME.test(String(filename || ''))) return null;
  const [file] = await bucket().find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
  return file || null;
}

/** Newest Windows installer, or null. */
async function latestInstaller() {
  const [file] = await bucket().find({ filename: /\.exe$/i }).sort({ uploadDate: -1 }).limit(1).toArray();
  return file || null;
}

/**
 * Stream a stored file. Honours a single `Range: bytes=a-b` (download resume); `attachment` sets the
 * download file name.
 */
function sendFile(req, res, file, { attachment = false } = {}) {
  const type = (file.metadata && file.metadata.contentType) || 'application/octet-stream';
  res.set('Content-Type', type);
  res.set('Accept-Ranges', 'bytes');
  res.set('Cache-Control', 'no-store');
  if (attachment) res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

  let start = 0;
  let end = file.length - 1;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.get('range') || '');
  if (range && (range[1] || range[2])) {
    if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(Number(range[2]), file.length - 1); }
    else { start = Math.max(0, file.length - Number(range[2])); }
    if (start > end || start >= file.length) {
      res.set('Content-Range', `bytes */${file.length}`);
      return res.status(416).end();
    }
    res.status(206);
    res.set('Content-Range', `bytes ${start}-${end}/${file.length}`);
  }
  res.set('Content-Length', String(end - start + 1));
  if (req.method === 'HEAD') return res.end();

  const stream = bucket().openDownloadStream(file._id, { start, end: end + 1 });
  stream.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });
  req.on('close', () => stream.destroy());
  return stream.pipe(res);
}

module.exports = { findFile, latestInstaller, sendFile, SAFE_NAME };
