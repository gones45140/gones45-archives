import fs from 'fs';
const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const SPN = { hockey: 'hockey', basketball: 'basket', football: 'football-us' };
const SA = (lg, an) => lg === 'nfl' ? an + '-' + String(an + 1).slice(2) : (an - 1) + '-' + String(an).slice(2);
let tot = 0, bad = 0;
for (const [sp, lg, ids, ans] of [['hockey', 'nhl', ['25', '1', '21'], [2023, 2024, 2025, 2026, 2027]], ['basketball', 'nba', ['13', '2', '9'], [2023, 2024, 2025, 2026, 2027]], ['football', 'nfl', ['14', '21', '12'], [2022, 2023, 2024, 2025, 2026]]]) {
  for (const tid of ids) for (const an of ans) {
    const j = await g(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/teams/${tid}/schedule?season=${an}&seasontype=2`);
    const E = {};
    for (const e of (j && j.events) || []) { const c = (e.competitions || [])[0] || {}, st = (c.status && c.status.type) || {}; if (st.completed !== true) continue; const cs = c.competitors || []; const h = cs.find(x => x.homeAway === 'home'), a = cs.find(x => x.homeAway === 'away'); const sv = (x) => { let v = x.score; if (v && typeof v === 'object') v = v.value ?? v.displayValue; return parseInt(v, 10); }; const tx = String(st.detail || st.shortDetail || st.description || ''); const ox = sp !== 'hockey' ? 0 : (/\bSO\b/i.test(tx) ? 2 : (/\bOT\b/i.test(tx) ? 1 : 0)); E[e.id] = [e.date.slice(0, 10), sv(h) + '-' + sv(a), ox].join(' '); }
    const A = {}; let manqueTy = 0;
    try { const q = JSON.parse(fs.readFileSync(`cotes/${SPN[sp]}/${lg}/${SA(lg, an)}/equipes/${tid}.json`)); for (const m of q.m) { if (!m[4]) continue; if (!(m[5] >= 0)) manqueTy++; if (m[5] !== 2) continue; A[m[2]] = [new Date(m[0]).toISOString().slice(0, 10), m[4][0] + '-' + m[4][1], sp === 'hockey' ? (m[6] || 0) : 0].join(' '); } } catch (e) {}
    const ke = Object.keys(E), ka = Object.keys(A), seulE = ke.filter(k => !A[k]), seulA = ka.filter(k => !E[k]), diff = ke.filter(k => A[k] && A[k] !== E[k]);
    tot++; const ko = seulE.length || seulA.length || diff.length || manqueTy; if (ko) bad++;
    console.log((ko ? '❌' : '✅'), lg, tid, an, 'ESPN', ke.length, 'ARCH', ka.length, 'sansType', manqueTy, 'seulESPN', seulE.slice(0, 2).map(k => E[k]).join('|'), 'seulARCH', seulA.slice(0, 2).map(k => A[k]).join('|'), 'diff', diff.slice(0, 2).map(k => E[k] + '≠' + A[k]).join('|'));
  }
}
console.log('SAISONS', tot, 'différentes', bad);
