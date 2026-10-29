import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
let n = 0, ko = 0;
for (const an of [2024, 2025]) {
  const B = `cotes/football-us/nfl/${an}-${String(an + 1).slice(2)}`, J = JSON.parse(fs.readFileSync(`${B}/joueurs.json`));
  const TY = {}; for (const f of fs.readdirSync(`${B}/equipes`)) for (const m of JSON.parse(fs.readFileSync(`${B}/equipes/${f}`)).m) TY[m[2]] = m[5];
  // joueurs avec le plus de TD
  const tot = {}; for (const id of Object.keys(J)) { const q = JSON.parse(fs.readFileSync(`${B}/joueurs/${id}.json`)); tot[id] = q.m.reduce((t, m) => t + ((m[4] || {}).rTD || 0) + ((m[4] || {}).reTD || 0) + ((m[4] || {}).pTD || 0), 0); }
  const ids = Object.keys(tot).sort((a, b) => tot[b] - tot[a]).slice(0, 10);
  for (const id of ids) {
    const j = await g(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${id}/gamelog?season=${an}`);
    const nm = (j && j.names) || [], iTd = [], iP = nm.indexOf('passingTouchdowns'); nm.forEach((x, i) => { if (/Touchdowns$/.test(x) && x !== 'passingTouchdowns') iTd.push(i); });
    const E = {}, vus = {};
    for (const st of (j && j.seasonTypes) || []) { if (!/regular/i.test(st.displayName || '')) continue; for (const c of st.categories || []) for (const e of c.events || []) { if (vus[e.eventId]) continue; vus[e.eventId] = 1; const ev = (j.events || {})[e.eventId] || {}; E[e.eventId] = [iTd.reduce((s, i) => s + (+e.stats[i] || 0), 0), iP >= 0 ? +e.stats[iP] || 0 : 0, ev.atVs === 'vs' ? 'h' : 'a'].join(' '); } }
    const q = JSON.parse(fs.readFileSync(`${B}/joueurs/${id}.json`)), A = {};
    for (const m of q.m) if (m[4] && TY[m[2]] === 2) A[m[2]] = [(m[4].rTD || 0) + (m[4].reTD || 0), m[4].pTD || 0, m[6]].join(' ');
    const ke = Object.keys(E), ka = Object.keys(A), seulE = ke.filter((k) => !A[k]), seulA = ka.filter((k) => !E[k]), diff = ke.filter((k) => A[k] && A[k] !== E[k]);
    n++; const bad = seulE.length || seulA.length || diff.length; if (bad) ko++;
    console.log(bad ? '❌' : '✅', an, id, J[id][0], 'ESPN', ke.length, 'ARCH', ka.length, 'seulESPN', seulE.slice(0, 3).map((k) => k + ':' + E[k]).join('|'), 'seulARCH', seulA.slice(0, 3).map((k) => k + ':' + A[k]).join('|'), 'diff', diff.slice(0, 3).map((k) => E[k] + '≠' + A[k]).join('|'));
  }
}
console.log('JOUEURS', n, 'différents', ko);
