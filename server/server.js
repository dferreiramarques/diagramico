'use strict';
/* Diagramico server: serves the site (landing + editor) and, when SHORTLINKS=on, a tiny short-link API.
   No dependencies. Short links store a copy of the diagram payload (the same compressed text that travels in a #d= link) under a
   random id, so  https://host/s/k7m3qa  opens the diagram without a long URL. Everything else (editing, saving, exporting) stays in the browser.

   Environment:
     PORT                 port to listen on (default 3000)
     SHORTLINKS           on|off  (default off: /api/short answers 404 and the editor hides the option)
     DATA_DIR             where shorts.json lives (default ./data). On Railway, mount a volume and point this at it, or links vanish on every deploy
     SHORT_ID_LEN         id length, 5-12 (default 6)
     SHORT_TTL_DAYS       a link expires this many days after its last use (default 90)
     SHORT_MAX_CHARS      largest accepted payload, in characters (default 120000)
     SHORT_MAX_ITEMS      most links stored (default 50000);  SHORT_MAX_BYTES  most payload bytes stored (default 50 MB)
     SHORT_RATE_WRITE     links one IP may create per hour (default 20);  SHORT_RATE_READ  lookups per IP per minute (default 240)
     TRUST_PROXY_HOPS     proxies in front of this server whose X-Forwarded-For entry can be trusted (default 1; 0 = use the socket address)
     RAILWAY_GIT_COMMIT_SHA / GIT_COMMIT   set by Railway (or by hand) to show which version is live in /api/health */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const int = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const CFG = {
  port: int(process.env.PORT, 0, 65535, 3000),
  shortOn: /^(1|on|true|yes)$/i.test(process.env.SHORTLINKS || ''),
  dataDir: path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data')),
  idLen: int(process.env.SHORT_ID_LEN, 5, 12, 6),
  ttlDays: int(process.env.SHORT_TTL_DAYS, 1, 3650, 90),
  maxChars: int(process.env.SHORT_MAX_CHARS, 1000, 2000000, 120000),
  maxItems: int(process.env.SHORT_MAX_ITEMS, 1, 10000000, 50000),
  maxBytes: int(process.env.SHORT_MAX_BYTES, 1000, 2000000000, 50 * 1024 * 1024),
  rateWrite: int(process.env.SHORT_RATE_WRITE, 1, 100000, 20),
  rateRead: int(process.env.SHORT_RATE_READ, 1, 100000, 240),
  hops: int(process.env.TRUST_PROXY_HOPS, 0, 5, 1),
  commit: String(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || '').trim().slice(0, 7),
};
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // 31 symbols: no 0 1 i l o, so ids survive being read aloud or retyped
const ID_RE = /^[2-9a-hj-km-np-z]{4,12}$/;
const DAY = 86400000;

/* ---------- short-link store: an in-memory map persisted to one JSON file ---------- */
const store = { items: new Map(), byHash: new Map(), bytes: 0, dirty: false, timer: null };
const file = () => path.join(CFG.dataDir, 'shorts.json');
const hash = d => crypto.createHash('sha256').update(d).digest('hex');
function loadStore(){
  if (!CFG.shortOn) return;
  try {
    const o = JSON.parse(fs.readFileSync(file(), 'utf8'));
    for (const [id, it] of Object.entries(o.items || {})) if (ID_RE.test(id) && typeof it.d === 'string') addItem(id, it.d, it.c, it.a);
  } catch (e) { if (e.code !== 'ENOENT') console.error('could not read', file(), e.message); }
}
function addItem(id, d, c = Date.now(), a = c){ store.items.set(id, {d, c, a}); store.byHash.set(hash(d), id); store.bytes += d.length; }
function delItem(id){ const it = store.items.get(id); if (!it) return; store.items.delete(id); store.byHash.delete(hash(it.d)); store.bytes -= it.d.length; store.dirty = true; scheduleSave(); }
function scheduleSave(){ store.dirty = true; if (store.timer) return; store.timer = setTimeout(() => { store.timer = null; saveStore(); }, 400); store.timer.unref && store.timer.unref(); }
function saveStore(){
  if (!CFG.shortOn || !store.dirty) return; store.dirty = false;
  try {
    fs.mkdirSync(CFG.dataDir, { recursive: true });
    const o = { v: 1, items: Object.fromEntries(store.items) }, tmp = file() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, file()); // atomic: a crash never leaves a half-written file
  } catch (e) { store.dirty = true; console.error('could not save', e.message); }
}
function expire(){
  const cut = Date.now() - CFG.ttlDays * DAY; let n = 0;
  for (const [id, it] of [...store.items]) if (it.a < cut){ delItem(id); n++; }
  if (n) console.log('expired', n, 'short links');
}
function newId(){ for (let tries = 0; tries < 50; tries++){ let id = ''; for (let i = 0; i < CFG.idLen; i++) id += ALPHABET[crypto.randomInt(ALPHABET.length)]; if (!store.items.has(id)) return id; } return null; }

