// Séries individuelles : gamelog ESPN (même lecture que _g45RegLogFoot) vs archives (joueurs/<id>.json)
import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
let n = 0, ko = 0;
for (const [lg, an] of [['fra.1', 2024], ['fra.1', 2025], ['eng.1', 2025], ['esp.1', 2025], ['ita.1', 2024], ['ger.1', 2025], ['uefa.champions', 2025]]) {
  const sa = an + '-' + String(an + 1).slice(2), B = `cotes/foot/${lg}/${sa}`;
  const et = JSON.parse(fs.readFileSync(`${B}/etat.json`)); const J = JSON.parse(fs.readFileSync(`${B}/joueurs.json`));
  const ids = Object.keys(J).sort((a, b) => J[b][2] - J[a][2]).slice(0, 6); if (lg === 'esp.1' && J['231388'] && !ids.includes('231388')) ids.push('231388');
  console.log(lg, sa, 'etat', JSON.stringify(et));
  for (const id of ids) {
    const coupe = /^uefa/.test(lg);
    const j = await g(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}/gamelog?season=${an}&league=${lg}`);
    const nm = (j && j.names) || [], ib = nm.indexOf('totalGoals'), ia = nm.indexOf('goalAssists'), E = {}, vus = {};
    for (const st of (j && j.seasonTypes) || []) for (const c of st.categories || []) for (const e of c.events || []) { if (vus[e.eventId]) continue; vus[e.eventId] = 1; const ev = (j.events || {})[e.eventId] || {}; E[e.eventId] = [String(ev.gameDate || '').slice(0, 10), +e.stats[ib] || 0, +e.stats[ia] || 0, ev.atVs === 'vs' ? 'h' : (ev.atVs === '@' ? 'a' : '?')].join(' '); }
    const q = JSON.parse(fs.readFileSync(`${B}/joueurs/${id}.json`)), A = {};
    for (const m of q.m) if (m[4]) A[m[2]] = [new Date(m[0]).toISOString().slice(0, 10), +m[4].G || 0, +m[4].A || 0, m[6] || '?'].join(' ');
    const ke = Object.keys(E), ka = Object.keys(A), seulE = ke.filter((k) => !A[k]), seulA = ka.filter((k) => !E[k]), diff = ke.filter((k) => A[k] && A[k] !== E[k]);
    n++; const bad = seulE.length || seulA.length || diff.length; if (bad) ko++;
    console.log(' ', bad ? '❌' : '✅', id, J[id][0], 'ESPN', ke.length, 'ARCH', ka.length, 'seulESPN', seulE.slice(0, 3).map((k) => E[k]).join('|'), 'seulARCH', seulA.slice(0, 3).map((k) => A[k]).join('|'), 'diff', diff.slice(0, 3).map((k) => E[k] + '≠' + A[k]).join('|'));
  }
}
console.log('JOUEURS', n, 'différents', ko);
