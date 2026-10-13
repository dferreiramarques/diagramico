/* Records the animated GIFs shown on the landing page (assets/flow-pt.gif and assets/flow-en.gif).

   How to run (the app must be served over http, with a tiny server that also accepts POST /__save?path=assets/<name>.gif):
   1. Open http://127.0.0.1:<port>/app/ in a 960x540 window.
   2. Paste this whole file in the DevTools console. It defines window.__rec(L) (records the frames of a scripted drawing session
      by dispatching real pointer and keyboard events, then compositing the app canvas with a cursor and a caption) and window.__encode().
   3. const L = {pt: {...}, en: {...}} (texts below), then:
        const n = await window.__rec(L.pt); await window.__encode(window.__thin(window.__frames), 'flow-pt.gif', 32);
      and the same with L.en and 'flow-en.gif'.
   Only the canvas is captured (not the toolbars); typing is simulated by writing node text directly.
   If the UI changes (tool keys, side dots, glue "+"), update the script and record again. */

window.__L = {
  pt: {lang:'pt', lane1:'Cliente', lane2:'Suporte', start:'Pede reembolso', decision:'Menos de 30 dias?', approve:'Aprova e devolve o valor', refuse:'Recusa e explica o motivo', end:'Recebe a resposta', yes:'sim', no:'não',
    cap:{lane:'cria uma swimlane', glue:'junta uma lane colada', start:'evento de início', decision:'decisão', step:'passo', end:'evento de fim', connect:'arrasta dos pontos laterais para ligar', align:'alinha à grelha', done:'pronto: exporta para IA, Mermaid, SVG, PNG'}},
  en: {lang:'en', lane1:'Customer', lane2:'Support', start:'Requests a refund', decision:'Under 30 days?', approve:'Approves and refunds', refuse:'Declines and explains', end:'Receives the answer', yes:'yes', no:'no',
    cap:{lane:'draws a swimlane', glue:'adds a glued lane', start:'start event', decision:'decision', step:'step', end:'end event', connect:'drag the side dots to connect', align:'aligns to the grid', done:'done: export to AI, Mermaid, SVG, PNG'}}
};