/* The payload must really be a diagram (deflate-raw JSON with a nodes array), so the service cannot be used as a general paste bin. */
function validPayload(d){
  if (typeof d !== 'string' || d.length < 8 || d.length > CFG.maxChars || !/^[A-Za-z0-9_-]+$/.test(d)) return false;
  try {
    const raw = Buffer.from(d.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const o = JSON.parse(zlib.inflateRawSync(raw, { maxOutputLength: 8 * 1024 * 1024 }).toString('utf8'));
    return !!o && Array.isArray(o.nodes) && o.nodes.length <= 3000;
  } catch (e) { return false; }
}

/* ---------- rate limits ---------- */
const buckets = new Map();
function limited(key, max, windowMs){
  const now = Date.now(); let b = buckets.get(key);
  if (!b || b.reset <= now){ b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  return ++b.n > max;
}
const sweepBuckets = () => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k); };
function clientIp(req){
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  if (CFG.hops && xff.length) return xff[Math.max(0, xff.length - CFG.hops)];
  return req.socket.remoteAddress || '?';
}

/* ---------- responses ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon' };
const HTML_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://roadmaps.monco.io; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://formspree.io https://roadmaps.monco.io; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
function secHeaders(req, h = {}){
  const o = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', ...h };
  if (String(req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https') o['Strict-Transport-Security'] = 'max-age=31536000';
  return o;
}
function json(req, res, status, obj, extra = {}){
  const body = JSON.stringify(obj);
  res.writeHead(status, secHeaders(req, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body), ...extra }));
  res.end(req.method === 'HEAD' ? undefined : body);
}
function readBody(req, max){
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > max){ if (!chunks.over){ chunks.over = true; req.pause(); reject(Object.assign(new Error('too big'), { status: 413 })); } } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ---------- static files (only the site itself: landing, editor, assets) ---------- */
const PUBLIC_FILES = new Set(['/index.html', '/product-page.css']), PUBLIC_DIRS = ['/app/', '/assets/'];
function resolvePublic(urlPath){
  let p; try { p = decodeURIComponent(urlPath); } catch (e) { return null; }
  if (p === '/') p = '/index.html'; else if (p.endsWith('/')) p += 'index.html';
  if (p.includes('\0') || p.includes('\\') || p.split('/').some(s => s === '..' || s.startsWith('.'))) return null;
  if (!PUBLIC_FILES.has(p) && !PUBLIC_DIRS.some(d => p.startsWith(d))) return null;
  const f = path.join(ROOT, p); return f.startsWith(ROOT + path.sep) ? f : null;
}
const gz = new Map();
function serveStatic(req, res, urlPath){
  const f = resolvePublic(urlPath); if (!f) return notFound(req, res);
  fs.stat(f, (err, st) => {
    if (err || !st.isFile()) return notFound(req, res);
    const ext = path.extname(f).toLowerCase(), type = MIME[ext] || 'application/octet-stream', isHtml = ext === '.html';
    const etag = `W/"${st.size}-${Math.floor(st.mtimeMs)}"`;
    const h = { 'Content-Type': type, ETag: etag, 'Last-Modified': st.mtime.toUTCString(),
      'Cache-Control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : (ext === '.gif' || ext === '.png') ? 'public, max-age=86400' : 'no-cache' };
    if (isHtml) h['Content-Security-Policy'] = HTML_CSP;
    if (req.headers['if-none-match'] === etag){ res.writeHead(304, secHeaders(req, h)); return res.end(); }
    fs.readFile(f, (e, buf) => {
      if (e) return notFound(req, res);
      if (/\b(?:html|css|js|svg|json|txt)\b/.test(ext.slice(1)) && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))){
        const k = f + st.mtimeMs; if (!gz.has(k)){ if (gz.size > 200) gz.clear(); gz.set(k, zlib.gzipSync(buf, { level: 6 })); }
        buf = gz.get(k); h['Content-Encoding'] = 'gzip'; h.Vary = 'Accept-Encoding';
      }
      h['Content-Length'] = buf.length; res.writeHead(200, secHeaders(req, h)); res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });
}
function notFound(req, res){ res.writeHead(404, secHeaders(req, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })); res.end(req.method === 'HEAD' ? undefined : 'Not found'); }

