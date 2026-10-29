// NBA : journal ESPN (comme _g45NbaGLLire / MetaLire) vs archives (comme _g45ArchNbaGL)
import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
let n = 0, ko = 0, ex = 0;
for (const an of [2025, 2026]) {
  const B = `cotes/basket/nba/${an - 1}-${String(an).slice(2)}`, ix = JSON.parse(fs.readFileSync(`${B}/equipes.json`)), et = JSON.parse(fs.readFileSync(`${B}/etat.json`));
  console.log(B, JSON.stringify(et));
  const J = JSON.parse(fs.readFileSync(`${B}/joueurs.json`)); const ids = Object.keys(J).sort((a, b) => J[b][2] - J[a][2]).slice(0, 10);
  for (const aid of ids) {
    const j = await g(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${aid}/gamelog?season=${an}`);
    const names = j.names || [], labels = j.labels || [], col = (nm, lab) => { let i = names.indexOf(nm); if (i < 0) i = labels.indexOf(lab); return i; };
    const I = [col('minutes', 'MIN'), col('points', 'PTS'), col('totalRebounds', 'REB'), col('assists', 'AST'), col('threePointFieldGoalsMade-threePointFieldGoalsAttempted', '3PT'), col('steals', 'STL'), col('blocks', 'BLK'), col('turnovers', 'TO')];
    const num = (v) => { const x = parseFloat(String(v ?? '').split('-')[0]); return isNaN(x) ? null : x; };
    const E = {}; for (const t of j.seasonTypes || []) for (const c of t.categories || []) for (const e of c.events || []) { if (!e || !e.eventId || !e.stats) continue; if (I[1] < 0 || num(e.stats[I[1]]) === null) continue; E[e.eventId] = I.map((i) => i >= 0 ? num(e.stats[i]) : null).join(','); }
    if (!ex) { const k0 = Object.keys(j.events || {})[0], v = (j.events || {})[k0] || {}; console.log('META ESPN ex', JSON.stringify({ atVs: v.atVs, score: v.score, res: v.gameResult, opp: v.opponent && v.opponent.abbreviation, home: v.homeTeamId, away: v.awayTeamId })); ex = 1; }
    const q = JSON.parse(fs.readFileSync(`${B}/joueurs/${aid}.json`)), A = {}, cache = {};
    for (const m of q.m) { if (!m[4]) continue; const ef = `${B}/equipes/${m[3]}.json`; cache[ef] = cache[ef] || JSON.parse(fs.readFileSync(ef)); const em = cache[ef].m.find((x) => String(x[2]) === String(m[2])); if (!em || em[5] === 1 || !em[4]) continue; const s = m[4], nn = (k) => +s[k] || 0; A[m[2]] = [nn('MIN'), nn('PTS'), nn('REB'), nn('AST'), nn('3PT'), nn('INT'), nn('CTR'), nn('BP')].join(','); }
    const ke = Object.keys(E), ka = Object.keys(A), seulE = ke.filter((k) => !A[k]), seulA = ka.filter((k) => !E[k]), diff = ke.filter((k) => A[k] && A[k] !== E[k]);
    n++; const bad = seulE.length || seulA.length || diff.length; if (bad) ko++;
    console.log(bad ? '❌' : '✅', an, aid, J[aid][0], 'ESPN', ke.length, 'ARCH', ka.length, 'seulESPN', seulE.slice(0, 2).map((k) => k + ':' + E[k]).join('|'), 'seulARCH', seulA.slice(0, 2).map((k) => k + ':' + A[k]).join('|'), 'diff', diff.slice(0, 2).map((k) => E[k] + '≠' + A[k]).join('|'));
  }
}
console.log('JOUEURS', n, 'différents', ko);
