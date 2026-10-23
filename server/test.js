'use strict';
// Run with:  npm test   (node --test server/). Starts the real server as a child process on a random port, with a throw-away data dir.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), zlib = require('node:zlib');

const SERVER = path.join(__dirname, 'server.js');
function start(env = {}){
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER], { env: { ...process.env, PORT: '0', SHORTLINKS: '', TRUST_PROXY_HOPS: '0', ...env } });
    let out = ''; const t = setTimeout(() => { child.kill(); reject(new Error('server did not start: ' + out)); }, 8000);
    child.stdout.on('data', d => { out += d; const m = /listening on (\d+)/.exec(out); if (m){ clearTimeout(t); resolve({ base: 'http://127.0.0.1:' + m[1], stop: () => new Promise(r => { child.once('exit', r); child.kill('SIGTERM'); }) }); } });
    child.stderr.on('data', d => { out += d; });
    child.on('error', reject);
  });
}
const payload = (o = { nodes: [{ id: '0', type: 'step', x: 0, y: 0, text: 'Olá' }], edges: [] }) => zlib.deflateRawSync(Buffer.from(JSON.stringify(o))).toString('base64url');
const post = (base, body, headers = { 'Content-Type': 'application/json' }) => fetch(base + '/api/short', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'diagramico-test-'));

test('static site: only the landing, the editor and assets are served, with security headers', async () => {
  const s = await start();
  try {
    let r = await fetch(s.base + '/'); assert.equal(r.status, 200);
    assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await fetch(s.base + '/app/')).status, 200);
    assert.equal((await fetch(s.base + '/assets/fonts/inter.css')).status, 200);
    assert.equal((await fetch(s.base + '/product-page.css')).status, 200);
    r = await fetch(s.base + '/app', { redirect: 'manual' }); assert.equal(r.status, 301);
    assert.equal((await fetch(s.base + '/', { method: 'HEAD' })).status, 200);
    for (const p of ['/README.md', '/docs/ARQUITETURA.md', '/server/server.js', '/package.json', '/.git/config', '/private/AUTORIA.md', '/app/../README.md', '/%2e%2e/README.md', '/assets/%2e%2e/README.md', '/app/..%2fREADME.md', '/tools/record-flow-gif.js'])
      assert.equal((await fetch(s.base + p)).status, 404, p);
    assert.equal((await fetch(s.base + '/', { method: 'POST' })).status, 405);
  } finally { await s.stop(); }
});

test('health reports which commit is live', async () => {
  const s = await start({ RAILWAY_GIT_COMMIT_SHA: '', GIT_COMMIT: 'abc1234def5678' });
  try {
    const h = await (await fetch(s.base + '/api/health')).json();
    assert.equal(h.commit, 'abc1234');
  } finally { await s.stop(); }
});

test('short links are off by default', async () => {
  const s = await start();
  try {
    const h = await (await fetch(s.base + '/api/health')).json(); assert.equal(h.shortLinks, false);
    assert.equal((await post(s.base, { d: payload() })).status, 404);
    assert.equal((await fetch(s.base + '/api/short/abc234')).status, 404);
    assert.equal((await fetch(s.base + '/s/abc234', { redirect: 'manual' })).status, 404);
  } finally { await s.stop(); }
});

