import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
// 1) remplaçants : clés du roster d'un match fini
const sm = await g('https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/summary?event=' + Object.keys(JSON.parse(fs.readFileSync('cotes/foot/fra.1/2025-26/matchs/2026-03.json')))[0]);
const ro = (sm.rosters || [])[0] || {}; const p = (ro.roster || []);
console.log('ROSTER KEYS', JSON.stringify(Object.keys(p[0] || {})));
for (const x of p.slice(0, 25)) console.log('  ', x.athlete && x.athlete.displayName, 'starter', x.starter, 'subbedIn', JSON.stringify(x.subbedIn), 'subbedOut', JSON.stringify(x.subbedOut), 'active', x.active, 'nst', (x.stats || []).length, (x.stats||[]).filter(s=>s.value).map(s=>s.name).join(','));
// 2) comparaison calendrier ESPN / archive
const SA = (an) => an + '-' + String(an + 1).slice(2);
let bad = 0, tot = 0;
for (const [lg, tid] of [['fra.1', '167'], ['fra.1', '160'], ['eng.1', '364'], ['esp.1', '86'], ['ger.1', '132']]) {
  for (const an of [2022, 2023, 2024, 2025, 2026]) {
    const j = await g(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg}/teams/${tid}/schedule?season=${an}`);
    const E = {}; for (const e of (j && j.events) || []) { const c = (e.competitions || [])[0] || {}; if (!(c.status && c.status.type && c.status.type.completed)) continue; const cs = c.competitors || []; const h = cs.find(x => x.homeAway === 'home'), a = cs.find(x => x.homeAway === 'away'); const sv = (x) => { let v = x.score; if (v && typeof v === 'object') v = v.value ?? v.displayValue; return parseInt(v, 10); }; E[e.id] = [e.date.slice(0, 10), sv(h) + '-' + sv(a)]; }
    let A = {}; try { const q = JSON.parse(fs.readFileSync(`cotes/foot/${lg}/${SA(an)}/equipes/${tid}.json`)); for (const m of q.m) if (m[4]) A[m[2]] = [new Date(m[0]).toISOString().slice(0, 10), m[4][0] + '-' + m[4][1]]; } catch (e) {}
    const ke = Object.keys(E), ka = Object.keys(A), seulE = ke.filter(k => !A[k]), seulA = ka.filter(k => !E[k]), diff = ke.filter(k => A[k] && (A[k][0] !== E[k][0] || A[k][1] !== E[k][1]));
    tot++; if (seulE.length || seulA.length || diff.length) bad++;
    console.log(lg, tid, an, 'ESPN', ke.length, 'ARCH', ka.length, 'seulESPN', seulE.slice(0, 3).map(k => E[k].join(' ')).join('|'), 'seulARCH', seulA.slice(0,3).map(k => A[k].join(' ')).join('|'), 'diff', diff.slice(0, 3).map(k => E[k].join(' ') + '≠' + A[k].join(' ')).join('|'));
  }
}
console.log('SAISONS', tot, 'differentes', bad);
// 3) gamelog joueur vs archive (Mbappé esp.1 2025, Lacazette?)
for (const [lg, an, pid] of [['esp.1', 2025, '231388'], ['fra.1', 2025, '163474']]) {
  const j = await g(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${pid}/gamelog?season=${an}&league=${lg}`);
  let n = 0, gl = 0; for (const st of (j && j.seasonTypes) || []) for (const c of st.categories || []) for (const e of c.events || []) { n++; gl += +e.stats[(j.names||[]).indexOf('totalGoals')] || 0; }
  let A = null; try { A = JSON.parse(fs.readFileSync(`cotes/foot/${lg}/${SA(an)}/joueurs/${pid}.json`)); } catch (e) {}
  console.log('JOUEUR', pid, lg, an, 'ESPN matchs', n, 'buts', gl, '| ARCH matchs', A && A.m.length, 'buts', A && A.m.reduce((t, m) => t + ((m[4] || {}).G || 0), 0));
}
