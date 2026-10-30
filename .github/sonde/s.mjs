import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 900 } });
const err = []; p.on('pageerror', e => err.push(e.message));
await p.route(/espn\.com/, async r => { try { const res = await r.fetch(); const h = { ...res.headers(), 'access-control-allow-origin': '*' }; await r.fulfill({ response: res, headers: h }); } catch (e) { await r.abort(); } });
await p.goto('https://gones45140.github.io/gones45/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const r = await p.evaluate(async () => {
  const o = {}; const w = document.createElement('div'); w.className = 'smd-panel'; document.body.appendChild(w);
  const log = []; const f0 = window.fetch; window.fetch = function (u) { log.push(String(u).slice(0, 140)); return f0.apply(this, arguments).then(r => { if (!r.ok) log.push('  ↳ ' + r.status); return r; }, e => { log.push('  ↳ ERREUR ' + e.message); throw e; }); };
  try { await _renderGenericDetail(w, 'hockey', 'nhl', '401892611'); } catch (e) { o.e = e.message; }
  await new Promise(r => setTimeout(r, 6000));
  o.cj = !!w.querySelector('[data-g45cj]'); o.ce = !!w.querySelector('[data-g45ce]'); o.cjCache = !!w._g45Cj;
  const c = w.querySelector('[data-g45cj]'); if (c) { o.cjVisible = c.offsetParent !== null; o.cjDisplay = getComputedStyle(c).display; o.cjTxt = c.textContent.slice(0, 120); o.cjParent = c.parentNode.getAttribute && (c.parentNode.getAttribute('data-g45grp') || c.parentNode.tagName); }
  o.rangees = [...w.querySelectorAll('[data-g45plr]')].map(x => x.firstChild.textContent).join(' | ');
  o.version = [...document.scripts].map(s => s.src).filter(s => /app\.js/.test(s)).join(' ');
  o.fetch = log.filter(x => /propBets|roster|summary|odds|↳/.test(x)).slice(0, 25);
  return o;
});
console.log(JSON.stringify(r, null, 1)); console.log('erreurs', err.slice(0, 5));
await b.close();