window.__rec = async function record(L){
  const D = window.__diagramico, cv = document.querySelector('#cv'), ta = document.querySelector('#ta');
  const sleep = ms => new Promise(r => setTimeout(r, ms)), raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  // light theme, language, fresh empty diagram
  for (let i = 0; i < 3 && document.documentElement.getAttribute('data-theme') !== 'light'; i++) document.querySelector('#btnTheme').click();
  if (document.querySelector('#btnLang').textContent.toLowerCase() !== L.lang) document.querySelector('#btnLang').click();
  document.querySelector('#btnNew').click(); await sleep(150); document.querySelector('#docName').blur(); window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  const v = D.view; Object.assign(v, {z:1.1, ox:29, oy:48}); window.dispatchEvent(new Event('resize')); await raf2();
  const W = 800, H = 450, out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d', {willReadFrequently:true});
  const frames = []; let cap = null, cur = [440, 250];
  const sc = (x, y) => [x * v.z + v.ox, y * v.z + v.oy];
  const drawCaption = () => { if (!cap) return; g.font = '600 15px "IBM Plex Sans", sans-serif'; const tw = g.measureText(cap.t).width, kw = g.measureText(cap.k).width + 16, w = kw + tw + 34, x = (W - w)/2, y = H - 46;
    g.fillStyle = 'rgba(27,31,42,.92)'; g.beginPath(); g.roundRect(x, y, w, 34, 17); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x + 8, y + 6, kw, 22, 6); g.fill(); g.fillStyle = '#1b1f2a'; g.textBaseline = 'middle'; g.fillText(cap.k, x + 16, y + 18);
    g.fillStyle = '#ffffff'; g.fillText(cap.t, x + 8 + kw + 10, y + 18); };
  const drawCursor = () => { const s = W / cv.clientWidth, x = cur[0] * s, y = cur[1] * s; g.save(); g.translate(x, y); g.fillStyle = '#1b1f2a'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 15); g.lineTo(4, 11.5); g.lineTo(7.5, 18); g.lineTo(10, 17); g.lineTo(6.5, 10.5); g.lineTo(11.5, 10); g.closePath(); g.fill(); g.stroke(); g.restore(); };
  const snap = async delay => { await raf2(); g.fillStyle = '#f3f4f7'; g.fillRect(0, 0, W, H); g.drawImage(cv, 0, 0, W, H); drawCursor(); drawCaption(); frames.push({img: g.getImageData(0, 0, W, H), delay}); };
  const ptr = (t, x, y) => { cur = [x, y]; const ev = new PointerEvent('pointer' + t, {clientX:x, clientY:y, pointerId:1, bubbles:true, button:0, pointerType:'mouse'}); (t === 'down' ? cv : (t === 'move' && !D.state.drag ? cv : window)).dispatchEvent(ev); };
  const key = (k, o = {}) => window.dispatchEvent(new KeyboardEvent('keydown', {key:k, bubbles:true, ...o}));
  const moveTo = async (x, y, steps = 3, d = 60) => { const [a, b] = cur; for (let i = 1; i <= steps; i++){ ptr('move', a + (x - a) * i / steps, b + (y - b) * i / steps); await snap(d); } };
  const typeText = async (get, text, per = 3) => { for (let i = per; i < text.length + per; i += per){ const o = get(); o[('type' in o) ? 'text' : 'label'] = text.slice(0, Math.min(i, text.length)); D.redraw(); await snap(70); } };
  const endEditNow = () => ta.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  const place = async (tool, k, tx, wx, wy, text, find) => { cap = {k: tool, t: k}; const [sx, sy] = sc(wx, wy); await moveTo(sx, sy); key(tool.toLowerCase()); await snap(120); ptr('down', sx, sy); ptr('up', sx, sy); endEditNow(); await snap(200); const n = find(); await typeText(() => n, text); await snap(350); return n; };
  const nodes = () => D.doc().nodes;
  // 1. lanes
  await snap(500);
  const l1 = await place('L', L.cap.lane, 0, 0, 0, L.lane1, () => nodes().find(n => n.type === 'lane' && n.text !== L.lane1));
  l1.w = 820; D.redraw(); cap = {k:'+', t:L.cap.glue}; { const [px, py] = sc(l1.x + l1.w - 22 / v.z, l1.y + l1.h + 17 / v.z); await moveTo(px, py); await snap(300); ptr('down', px, py); ptr('up', px, py); endEditNow(); await snap(250); }
  const l2 = nodes().find(n => n.type === 'lane' && n.text !== L.lane1); await typeText(() => l2, L.lane2); await snap(400);
  // 2. shapes (slightly off-grid on purpose: Shift A snaps them at the end)
  const st = await place('1', L.cap.start, 0, 96, 90, L.start, () => nodes().at(-1));
  const dc = await place('D', L.cap.decision, 0, 306, 266, L.decision, () => nodes().at(-1));
  const ap = await place('R', L.cap.step, 0, 492, 236, L.approve, () => nodes().at(-1));
  const rf = await place('R', L.cap.step, 0, 514, 326, L.refuse, () => nodes().at(-1));
  const en = await place('2', L.cap.end, 0, 712, 98, L.end, () => nodes().at(-1));
  // 3. connect with the side dots
  const connect = async (a, side, b, label) => {
    const dir = {top:[0,-1], bottom:[0,1], left:[-1,0], right:[1,0]}[side]; const c = sc(a.x, a.y); await moveTo(c[0], c[1], 2, 40); ptr('move', c[0] + 1, c[1]);
    let h = null; for (let k = 8; k < 220; k++){ const s = sc(a.x + dir[0] * k, a.y + dir[1] * k); ptr('move', s[0], s[1]); if (D.state.hoverHandle && D.state.hoverHandle.side === side){ h = s; break; } }
    await snap(200); ptr('down', h[0], h[1]); ptr('move', h[0] + 3, h[1] + 3); const t = sc(b.x, b.y); await moveTo(t[0], t[1], 4, 60); await snap(150); ptr('up', t[0], t[1]);
    const e = D.doc().edges.at(-1); await snap(200); if (label){ await typeText(() => e, label, 1); await snap(250); } };
  cap = {k:'●', t:L.cap.connect};
  await connect(st, 'right', dc, ''); await connect(dc, 'right', ap, L.yes); await connect(dc, 'bottom', rf, L.no); await connect(ap, 'right', en, ''); await connect(rf, 'right', en, '');
  D.state.sel = new Set(); D.redraw(); await snap(500);
  // 4. align
  cap = {k:'Shift A', t:L.cap.align}; await snap(500); key('A', {shiftKey:true}); await snap(150); await snap(1400);
  cap = {k:'✓', t:L.cap.done}; await snap(2200);
  window.__frames = frames; return frames.length;
};

// Drops every second very short frame (typing / cursor moves) to keep the GIF small.
window.__thin = fr => { const out = []; let skip = false; for (const f of fr){ if (f.delay <= 70){ if (skip && out.length){ out[out.length-1].delay += f.delay; skip = false; continue; } skip = true; } else skip = false; out.push({img:f.img, delay:f.delay}); } return out; };

// Encodes with gifenc, merges identical neighbouring frames and POSTs the file to the local dev server.
window.__encode = async function(frames, name, colors = 32){
  const {GIFEncoder, quantize, applyPalette} = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js');
  const same = (a, b) => { for (let i = 0; i < a.length; i += 61) if (a[i] !== b[i]) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
  const merged = []; for (const f of frames){ const last = merged[merged.length-1]; if (last && same(last.img.data, f.img.data)) last.delay += f.delay; else merged.push({img:f.img, delay:f.delay}); }
  const gif = GIFEncoder(); for (const f of merged){ const {data, width, height} = f.img; const palette = quantize(data, colors, {format:'rgb444'}); const index = applyPalette(data, palette, 'rgb444'); gif.writeFrame(index, width, height, {palette, delay:Math.max(20, f.delay)}); }
  gif.finish(); const bytes = gif.bytes(); const r = await fetch('/__save?path=assets/' + name, {method:'POST', body:bytes}); return {frames:merged.length, kb:Math.round(bytes.length/1024), save:await r.text()};
};