/* ---------- routes ---------- */
async function handle(req, res){
  const url = new URL(req.url, 'http://x'), p = url.pathname;
  const get = req.method === 'GET' || req.method === 'HEAD';

  if (p === '/api/health' && get) return json(req, res, 200, { ok: true, commit: CFG.commit || null, shortLinks: CFG.shortOn, ttlDays: CFG.ttlDays, idLen: CFG.idLen });

  if (p === '/api/short'){
    if (!CFG.shortOn) return json(req, res, 404, { error: 'disabled' });
    if (req.method !== 'POST') return json(req, res, 405, { error: 'method' }, { Allow: 'POST' });
    const ip = clientIp(req);
    if (limited('w:' + ip, CFG.rateWrite, 3600000)) return json(req, res, 429, { error: 'rate' }, { 'Retry-After': '3600' });
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return json(req, res, 415, { error: 'type' });
    let body; try { body = JSON.parse((await readBody(req, CFG.maxChars + 2000)).toString('utf8')); }
    catch (e) { if (e.status === 413){ res.on('finish', () => req.destroy()); return json(req, res, 413, { error: 'size' }, { Connection: 'close' }); } return json(req, res, 400, { error: 'json' }); }
    if (!validPayload(body && body.d)) return json(req, res, 400, { error: 'payload' });
    const h = hash(body.d), known = store.byHash.get(h);
    if (known && store.items.has(known)){ const it = store.items.get(known); it.a = Date.now(); scheduleSave(); return json(req, res, 200, { id: known, ttlDays: CFG.ttlDays }); }
    if (store.items.size >= CFG.maxItems || store.bytes + body.d.length > CFG.maxBytes){ expire(); if (store.items.size >= CFG.maxItems || store.bytes + body.d.length > CFG.maxBytes) return json(req, res, 507, { error: 'full' }); }
    const id = newId(); if (!id) return json(req, res, 503, { error: 'id' });
    addItem(id, body.d); scheduleSave(); return json(req, res, 201, { id, ttlDays: CFG.ttlDays });
  }

  let m = /^\/api\/short\/([^/]+)$/.exec(p);
  if (m){
    if (!CFG.shortOn) return json(req, res, 404, { error: 'disabled' });
    if (!get) return json(req, res, 405, { error: 'method' }, { Allow: 'GET' });
    if (limited('r:' + clientIp(req), CFG.rateRead, 60000)) return json(req, res, 429, { error: 'rate' }, { 'Retry-After': '60' });
    const it = ID_RE.test(m[1]) ? store.items.get(m[1]) : null;
    if (!it) return json(req, res, 404, { error: 'gone' });
    if (it.a < Date.now() - CFG.ttlDays * DAY){ delItem(m[1]); return json(req, res, 404, { error: 'gone' }); }
    it.a = Date.now(); scheduleSave(); return json(req, res, 200, { d: it.d });
  }

  m = /^\/s\/([^/]+)$/.exec(p);
  if (m && get){
    if (!CFG.shortOn || !ID_RE.test(m[1])) return notFound(req, res);
    res.writeHead(302, secHeaders(req, { Location: '/app/#s=' + m[1], 'Cache-Control': 'no-store' })); return res.end();
  }

  if (p === '/app' && get){ res.writeHead(301, secHeaders(req, { Location: '/app/' + url.search })); return res.end(); }
  if (p.startsWith('/api/')) return json(req, res, 404, { error: 'not found' });
  if (!get) { res.writeHead(405, secHeaders(req, { Allow: 'GET, HEAD' })); return res.end(); }
  return serveStatic(req, res, p);
}

function createServer(){
  const srv = http.createServer((req, res) => { handle(req, res).catch(e => { console.error(e); if (!res.headersSent) json(req, res, 500, { error: 'server' }); else res.end(); }); });
  srv.requestTimeout = 20000; srv.headersTimeout = 10000;
  return srv;
}

if (require.main === module){
  loadStore(); expire();
  const srv = createServer();
  srv.listen(CFG.port, () => console.log(`diagramico${CFG.commit ? ' ' + CFG.commit : ''} listening on ${srv.address().port}; short links ${CFG.shortOn ? 'on (' + store.items.size + ' stored, data in ' + CFG.dataDir + ')' : 'off'}`));
  setInterval(() => { sweepBuckets(); expire(); }, 3600000).unref();
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { saveStore(); process.exit(0); });
}
module.exports = { createServer, loadStore, saveStore, store, CFG };
