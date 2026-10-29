// Compare, match par match, les joueurs d'ESPN (summary, comme _g45JouLireMatch / _g45JouPresents) et ceux des archives (fiche.st)
import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const SPN = { hockey: 'hockey', basketball: 'basket', football: 'football-us' };
const COLS = { hockey: { G: ['G'], A: ['A'] }, basketball: { PTS: ['PTS'], REB: ['REB'], AST: ['AST'], '3PT': ['3PT'] }, football: { rTD: ['rushing', 'TD'], reTD: ['receiving', 'TD'], pTD: ['passing', 'TD'] } };
let nM = 0, ko = 0;
for (const [sp, lg, sa, tid] of [['hockey', 'nhl', '2024-25', '25'], ['hockey', 'nhl', '2025-26', '1'], ['basketball', 'nba', '2024-25', '13'], ['basketball', 'nba', '2025-26', '2'], ['football', 'nfl', '2024-25', '14'], ['football', 'nfl', '2025-26', '12']]) {
  const B = `cotes/${SPN[sp]}/${lg}/${sa}`; const q = JSON.parse(fs.readFileSync(`${B}/equipes/${tid}.json`)); const et = JSON.parse(fs.readFileSync(`${B}/etat.json`));
  console.log(lg, sa, tid, 'etat', JSON.stringify(et));
  const L = q.m.filter((m) => m[4] && m[5] === 2).slice(0, 12);
  for (const m of L) {
    const D = JSON.parse(fs.readFileSync(`${B}/matchs/${m[1]}.json`)), fi = D[m[2]], k = m[3];
    const sm = await g(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/summary?event=${m[2]}`); if (!sm) continue;
    const bloc = ((sm.boxscore || {}).players || []).find((x) => String((x.team || {}).id) === String(tid)); if (!bloc) continue;
    const E = {}, P = new Set();
    for (const c of bloc.statistics || []) { const lab = c.labels || [], cn = c.name || c.type || '';
      for (const a of c.athletes || []) { if (a.didNotPlay) continue; const id = String((a.athlete || {}).id || ''); if (!id) continue; P.add(id);
        for (const [cle, def] of Object.entries(COLS[sp])) { const col = def.length === 2 ? (cn === def[0] ? lab.indexOf(def[1]) : -1) : lab.indexOf(def[0]); if (col < 0) continue; let v = (a.stats || [])[col]; v = cle === '3PT' ? parseInt(String(v || '').split('-')[0], 10) : parseFloat(v); if (v > 0) (E[id] = E[id] || {})[cle] = ((E[id] || {})[cle] || 0) + v; } } }
    const A = {}, PA = new Set();
    for (const [id, o] of Object.entries(fi.st || {})) { if (o.k !== k) continue; if (o.s.J) PA.add(id); for (const cle of Object.keys(COLS[sp])) if (o.s[cle] > 0) (A[id] = A[id] || {})[cle] = o.s[cle]; }
    const pE = [...P].sort().join(','), pA = [...PA].sort().join(','), sE = JSON.stringify(Object.keys(E).sort().map((x) => [x, E[x]])), sA = JSON.stringify(Object.keys(A).sort().map((x) => [x, A[x]]));
    nM++; const bad = pE !== pA || sE !== sA; if (bad) { ko++; console.log('  ❌', m[2], 'présents ESPN', P.size, 'ARCH', PA.size, 'stats', sE === sA ? 'ok' : (sE.slice(0, 200) + ' ≠ ' + sA.slice(0, 200))); }
  }
}
console.log('MATCHS', nM, 'différents', ko);