test('short links: create, dedupe, open, redirect and validation', async () => {
  const dir = tmp(), s = await start({ SHORTLINKS: 'on', DATA_DIR: dir });
  try {
    const h = await (await fetch(s.base + '/api/health')).json(); assert.equal(h.shortLinks, true); assert.equal(h.idLen, 6);
    const d = payload();
    let r = await post(s.base, { d }); assert.equal(r.status, 201);
    const { id } = await r.json(); assert.match(id, /^[2-9a-hj-km-np-z]{6}$/);
    r = await post(s.base, { d }); assert.equal(r.status, 200); assert.equal((await r.json()).id, id); // same diagram, same link
    r = await fetch(s.base + '/api/short/' + id); assert.equal(r.status, 200); assert.equal((await r.json()).d, d);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    r = await fetch(s.base + '/s/' + id, { redirect: 'manual' }); assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/app/#s=' + id);
    assert.equal((await fetch(s.base + '/api/short/zzzzzz')).status, 404);
    assert.equal((await fetch(s.base + '/api/short/..%2f..%2fetc')).status, 404);
    assert.equal((await fetch(s.base + '/s/' + 'a'.repeat(40), { redirect: 'manual' })).status, 404);
    // anything that is not a real diagram payload is refused: junk, valid base64 that is not deflate, JSON without nodes, bad characters, wrong content type
    for (const bad of ['', 'abc', 'AAAAAAAAAAAAAAAAAAAA', payload({ hello: 1 }), payload({ nodes: 'x' }), 'ab cd/ef+gh=', 'x'.repeat(100000)])
      assert.equal((await post(s.base, { d: bad })).status, 400, 'payload ' + bad.slice(0, 20));
    assert.equal((await post(s.base, '{not json')).status, 400);
    assert.equal((await post(s.base, { d: 'x'.repeat(200000) })).status, 413); // body larger than the cap is cut off, not buffered
    assert.equal((await post(s.base, { d }, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await fetch(s.base + '/api/short', { method: 'GET' })).status, 405);
    // a "zip bomb": 40 MB of zeros that deflate to a few KB must not be inflated
    const bomb = zlib.deflateRawSync(Buffer.alloc(40 * 1024 * 1024, 0)).toString('base64url'); assert.ok(bomb.length < 120000);
    assert.equal((await post(s.base, { d: bomb })).status, 400);
  } finally { await s.stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('short links survive a restart and expire after the TTL', async () => {
  const dir = tmp(); let s = await start({ SHORTLINKS: 'on', DATA_DIR: dir });
  let id;
  try { id = (await (await post(s.base, { d: payload() })).json()).id; await new Promise(r => setTimeout(r, 900)); } finally { await s.stop(); } // the store is written 0.4 s after a change (Windows cannot deliver SIGTERM, so do not rely on the exit flush)
  assert.ok(fs.existsSync(path.join(dir, 'shorts.json')));
  s = await start({ SHORTLINKS: 'on', DATA_DIR: dir });
  try { assert.equal((await fetch(s.base + '/api/short/' + id)).status, 200); } finally { await s.stop(); }
  // age the link past the TTL on disk, then restart: it is gone
  const f = path.join(dir, 'shorts.json'), o = JSON.parse(fs.readFileSync(f, 'utf8')); o.items[id].a = Date.now() - 100 * 86400000; fs.writeFileSync(f, JSON.stringify(o));
  s = await start({ SHORTLINKS: 'on', DATA_DIR: dir, SHORT_TTL_DAYS: '90' });
  try { assert.equal((await fetch(s.base + '/api/short/' + id)).status, 404); } finally { await s.stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('short links: write and read rate limits, and storage caps', async () => {
  const dir = tmp(), s = await start({ SHORTLINKS: 'on', DATA_DIR: dir, SHORT_RATE_WRITE: '3', SHORT_RATE_READ: '5', SHORT_MAX_ITEMS: '2' });
  try {
    const mk = i => payload({ nodes: [{ id: '0', type: 'step', x: i, y: 0, text: 't' + i }], edges: [] });
    assert.equal((await post(s.base, { d: mk(1) })).status, 201);
    assert.equal((await post(s.base, { d: mk(2) })).status, 201);
    assert.equal((await post(s.base, { d: mk(3) })).status, 507); // store full (2 items)
    assert.equal((await post(s.base, { d: mk(4) })).status, 429); // 4th write in the hour
    const codes = []; for (let i = 0; i < 7; i++) codes.push((await fetch(s.base + '/api/short/zzzzzz')).status);
    assert.deepEqual(codes, [404, 404, 404, 404, 404, 429, 429]);
  } finally { await s.stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});
