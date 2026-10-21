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

   AI summaries and walkthroughs (optional; the editor has a local engine that always works without this):
     AI                   on|off  (default off: /api/ai answers 404 and the editor only offers the local engine)
     AI_BASE_URL          any OpenAI-compatible API (default https://api.groq.com/openai/v1; also OpenRouter, Gemini's /v1beta/openai, a local Ollama at http://localhost:11434/v1)
     AI_API_KEY           the provider's key (not needed for Ollama). Stays on the server, never reaches the browser
     AI_MODEL             model name (default llama-3.3-70b-versatile)
     AI_MAX_CHARS         largest diagram text accepted (default 24000);  AI_RATE  requests one IP may make per hour (default 30) */
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
  aiOn: /^(1|on|true|yes)$/i.test(process.env.AI || ''),
  aiBase: String(process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
  aiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
  aiMaxChars: int(process.env.AI_MAX_CHARS, 1000, 200000, 24000),
  aiRate: int(process.env.AI_RATE, 1, 100000, 30),
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

/* ---------- AI: summary and walkthrough ----------
   The browser sends only the diagram as Diagramico AI text (exportAI) and which document it wants; the prompt lives here,
   so the endpoint cannot be used as a general-purpose chat proxy. */
const AI_LANG = { pt: 'European Portuguese (pt-PT)', en: 'English' };
const AI_HEAD = {
  summary: { pt: ['Resumo', 'Decomposição', 'Regras-chave', 'Pontos-chave'], en: ['Summary', 'Breakdown', 'Key rules', 'Takeaways'] },
  walkthrough: { pt: ['Objetivo', 'Quem participa', 'Antes de começar', 'Passo a passo', 'Dicas e erros comuns', 'Lista de verificação'], en: ['Purpose', 'Who is involved', 'Before you start', 'Step by step', 'Tips and common mistakes', 'Checklist'] },
};
function aiPrompt(kind, lang){
  const h = AI_HEAD[kind][lang], common = `You read process diagrams written in the Diagramico compact text format (its SYNTAX line explains it) and explain them to people. Write in ${AI_LANG[lang]}. Answer in Markdown only: "## " headings, "- " bullets, "1. " numbered lists, **bold**; no tables, no code blocks, no preamble. Use only what the diagram says; never invent steps, rules or roles. Refer to steps by their text, never by their IDs (like CL3). Lanes are the people, teams or systems responsible.`;
  if (kind === 'summary') return common + `\nWrite these sections, in this order:\n## ${h[0]}: 2 to 4 sentences on what the process does, where it starts and how it can end.\n## ${h[1]}: one bullet per lane (or per phase if there are no lanes), "**Lane**: what it does".\n## ${h[2]}: the business rules the diagram encodes: every decision with its branches ("if X, then Y"), parallel or inclusive gateways, loops, waits, handoffs between lanes and rules written in notes.\n## ${h[3]}: 3 to 6 bullets: what matters most, risks, bottlenecks, and gaps in the diagram (unlabelled branches, steps with no way out).`;
  return common + `\nWrite a job aid that teaches a first-time user to run this process. Sections, in this order:\n## ${h[0]}: one or two sentences.\n## ${h[1]}: one bullet per lane, with its role.\n## ${h[2]}: what triggers the process and what the user needs (documents, data, screens).\n## ${h[3]}: a numbered list following the flow from the start. Each item begins with "**Lane**:" when there are lanes, then the action as an instruction (imperative). For decisions, nest bullets "If <condition> → go to step N". Mark where responsibility passes to another lane and where the process ends.\n## ${h[4]}: only what the notes or the structure support (waits, loops, decisions that are easy to get wrong). Omit the section if there is nothing.\n## ${h[5]}: "- [ ] " items a new user can tick off.`;
}
async function aiComplete(kind, lang, text){
  const headers = { 'Content-Type': 'application/json' }; if (CFG.aiKey) headers.Authorization = 'Bearer ' + CFG.aiKey;
  const r = await fetch(CFG.aiBase + '/chat/completions', { method: 'POST', headers, signal: AbortSignal.timeout(60000), body: JSON.stringify({
    model: CFG.aiModel, temperature: 0.2, max_tokens: 2500,
    messages: [{ role: 'system', content: aiPrompt(kind, lang) }, { role: 'user', content: text }] }) });
  if (!r.ok){ console.error('ai upstream', r.status, (await r.text().catch(() => '')).slice(0, 300)); throw Object.assign(new Error('upstream'), { status: 502 }); }
  const j = await r.json(), md = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (typeof md !== 'string' || !md.trim()) throw Object.assign(new Error('empty'), { status: 502 });
  return md.replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/, '$1').trim().slice(0, 20000);
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

  if (p === '/api/health' && get) return json(req, res, 200, { ok: true, shortLinks: CFG.shortOn, ttlDays: CFG.ttlDays, idLen: CFG.idLen, ai: CFG.aiOn });

  if (p === '/api/ai'){
    if (!CFG.aiOn) return json(req, res, 404, { error: 'disabled' });
    if (req.method !== 'POST') return json(req, res, 405, { error: 'method' }, { Allow: 'POST' });
    if (limited('ai:' + clientIp(req), CFG.aiRate, 3600000)) return json(req, res, 429, { error: 'rate' }, { 'Retry-After': '3600' });
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return json(req, res, 415, { error: 'type' });
    let body; try { body = JSON.parse((await readBody(req, CFG.aiMaxChars * 4 + 2000)).toString('utf8')); }
    catch (e) { if (e.status === 413){ res.on('finish', () => req.destroy()); return json(req, res, 413, { error: 'size' }, { Connection: 'close' }); } return json(req, res, 400, { error: 'json' }); }
    const kind = body && body.kind, lang = body && body.lang, text = body && body.text;
    if (!Object.hasOwn(AI_HEAD, kind) || !Object.hasOwn(AI_LANG, lang) || typeof text !== 'string' || text.length > CFG.aiMaxChars || !/^DIAGRAM: /.test(text) || !/\nNODES:\n/.test(text)) return json(req, res, 400, { error: 'payload' });
    try { return json(req, res, 200, { md: await aiComplete(kind, lang, text), model: CFG.aiModel }); }
    catch (e) { if (e.status !== 502) console.error('ai', e.message); return json(req, res, 502, { error: 'upstream' }); }
  }

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
  srv.listen(CFG.port, () => console.log(`diagramico listening on ${srv.address().port}; short links ${CFG.shortOn ? 'on (' + store.items.size + ' stored, data in ' + CFG.dataDir + ')' : 'off'}; ai ${CFG.aiOn ? 'on (' + CFG.aiModel + ')' : 'off'}`));
  setInterval(() => { sweepBuckets(); expire(); }, 3600000).unref();
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { saveStore(); process.exit(0); });
}
module.exports = { createServer, loadStore, saveStore, store, CFG };
